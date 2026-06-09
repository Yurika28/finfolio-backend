'use client'
import { use } from 'react'
import Navbar from '@/components/features/navigation-bar'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCryptoOne } from '@/hooks/useCrypto'
import { useNews } from '@/hooks/useNews'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import Link from 'next/link'

const CRYPTO_ICONS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', DOGE: 'Ð', SOL: '◎', ADA: '₳', XRP: '✕',
}

export default function CryptoPairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = use(params)
  const [symbol, market = 'USD'] = pair.split('-').map(s => s.toUpperCase())

  const { data: rate, isLoading, error } = useCryptoOne(symbol)
  const { data: news, isLoading: nLoading } = useNews()

  const cryptoNews = news?.filter(item =>
    item.headline?.toLowerCase().includes(symbol.toLowerCase()) ||
    item.category?.toLowerCase().includes('crypto') ||
    item.category?.toLowerCase().includes('blockchain')
  )

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{CRYPTO_ICONS[symbol] || '🪙'}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {symbol} / {market}
              </h1>
              <p className="text-zinc-500 text-sm">Cryptocurrency pair</p>
            </div>
          </div>
          <Link href="/crypto" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Crypto
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Rate Card */}
        {isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : rate ? (
          <Card className="bg-zinc-900 border-zinc-800 max-w-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm font-normal">Exchange Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{formatCurrency(rate.exchangeRate)}</p>
              <p className="text-xs text-zinc-500 mt-2">
                1 {rate.fromSymbol} = {formatCurrency(rate.exchangeRate)} {rate.toSymbol}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Updated {new Date(rate.insertedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Related News */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Related News</h2>
          {nLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : cryptoNews && cryptoNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cryptoNews.slice(0, 6).map((item, i) => (
                <a
                  key={i}
                  href={item.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
                >
                  <p className="text-sm font-medium text-white line-clamp-2">{item.headline}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {item.source} · {item.datetime ? formatDate(new Date(item.datetime * 1000).toISOString()) : ''}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No related news found.</p>
          )}
        </div>

      </main>
    </div>
  )
}
