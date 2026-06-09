'use client'
import { use } from 'react'
import Navbar from '@/components/features/navigation-bar'
import { StockChart } from '@/components/stocks/StockChart'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStockQuote, useStockProfile } from '@/hooks/useStocks'
import { useCompanyNews } from '@/hooks/useNews'
import { formatCurrency, formatLargeNumber } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { changeColor } from '@/utils/formatChange'
import Link from 'next/link'
import type { ICompanyNews } from '@/types/api.types'

function NewsItem({ item }: { item: ICompanyNews }) {
  return (
    <a
      href={item.url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
    >
      <p className="text-sm font-medium text-white line-clamp-2">{item.headline}</p>
      <p className="text-xs text-zinc-500 mt-1">
        {item.source} · {formatDate(item.datetime ? new Date(item.datetime * 1000).toISOString() : '')}
      </p>
    </a>
  )
}

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const ticker = symbol.toUpperCase()

  const { data: quote, isLoading: qLoading, error: qError } = useStockQuote(ticker)
  const { data: profile, isLoading: pLoading } = useStockProfile(ticker)
  const { data: news, isLoading: nLoading } = useCompanyNews(ticker)

  const change = quote ? quote.d ?? 0 : 0
  const changePct = quote ? quote.dp ?? 0 : 0

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{ticker}</h1>
              {profile && (
                <span className="text-zinc-400 text-lg">{profile.name}</span>
              )}
            </div>
            {profile && (
              <p className="text-zinc-500 text-sm mt-1">{profile.exchange} · {profile.finnhubIndustry}</p>
            )}
          </div>
          <Link href="/stocks" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Stocks
          </Link>
        </div>

        {qError && <ErrorMessage message={qError} />}

        {/* Quote + Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price card */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm font-normal">Current Price</CardTitle>
            </CardHeader>
            <CardContent>
              {qLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : quote ? (
                <>
                  <p className="text-4xl font-bold text-white">{formatCurrency(quote.close)}</p>
                  <p className={`text-sm mt-1 font-medium ${changeColor(change)}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs">
                    {[
                      ['Open', formatCurrency(quote.open)],
                      ['High', formatCurrency(quote.high)],
                      ['Low', formatCurrency(quote.low)],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-zinc-500">{label}</dt>
                        <dd className="text-white font-mono">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Profile card */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm font-normal">Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {pLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : profile ? (
                <>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                    {[
                      ['Industry', profile.finnhubIndustry],
                      ['Exchange', profile.exchange],
                      ['Market Cap', profile.marketCapitalization ? formatLargeNumber(profile.marketCapitalization * 1e6) : null],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-zinc-500">{label}</dt>
                        <dd className="text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {profile.weburl && (
                    <a
                      href={profile.weburl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs text-blue-400 hover:text-blue-300"
                    >
                      {profile.weburl}
                    </a>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Weekly Price Chart</h2>
          <StockChart symbol={ticker} />
        </div>

        {/* Company News */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Latest News</h2>
          {nLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : news && news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {news.slice(0, 6).map((item, i) => <NewsItem key={i} item={item} />)}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No recent news found.</p>
          )}
        </div>

      </main>
    </div>
  )
}
