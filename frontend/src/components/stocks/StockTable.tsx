import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { changeColor } from '@/utils/formatChange'
import type { IStockQuote } from '@/types/api.types'

export const StockTable = ({ stocks }: { stocks: IStockQuote[] }) => (
  <div className="rounded-lg border border-zinc-800 overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800 hover:bg-transparent">
          <TableHead className="text-zinc-400">Symbol</TableHead>
          <TableHead className="text-zinc-400 text-right">Price</TableHead>
          <TableHead className="text-zinc-400 text-right">Change</TableHead>
          <TableHead className="text-zinc-400 text-right hidden sm:table-cell">High</TableHead>
          <TableHead className="text-zinc-400 text-right hidden sm:table-cell">Low</TableHead>
          <TableHead className="text-zinc-400 text-right hidden md:table-cell">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map(s => (
          <TableRow key={s.symbol} className="border-zinc-800 hover:bg-zinc-900 cursor-pointer">
            <TableCell>
              <Link href={`/stocks/${s.symbol}`} className="font-bold text-white hover:text-green-400 transition-colors">
                {s.symbol}
              </Link>
            </TableCell>
            <TableCell className="text-right font-mono text-white">${s.close.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              <span className={`text-sm font-medium ${changeColor(s.dp)}`}>
                {s.dp >= 0 ? '+' : ''}{s.dp.toFixed(2)}%
              </span>
            </TableCell>
            <TableCell className="text-right text-zinc-400 hidden sm:table-cell font-mono">${s.high.toFixed(2)}</TableCell>
            <TableCell className="text-right text-zinc-400 hidden sm:table-cell font-mono">${s.low.toFixed(2)}</TableCell>
            <TableCell className="text-right text-zinc-400 hidden md:table-cell font-mono">${s.open.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
