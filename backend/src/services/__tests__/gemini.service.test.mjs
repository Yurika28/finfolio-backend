/**
 * gemini.service tests
 *
 * SDK note
 * ────────
 * The service uses @google/genai (GoogleGenAI), NOT the older
 * @google/generative-ai package. We mock config/gemini (the module that
 * instantiates and exports the client) rather than the SDK package itself,
 * because that is what the service actually requires.
 *
 * Mock strategy — createRequire + module cache injection
 * ──────────────────────────────────────────────────────
 * Vitest 4.x is ESM-only; vi.mock() cannot bridge the ESM/CJS registry
 * boundary. Instead we inject plain objects into Node's module cache under
 * each dependency's absolute path before loading the service, so the service's
 * require() calls resolve to our mocks, never the real SDK or DB.
 *
 * Covered scenarios
 * ─────────────────
 * generateMarketSummary
 *   1. Calls Gemini once and returns the generated text
 *   2. Upserts to insight table with type "daily_summary"
 *   3. Fetches data from stocks, crypto, and news tables
 * analyzeStock
 *   4. Cache hit — returns DB content, never calls Gemini
 *   5. Cache miss — calls Gemini with prompt containing the ticker symbol
 *   6. Upserts result with type "stock:<symbol>"
 * chatWithContext
 *   7. Returns the generated text
 *   8. Prompt contains the user message and SAFETY_NOTE
 *   9. Prompt includes chat history when provided
 *   10. Works with the default empty history
 *   11. Queries top movers from the DB (never skips the DB fetch)
 *   12. Does NOT write anything to the insight table
 * Error / edge cases (all three functions share generate())
 *   13. SDK rejection propagates unchanged — no error-message wrapping
 *   14. Empty-string response throws "Empty response from Gemini"
 *   15. Whitespace-only response passes through (guard is !text, not !text.trim())
 *   16. Throws before DB write on empty response — insight table stays clean
 */

import { createRequire } from 'module'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const _require = createRequire(import.meta.url)

// Absolute cache keys — must match what the service's require() resolves to
const GEMINI_PATH       = _require.resolve('../../config/gemini')
const PRISMA_PATH       = _require.resolve('../../config/prisma')
const DATE_HELPERS_PATH = _require.resolve('../../utils/dateHelpers')
const SERVICE_PATH      = _require.resolve('../gemini.service.js')

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GENERATED_TEXT = 'Markets showed mixed signals today. Tech led gains while energy lagged.'

const MOCK_STOCK  = { symbol: 'AAPL', dp: 1.5,  close: 150 }
const MOCK_CRYPTO = { fromSymbol: 'BTC', exchangeRate: 65000 }
const MOCK_NEWS   = { headline: 'Fed holds rates steady' }

// ── State populated by loadWithMocks() in beforeEach ─────────────────────────

let mockGenAI, prisma
let generateMarketSummary, analyzeStock, chatWithContext

function cacheEntry(filepath, exports) {
  return { id: filepath, filename: filepath, loaded: true, exports, children: [], paths: [] }
}

