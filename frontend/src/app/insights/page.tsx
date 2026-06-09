'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/features/navigation-bar'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMarketInsight, useStockInsight } from '@/hooks/useInsights'
import { formatDate } from '@/utils/formatDate'

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-zinc-300 text-sm leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-white font-semibold text-base mt-3">{line.slice(3)}</h3>
        if (line.startsWith('# '))  return <h2 key={i} className="text-white font-bold text-lg mt-4">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-white font-semibold">{line.slice(2, -2)}</p>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export default function InsightsPage() {
  const market  = useMarketInsight()
  const stock   = useStockInsight()
  const [ticker, setTicker] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { market.fetch() }, [])

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Insights</h1>
          <p className="text-zinc-400 text-sm mt-1">Powered by Gemini · market analysis &amp; stock breakdowns</p>
        </div>

        {/* Market Summary */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-lg">Daily Market Summary</CardTitle>
            {market.data?.stale && (
              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                Cached
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {market.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : market.error ? (
              <ErrorMessage message={market.error} />
            ) : market.data ? (
              <>
                <MarkdownContent text={market.data.content} />
                <p className="text-xs text-zinc-600 mt-4">
                  Generated {formatDate(market.data.generatedAt)}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Stock Analysis */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Stock Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 max-w-sm">
              <Input
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                onKeyDown={e => e.key === 'Enter' && ticker && stock.analyze(ticker)}
              />
              <Button
                onClick={() => ticker && stock.analyze(ticker)}
                disabled={!ticker || stock.isLoading}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold shrink-0"
              >
                {stock.isLoading ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>

            {stock.error && <ErrorMessage message={stock.error} />}

            {stock.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : stock.data ? (
              <div>
                <p className="text-zinc-500 text-xs mb-3 font-mono">{stock.data.symbol}</p>
                <MarkdownContent text={stock.data.content} />
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Enter a ticker symbol and press Analyze.</p>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
