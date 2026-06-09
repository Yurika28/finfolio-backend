import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './navigation-bar'
import { SearchProvider } from '@/context/SearchContext'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null, token: null, isLoading: false,
    login: vi.fn(), logout: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const renderNavbar = () => render(<SearchProvider><Navbar /></SearchProvider>)

describe('NavigationBar', () => {
  it('renders a nav element', () => {
    renderNavbar()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the logo text', () => {
    renderNavbar()
    expect(screen.getByText('Finpulse')).toBeInTheDocument()
  })

  it('renders main navigation links', () => {
    renderNavbar()
    // Desktop links are always rendered; getAllByText handles desktop + mobile duplication
    expect(screen.getAllByText('Stocks').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Crypto').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Forex').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('News').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the search input', () => {
    renderNavbar()
    expect(screen.getAllByPlaceholderText('Search tickers…').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the burger button on small screens (always in DOM)', () => {
    renderNavbar()
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('opens the mobile menu when the burger is clicked', async () => {
    const user = userEvent.setup()
    renderNavbar()
    const burger = screen.getByLabelText('Toggle menu')
    await user.click(burger)
    // After opening: links appear twice (desktop div + mobile div)
    expect(screen.getAllByText('Stocks').length).toBe(2)
  })

  it('closes the mobile menu on a second click', async () => {
    const user = userEvent.setup()
    renderNavbar()
    const burger = screen.getByLabelText('Toggle menu')
    await user.click(burger)
    await user.click(burger)
    expect(screen.getAllByText('Stocks').length).toBe(1)
  })
})