function loadWithMocks() {
  // 1. Evict stale cache entries so the service re-evaluates its require()s.
  delete _require.cache[GEMINI_PATH]
  delete _require.cache[PRISMA_PATH]
  delete _require.cache[DATE_HELPERS_PATH]
  delete _require.cache[SERVICE_PATH]

  // 2. Build mock objects with vi.fn() for assertion.
  //    The service calls genAI.models.generateContent({ model, contents })
  //    and reads response.text from the result.
  mockGenAI = {
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: GENERATED_TEXT }),
    },
  }

  // Prisma mock covers every model method used by all three service functions.
  prisma = {
    stockPrice:         { findMany: vi.fn().mockResolvedValue([MOCK_STOCK]), findFirst: vi.fn().mockResolvedValue(null) },
    cryptoCurrencyRate: { findMany: vi.fn().mockResolvedValue([MOCK_CRYPTO]) },
    marketNews:         { findMany: vi.fn().mockResolvedValue([MOCK_NEWS]) },
    companyProfile:     { findFirst: vi.fn().mockResolvedValue(null) },
    companyNews:        { findMany: vi.fn().mockResolvedValue([]) },
    weeklyChart:        { findMany: vi.fn().mockResolvedValue([]) },
    insight:            { findFirst: vi.fn().mockResolvedValue(null), upsert: vi.fn().mockResolvedValue({}) },
  }

  // 3. Inject mocks into Node's module cache BEFORE requiring the service.
  _require.cache[GEMINI_PATH]       = cacheEntry(GEMINI_PATH, mockGenAI)
  _require.cache[PRISMA_PATH]       = cacheEntry(PRISMA_PATH, prisma)
  _require.cache[DATE_HELPERS_PATH] = cacheEntry(DATE_HELPERS_PATH, {
    sixHoursAgo: vi.fn().mockReturnValue(new Date('2024-01-01T00:00:00Z')),
  })

  // 4. Load the service — its require() calls hit the entries above.
  const svc             = _require(SERVICE_PATH)
  generateMarketSummary = svc.generateMarketSummary
  analyzeStock          = svc.analyzeStock
  chatWithContext       = svc.chatWithContext
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(loadWithMocks)

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('gemini.service', () => {

  // ── Mock boundary ────────────────────────────────────────────────────────────

  it('mock boundary: Gemini SDK and prisma are never real implementations', () => {
    expect(vi.isMockFunction(mockGenAI.models.generateContent)).toBe(true)
    expect(vi.isMockFunction(prisma.insight.upsert)).toBe(true)
    expect(vi.isMockFunction(prisma.stockPrice.findMany)).toBe(true)
    // The real GoogleGenAI client is NEVER instantiated and the real DB is NEVER
    // queried during any test in this file.
  })

  // ── generateMarketSummary ─────────────────────────────────────────────────────

  describe('generateMarketSummary', () => {
    it('calls Gemini once and returns the generated text string', async () => {
      const result = await generateMarketSummary()

      expect(mockGenAI.models.generateContent).toHaveBeenCalledOnce()
      expect(result).toBe(GENERATED_TEXT)
      // Proves: the function forwards the assembled prompt to Gemini and returns
      // the text field — not an object, not undefined.
    })

    it('upserts the generated text to the insight table with type "daily_summary"', async () => {
      await generateMarketSummary()

      expect(prisma.insight.upsert).toHaveBeenCalledOnce()
      const { where, update, create } = prisma.insight.upsert.mock.calls[0][0]
      expect(where).toEqual({ type: 'daily_summary' })
      expect(update.content).toBe(GENERATED_TEXT)
      expect(create.content).toBe(GENERATED_TEXT)
      // Proves: the summary is persisted so subsequent dashboard requests serve
      // this row without re-calling Gemini on every page load.
    })

    it('queries stocks, crypto rates, and market news to build the prompt', async () => {
      await generateMarketSummary()

      expect(prisma.stockPrice.findMany).toHaveBeenCalledOnce()
      expect(prisma.cryptoCurrencyRate.findMany).toHaveBeenCalledOnce()
      expect(prisma.marketNews.findMany).toHaveBeenCalledOnce()
      // Proves: all three data sources are fetched — missing any one would produce
      // an incomplete prompt and a low-quality summary.
    })

    it('sends a prompt that includes SAFETY_NOTE text', async () => {
      await generateMarketSummary()

      const { contents } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(contents).toContain('Never provide investment advice')
      // Proves: the safety disclaimer is always included in the Gemini request —
      // it is not conditional on the data shape.
    })
  })

  // ── analyzeStock ──────────────────────────────────────────────────────────────

  describe('analyzeStock', () => {
    it('cache hit: returns DB content and does NOT call Gemini', async () => {
      prisma.insight.findFirst.mockResolvedValueOnce({
        type: 'stock:MSFT', content: 'Cached analysis for MSFT.', generatedAt: new Date(),
      })

      const result = await analyzeStock('MSFT')

      expect(mockGenAI.models.generateContent).not.toHaveBeenCalled()
      expect(result).toBe('Cached analysis for MSFT.')
      // Proves: the 6-hour TTL cache prevents repeated Gemini calls for the same
      // ticker within the window — the most expensive operation in the service.
    })

    it('cache miss: sends a prompt containing the ticker symbol to Gemini', async () => {
      await analyzeStock('AAPL')

      expect(mockGenAI.models.generateContent).toHaveBeenCalledOnce()
      const { model, contents } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(model).toBe('gemini-2.5-flash')
      expect(contents).toContain('AAPL')
      // Proves: the symbol is embedded in the prompt so Gemini analyses the correct
      // ticker — a wrong symbol here means a completely wrong response.
    })

    it('cache miss: upserts the result with type "stock:<symbol>"', async () => {
      await analyzeStock('NVDA')

      expect(prisma.insight.upsert).toHaveBeenCalledOnce()
      const { where, update, create } = prisma.insight.upsert.mock.calls[0][0]
      expect(where).toEqual({ type: 'stock:NVDA' })
      expect(update.content).toBe(GENERATED_TEXT)
      expect(create.content).toBe(GENERATED_TEXT)
      // Proves: the per-symbol key is scoped correctly — NVDA's cache cannot
      // collide with AAPL's or the daily_summary row.
    })

    it('calls Gemini with the thinkingBudget:0 config to disable reasoning tokens', async () => {
      await analyzeStock('TSLA')

      const { config } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(config).toEqual({ thinkingConfig: { thinkingBudget: 0 } })
      // Proves: thinkingBudget:0 is always set — reasoning tokens on 2.5-flash
      // would inflate latency and cost without improving factual summaries.
    })
  })

  // ── chatWithContext ───────────────────────────────────────────────────────────

  describe('chatWithContext', () => {
    it('returns the generated text', async () => {
      const result = await chatWithContext('What is the market doing?')

      expect(result).toBe(GENERATED_TEXT)
      // Proves: the function returns whatever Gemini produces — it does not
      // wrap or transform the response.
    })

    it('calls Gemini exactly once per message', async () => {
      await chatWithContext('Any news on AAPL?')

      expect(mockGenAI.models.generateContent).toHaveBeenCalledOnce()
    })

    it('prompt contains the user message', async () => {
      const message = 'Should I watch Bitcoin today?'
      await chatWithContext(message)

      const { contents } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(contents).toContain(message)
      // Proves: the user's question reaches Gemini — it is not accidentally dropped
      // when the contextual prefix is prepended.
    })

    it('prompt contains the SAFETY_NOTE', async () => {
      await chatWithContext('Tell me what to buy')

      const { contents } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(contents).toContain('Never provide investment advice')
      // Proves: the safety disclaimer is applied to chat as well — not just the
      // scheduled summary endpoint.
    })

    it('prompt includes chat history entries when provided', async () => {
      const history = [
        { role: 'user',      content: 'How is Tesla?' },
        { role: 'assistant', content: 'Tesla is up 3% today.' },
      ]
      await chatWithContext('Any more detail?', history)

      const { contents } = mockGenAI.models.generateContent.mock.calls[0][0]
      expect(contents).toContain('How is Tesla?')
      expect(contents).toContain('Tesla is up 3% today.')
      // Proves: history is embedded in the prompt so Gemini has conversational
      // context — without this, follow-up questions lose all prior context.
    })

    it('works correctly with the default empty history', async () => {
      // No history argument — uses the default []
      await expect(chatWithContext('What is the S&P doing?')).resolves.toBe(GENERATED_TEXT)
      // Proves: history is optional and defaults to [] — callers don't need to
      // pass an empty array explicitly.
    })

    it('queries top 5 movers from the DB to build market context', async () => {
      await chatWithContext('Give me a summary')

      expect(prisma.stockPrice.findMany).toHaveBeenCalledOnce()
      const { orderBy, take } = prisma.stockPrice.findMany.mock.calls[0][0]
      expect(orderBy).toEqual({ dp: 'desc' })
      expect(take).toBe(5)
      // Proves: top movers are always fetched fresh per chat message — chat context
      // is never stale even during active sessions.
    })

    it('does NOT write to the insight table — chat is stateless on the DB side', async () => {
      await chatWithContext('What is happening with crypto?')

      expect(prisma.insight.upsert).not.toHaveBeenCalled()
      expect(prisma.insight.findFirst).not.toHaveBeenCalled()
      // Proves: unlike analyzeStock, chat responses are not cached — every message
      // triggers a fresh Gemini call to keep responses contextual and current.
    })
  })

  // ── Error / edge cases (shared generate() helper) ────────────────────────────

  describe('error handling', () => {
    it('propagates the raw SDK error without wrapping or modifying the message', async () => {
      mockGenAI.models.generateContent.mockRejectedValueOnce(
        new Error('503 UNAVAILABLE: The model is overloaded.')
      )

      await expect(generateMarketSummary()).rejects.toThrow('503 UNAVAILABLE: The model is overloaded.')
      // Proves: the service does NOT wrap errors with a custom prefix — callers
      // receive the original SDK message, which may be needed for retry logic or
      // monitoring pattern-matching.
    })

    it('propagates timeout / deadline errors unchanged', async () => {
      mockGenAI.models.generateContent.mockRejectedValueOnce(
        new Error('DEADLINE_EXCEEDED: request timed out')
      )

      await expect(chatWithContext('hello')).rejects.toThrow('DEADLINE_EXCEEDED: request timed out')
      // Proves: timeout errors are not swallowed — the caller (route handler or
      // cron job) is responsible for deciding whether to retry.
    })
  })

  describe('empty response guard', () => {
    it('throws "Empty response from Gemini" when response.text is an empty string', async () => {
      mockGenAI.models.generateContent.mockResolvedValueOnce({ text: '' })

      await expect(generateMarketSummary()).rejects.toThrow('Empty response from Gemini')
      // Proves: an empty text (e.g. safety filter triggered, quota hit) does NOT
      // propagate as a silent empty response — callers always get either text or
      // a catchable error.
    })

    it('throws "Empty response from Gemini" when response.text is null/undefined', async () => {
      mockGenAI.models.generateContent.mockResolvedValueOnce({ text: null })

      await expect(analyzeStock('AAPL')).rejects.toThrow('Empty response from Gemini')
      // Proves: a missing text field (malformed SDK response) is caught by the
      // same guard — not a separate undefined-check branch.
    })

    it('throws "Empty response from Gemini" when response.text is whitespace-only', async () => {
      mockGenAI.models.generateContent.mockResolvedValueOnce({ text: '   \n  ' })

      await expect(generateMarketSummary()).rejects.toThrow('Empty response from Gemini')
      // Guard is !text || !text.trim() — whitespace-only is treated as empty so it
      // never reaches the insight upsert or the caller.
    })

    it('does NOT write to the insight table when the whitespace guard fires', async () => {
      mockGenAI.models.generateContent.mockResolvedValueOnce({ text: '   \n  ' })

      await generateMarketSummary().catch(() => {})

      expect(prisma.insight.upsert).not.toHaveBeenCalled()
      // Proves: the whitespace guard fires before the DB write — same guarantee as
      // the empty-string guard, so callers never receive blank content from the DB.
    })

    it('does NOT write to the insight table when the empty-string guard fires', async () => {
      mockGenAI.models.generateContent.mockResolvedValueOnce({ text: '' })

      await generateMarketSummary().catch(() => {})

      expect(prisma.insight.upsert).not.toHaveBeenCalled()
      // Proves: the guard fires BEFORE the DB write — the insight table never
      // contains a blank row that would silently serve empty content to users.
    })
  })
})
