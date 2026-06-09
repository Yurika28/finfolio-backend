import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { AxiosResponse } from 'axios'
import { useStocks, useStockQuote, useStockChart } from './useStocks'
import { stocksService } from '@/services/stocks.service'
import type { IStockQuote, IWeeklyChart } from '@/types/api.types'

const ax = <T>(data: T) => ({ data }) as unknown as AxiosResponse<T>

vi.mock('@/services/stocks.service')

const mockQuote: IStockQuote = {
  id: 1,
  symbol: 'AAPL',
  close: 150.25,
  high: 155.0,
  low: 148.5,
  open: 149.0,
  dp: 1.5,
  d: 2.25,
  insertedAt: '2024-01-15T10:00:00Z',
}

const mockChart: IWeeklyChart[] = [
  { id: 1, symbol: 'AAPL', date: '2024-01-08', open: 185, high: 188, low: 183, close: 187, adjustedClose: 187, volume: 1000000 },
]

describe('useStocks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts in a loading state with null data', () => {
    vi.mocked(stocksService.getAll).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useStocks())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('populates data and clears loading on success', async () => {
    vi.mocked(stocksService.getAll).mockResolvedValue(ax([mockQuote]))
    const { result } = renderHook(() => useStocks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([mockQuote])
    expect(result.current.error).toBeNull()
  })

  it('sets an error message and clears loading on failure', async () => {
    vi.mocked(stocksService.getAll).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useStocks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Failed to load stocks')
    expect(result.current.data).toBeNull()
  })
})

describe('useStockQuote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches a quote by symbol', async () => {
    vi.mocked(stocksService.getQuote).mockResolvedValue(ax(mockQuote))
    const { result } = renderHook(() => useStockQuote('AAPL'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(mockQuote)
  })

  it('includes the symbol in the error message', async () => {
    vi.mocked(stocksService.getQuote).mockRejectedValue(new Error())
    const { result } = renderHook(() => useStockQuote('TSLA'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Failed to load TSLA')
  })

  it('re-fetches when the symbol changes', async () => {
    vi.mocked(stocksService.getQuote).mockResolvedValue(ax(mockQuote))
    const { rerender } = renderHook(({ symbol }) => useStockQuote(symbol), {
      initialProps: { symbol: 'AAPL' },
    })
    rerender({ symbol: 'NVDA' })
    await waitFor(() => expect(vi.mocked(stocksService.getQuote)).toHaveBeenCalledWith('NVDA'))
  })
})

describe('useStockChart', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches chart data with default limit', async () => {
    vi.mocked(stocksService.getChart).mockResolvedValue(ax(mockChart))
    const { result } = renderHook(() => useStockChart('AAPL'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(mockChart)
    expect(vi.mocked(stocksService.getChart)).toHaveBeenCalledWith('AAPL', 52)
  })

  it('sets error message on failure', async () => {
    vi.mocked(stocksService.getChart).mockRejectedValue(new Error())
    const { result } = renderHook(() => useStockChart('AAPL'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('No chart data yet')
  })
})
