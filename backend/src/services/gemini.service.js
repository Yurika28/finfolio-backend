// src/services/gemini.service.js
const genAI = require('../config/gemini')
const prisma = require('../config/prisma')
const { sixHoursAgo } = require('../utils/dateHelpers')

const MODEL = 'gemini-2.5-flash'
const SAFETY_NOTE = 'Never provide investment advice. State data as factual observations only.'

// Helper — single reusable function for all Gemini calls
// thinkingBudget:0 disables reasoning tokens on 2.5-flash, making it behave like a standard model
const generate = async (prompt) => {
  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    })
    const text = response.text
    if (!text || !text.trim()) throw new Error('Empty response from Gemini')
    return text
  } catch (err) {
    console.error('[Gemini] generateContent failed:', err?.message ?? err)
    throw err
  }
}

// 1. Daily market summary — called by cron, cached in DB
const generateMarketSummary = async () => {
  const [stocks, crypto, news] = await Promise.all([
    prisma.stockPrice.findMany({ orderBy: { dp: 'desc' }, take: 10 }),
    prisma.cryptoCurrencyRate.findMany(),
    prisma.marketNews.findMany({ orderBy: { datetime: 'desc' }, take: 5 })
  ])

  const prompt = `${SAFETY_NOTE}
  Write a concise daily market summary (3 paragraphs max) based on:
  Top stocks: ${JSON.stringify(stocks.map(s => ({ symbol: s.symbol, change: s.dp })))}
  Crypto: ${JSON.stringify(crypto.map(c => ({ pair: c.fromSymbol, rate: c.exchangeRate })))}
  Headlines: ${news.map(n => n.headline).join(' | ')}
  Focus on notable moves and trends. Be factual, not advisory.`

  const text = await generate(prompt)

  await prisma.insight.upsert({
    where: { type: 'daily_summary' },
    update: { content: text, generatedAt: new Date() },
    create: { type: 'daily_summary', content: text }
  })

  return text
}

// 2. Individual stock analysis — GET /api/insights/stock/:symbol
const analyzeStock = async (symbol) => {
  const cached = await prisma.insight.findFirst({
    where: { type: `stock:${symbol}`, generatedAt: { gte: sixHoursAgo() } }
  })
  if (cached) return cached.content

  const [quote, profile, news, chart] = await Promise.all([
    prisma.stockPrice.findFirst({ where: { symbol } }),
    prisma.companyProfile.findFirst({ where: { ticker: symbol } }),
    prisma.companyNews.findMany({ where: { symbol }, take: 5, orderBy: { datetime: 'desc' } }),
    prisma.weeklyChart.findMany({ where: { symbol }, take: 12, orderBy: { date: 'desc' } })
  ])

  const prompt = `${SAFETY_NOTE}
  Analyze ${symbol} in 2 paragraphs using only this data:
  Price: $${quote?.close} (${quote?.dp > 0 ? '+' : ''}${quote?.dp}% today)
  Company: ${profile?.name}, ${profile?.finnhubIndustry}
  12-week closes: ${chart.map(c => c.close).join(', ')}
  Recent headlines: ${news.map(n => n.headline).join(' | ')}
  Paragraph 1: price action and trend. Paragraph 2: news context.`

  const text = await generate(prompt)

  await prisma.insight.upsert({
    where: { type: `stock:${symbol}` },
    update: { content: text, generatedAt: new Date() },
    create: { type: `stock:${symbol}`, content: text }
  })

  return text
}

// 3. Market chat — POST /api/chat { message, history[] }
const chatWithContext = async (message, history = []) => {
  const topMovers = await prisma.stockPrice.findMany({
    orderBy: { dp: 'desc' }, take: 5
  })

  // Gemini handles chat history differently — prepend context to message
  const contextualMessage = `${SAFETY_NOTE}
  Today's top movers: ${topMovers.map(s => `${s.symbol} ${s.dp > 0 ? '+' : ''}${s.dp}%`).join(', ')}
  
  Chat history: ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
  
  User question: ${message}`

  return await generate(contextualMessage)
}

module.exports = { generateMarketSummary, analyzeStock, chatWithContext }