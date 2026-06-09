import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavbarSearch from './navbar-search'
import { SearchProvider } from '@/context/SearchContext'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const renderWithSearch = (ui: React.ReactElement) =>
  render(<SearchProvider>{ui}</SearchProvider>)

describe('NavbarSearch', () => {
  beforeEach(() => mockPush.mockClear())

  it('renders the search input', () => {
    renderWithSearch(<NavbarSearch />)
    expect(screen.getByPlaceholderText('Search tickers…')).toBeInTheDocument()
  })

  it('shows no dropdown when the input is empty', () => {
    renderWithSearch(<NavbarSearch />)
    expect(screen.queryByRole('button', { name: /AAPL/i })).toBeNull()
  })

  it('shows matching results when typing a symbol prefix', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'AAPL')
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
  })

  it('shows matching results when typing a partial company name', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'bitcoin')
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
  })

  it('shows no results for a query that matches nothing', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'ZZZZZ')
    expect(screen.queryByText(/STOCK|CRYPTO/)).toBeNull()
  })

  it('navigates to the stock page when a stock result is clicked', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'AAPL')
    // onMouseDown is used to prevent blur before click
    fireEvent.mouseDown(screen.getByText('Apple Inc.').closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/stocks/AAPL')
  })

  it('navigates to the crypto page when a crypto result is clicked', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'BTC')
    fireEvent.mouseDown(screen.getByText('Bitcoin').closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/crypto/BTC-USD')
  })

  it('navigates to exact stock on Enter for a known symbol', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'AAPL')
    await user.keyboard('{Enter}')
    expect(mockPush).toHaveBeenCalledWith('/stocks/AAPL')
  })

  it('routes an unknown symbol as a stock on Enter', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'UNKNWN')
    await user.keyboard('{Enter}')
    expect(mockPush).toHaveBeenCalledWith('/stocks/UNKNWN')
  })

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'AAPL')
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByText('Apple Inc.')).toBeNull()
  })

  it('clears the input and closes the dropdown after navigating', async () => {
    const user = userEvent.setup()
    renderWithSearch(<NavbarSearch />)
    await user.type(screen.getByPlaceholderText('Search tickers…'), 'AAPL')
    fireEvent.mouseDown(screen.getByText('Apple Inc.').closest('button')!)
    expect(screen.getByPlaceholderText('Search tickers…')).toHaveValue('')
  })
})
