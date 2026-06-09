'use client'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNewsSentiment } from '@/hooks/useNews'
import type { INewsSentiment } from '@/types/api.types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Converts "20260309T193127" → "March 09 2026"
const formatAVDate = (raw: string | null): string => {
  if (!raw || raw.length < 8) return ''
  const year  = raw.slice(0, 4)
  const month = parseInt(raw.slice(4, 6), 10) - 1
  const day   = raw.slice(6, 8)
  return `${MONTHS[month]} ${day} ${year}`
}

const sentimentColor = (label: string | null) => {
  if (!label) return 'text-zinc-500'
  const l = label.toLowerCase()
  if (l.includes('bullish'))  return 'text-emerald-400'
  if (l.includes('bearish'))  return 'text-red-400'
  return 'text-zinc-400'
}

function NewsSentimentCard({ item }: { item: INewsSentiment }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors flex flex-col">
      {item.bannerImage && (
        <div className="relative w-full h-40 overflow-hidden rounded-t-xl">
          <Image
            src={item.bannerImage}
            alt=""
            fill
            className="object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            unoptimized
          />
        </div>
      )}
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="text-xs text-white font-mono">{item.symbol}</Badge>
          {item.sentimentLabel && (
            <span className={`text-xs font-medium ${sentimentColor(item.sentimentLabel)}`}>
              {item.sentimentLabel}
            </span>
          )}
        </div>
        <CardTitle className="text-sm font-semibold text-white leading-snug">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition-colors line-clamp-3"
          >
            {item.title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{item.source}</span>
          <span>{formatAVDate(item.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function NewsSentiment({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useNewsSentiment()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return <p className="text-zinc-500 text-sm">No sentiment data available.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.slice(0, limit).map(item => (
        <NewsSentimentCard key={item.id} item={item} />
      ))}
    </div>
  )
}
