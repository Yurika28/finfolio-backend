import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavbarAuth from './navbar-auth'
import type { IUser } from '@/types/api.types'

const mockLogout = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { useAuth } from '@/context/AuthContext'

const baseUser: IUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Jane Doe',
  createdAt: '2024-01-01T00:00:00Z',
}

describe('NavbarAuth — logged out', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, token: null, isLoading: false,
      login: vi.fn(), logout: mockLogout,
    })
  })

  it('shows Create Account and Log In buttons', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByText('Log In')).toBeInTheDocument()
  })

  it('Create Account links to /register', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('Create Account').closest('a')).toHaveAttribute('href', '/register')
  })

  it('Log In links to /login', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('Log In').closest('a')).toHaveAttribute('href', '/login')
  })

  it('does not render the avatar', () => {
    render(<NavbarAuth />)
    expect(screen.queryByRole('button', { name: /JD|TE/ })).toBeNull()
  })
})

describe('NavbarAuth — logged in with a named user', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser, token: 'tok', isLoading: false,
      login: vi.fn(), logout: mockLogout,
    })
  })

  it('shows the user display name', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('shows initials derived from the name', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('does not show auth links', () => {
    render(<NavbarAuth />)
    expect(screen.queryByText('Create Account')).toBeNull()
    expect(screen.queryByText('Log In')).toBeNull()
  })
})

describe('NavbarAuth — logged in without a name', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...baseUser, name: null }, token: 'tok', isLoading: false,
      login: vi.fn(), logout: mockLogout,
    })
  })

  it('falls back to email initials', () => {
    render(<NavbarAuth />)
    // email is test@example.com → first two chars → "TE"
    expect(screen.getByText('TE')).toBeInTheDocument()
  })

  it('shows the email as the display label', () => {
    render(<NavbarAuth />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
