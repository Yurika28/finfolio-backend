'use client'
import { useState } from 'react'
import Navbar from '@/components/features/navigation-bar'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWatchlist, useHoldings } from '@/hooks/usePortfolio'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import Link from 'next/link'

export default function PortfolioPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [tab, setTab] = useState<'watchlist' | 'holdings'>('watchlist')
  const [symbol, setSymbol] = useState('')

  const watchlist = useWatchlist()
  const holdings  = useHoldings()

  if (!authLoading && !user) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400 mb-4">Sign in to manage your portfolio</p>
          <Link href="/login">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
              Sign In
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const handleAddWatch = async () => {
    if (!symbol.trim()) return
    await watchlist.add(symbol.trim().toUpperCase())
    setSymbol('')
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Portfolio</h1>
            <p className="text-zinc-400 text-sm mt-1">Your watchlist and holdings</p>
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as 'watchlist' | 'holdings')}>
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Watchlist tab */}
        {tab === 'watchlist' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-sm">
              <Input
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                onKeyDown={e => e.key === 'Enter' && handleAddWatch()}
              />
              <Button
                onClick={handleAddWatch}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold shrink-0"
              >
                Watch
              </Button>
            </div>

            {watchlist.error && <ErrorMessage message={watchlist.error} />}

            {watchlist.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            )}

            {!watchlist.isLoading && !watchlist.data?.length && (
              <EmptyState title="No symbols watched" description="Add a ticker above to start tracking" />
            )}

            {watchlist.data && watchlist.data.length > 0 && (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Symbol</TableHead>
                      <TableHead className="text-zinc-400 hidden sm:table-cell">Added</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchlist.data.map(item => (
                      <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900">
                        <TableCell>
                          <Link
                            href={`/stocks/${item.symbol}`}
                            className="text-white font-mono font-medium hover:text-green-400 transition-colors"
                          >
                            {item.symbol}
                          </Link>
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm hidden sm:table-cell">
                          {formatDate(item.addedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => watchlist.remove(item.symbol)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-transparent text-xs"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Holdings tab */}
        {tab === 'holdings' && (
          <div className="space-y-4">
            {holdings.error && <ErrorMessage message={holdings.error} />}

            {holdings.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            )}

            {!holdings.isLoading && !holdings.data?.length && (
              <EmptyState title="No holdings yet" description="Use the + Buy button on any stock or crypto card to add holdings" />
            )}

            {holdings.data && holdings.data.length > 0 && (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Symbol</TableHead>
                      <TableHead className="text-zinc-400 text-right">Shares</TableHead>
                      <TableHead className="text-zinc-400 text-right">Buy Price</TableHead>
                      <TableHead className="text-zinc-400 text-right">Cost Basis</TableHead>
                      <TableHead className="text-zinc-400 hidden md:table-cell">Buy Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.data.map(h => (
                      <TableRow key={h.id} className="border-zinc-800 hover:bg-zinc-900">
                        <TableCell>
                          <Link
                            href={`/stocks/${h.symbol}`}
                            className="text-white font-mono font-medium hover:text-green-400 transition-colors"
                          >
                            {h.symbol}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-zinc-300">{h.shares}</TableCell>
                        <TableCell className="text-right text-zinc-300">{formatCurrency(h.buyPrice)}</TableCell>
                        <TableCell className="text-right text-white font-medium">
                          {formatCurrency(h.shares * h.buyPrice)}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm hidden md:table-cell">
                          {formatDate(h.buyDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
