const prisma = require('../config/prisma')
const { delay } = require('../utils/delay')
const { STOCK_SYMBOLS, CRYPTO_SYMBOLS } = require('../config/symbols')

const AV_BASE = 'https://www.alphavantage.co/query'
const AV_KEY = () => process.env.ALPHA_VANTAGE_KEY

// Rate limit guard — call this before touching any response data
// Emergency rule: if hit, return without writing — stale cache is better than a crash
const checkRateLimit = (json) => {
  if (json.Information?.includes('rate limit')) {
    console.error('[AlphaVantage] DAILY LIMIT REACHED — aborting sync, stale cache will be served')
    return true
  }
  if (json.Note?.includes('rate limit')) {
    console.warn('[AlphaVantage] Per-minute limit hit — slowing down')
    return true
  }
  return false
}

// Weekly chart — 24hr cache via cron schedule, only called by chartSync.job.js
// Rotates 4 symbols/day to stay within 4 calls/day budget
const syncWeeklyChart = async (symbols) => {
  for (const symbol of symbols) {
    const res = await fetch(
      `${AV_BASE}?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&apikey=${AV_KEY()}`
    )
    const json = await res.json()
    if (checkRateLimit(json)) return

    const series = json['Weekly Adjusted Time Series'] || {}
    if (!Object.keys(series).length) {
      console.warn(`[AlphaVantage] No weekly chart data for ${symbol}`)
      continue
    }

    const rows = Object.entries(series).map(([date, v]) => ({
      symbol,
      date,
      open:         parseFloat(v['1. open']),
      high:         parseFloat(v['2. high']),
      low:          parseFloat(v['3. low']),
      close:        parseFloat(v['4. close']),
      adjustedClose: parseFloat(v['5. adjusted close']),
      volume:       BigInt(v['6. volume'])
    }))

    for (const row of rows) {
      await prisma.weeklyChart.upsert({
        where: { symbol_date: { symbol: row.symbol, date: row.date } },
        update: {
          open: row.open, high: row.high, low: row.low,
          close: row.close, adjustedClose: row.adjustedClose, volume: row.volume
        },
        create: row
      })
    }

    console.log(`[AlphaVantage] Weekly chart synced: ${symbol} (${rows.length} rows)`)
    await delay(1000) // avoid per-minute burst limit between symbols
  }
}

// Crypto prices — 12hr cache via cron schedule, only called by cryptoSync.job.js
// 6 symbols × 2 runs/day = 12 calls/day
const syncCryptoPrices = async (symbols) => {
  for (const symbol of symbols) {
    const res = await fetch(
      `${AV_BASE}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${AV_KEY()}`
    )
    const json = await res.json()
    if (checkRateLimit(json)) return

    const series = json['Time Series (Digital Currency Daily)'] || {}
    const latest = Object.entries(series)[0]
    if (!latest) {
      console.warn(`[AlphaVantage] No crypto data for ${symbol}`)
      continue
    }
    const [date, v] = latest

    // AV changed their field names over time — fall back to the newer key if the old one is absent
    const closePrice = parseFloat(v['4b. close (USD)'] ?? v['4. close'] ?? 0)

    await prisma.cryptoCurrencyRate.upsert({
      where: { fromSymbol_toSymbol: { fromSymbol: symbol, toSymbol: 'USD' } },
      update: { exchangeRate: closePrice, lastRefreshed: date, insertedAt: new Date() },
      create: { fromSymbol: symbol, toSymbol: 'USD', exchangeRate: closePrice, lastRefreshed: date }
    })

    console.log(`[AlphaVantage] Crypto synced: ${symbol}/USD @ ${closePrice}`)
    await delay(1200)
  }
}

// Forex rates — 12hr cache via cron schedule, only called by forexSync.job.js
// 2 pairs × 2 runs/day = 4 calls/day — stores last 30 days of daily OHLC
const syncForexRates = async (pairs) => {
  for (const { from, to } of pairs) {
    const res = await fetch(
      `${AV_BASE}?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${AV_KEY()}`
    )
    const json = await res.json()
    if (checkRateLimit(json)) return

    const series = json['Time Series FX (Daily)'] || {}
    if (!Object.keys(series).length) {
      console.warn(`[AlphaVantage] No forex data for ${from}/${to}`)
      continue
    }

    // Take only the 30 most recent trading days — no point storing years of data
    const rows = Object.entries(series).slice(0, 30).map(([date, v]) => ({
      fromSymbol: from,
      toSymbol:   to,
      date,
      open:  parseFloat(v['1. open']),
      high:  parseFloat(v['2. high']),
      low:   parseFloat(v['3. low']),
      close: parseFloat(v['4. close'])
    }))

    for (const row of rows) {
      await prisma.forexPrice.upsert({
        where: { fromSymbol_toSymbol_date: { fromSymbol: row.fromSymbol, toSymbol: row.toSymbol, date: row.date } },
        update: { open: row.open, high: row.high, low: row.low, close: row.close },
        create: row
      })
    }

    console.log(`[AlphaVantage] Forex synced: ${from}/${to} (${rows.length} rows)`)
    await delay(1200)
  }
}

// News sentiment — called once/day at 6am by newsSync.job.js — 2 calls/day budget
// Returns raw articles for the job to pass as context to Gemini — no DB write needed
// (MarketNews is owned by Finnhub; AV sentiment is ephemeral context, not stored)
const getNewsSentiment = async () => {
  const stockTickers = STOCK_SYMBOLS.join(',')
  const cryptoTickers = CRYPTO_SYMBOLS.map(s => `CRYPTO:${s}`).join(',')
  const tickers = `${stockTickers},${cryptoTickers}`

  const res = await fetch(
    `${AV_BASE}?function=NEWS_SENTIMENT&tickers=${tickers}&sort=LATEST&apikey=${AV_KEY()}`
  )
  const json = await res.json()
  if (checkRateLimit(json)) return []

  const articles = json.feed || []
  console.log(`[AlphaVantage] News sentiment fetched: ${articles.length} articles`)
  return articles
}

module.exports = { syncWeeklyChart, syncCryptoPrices, syncForexRates, getNewsSentiment }
