import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { AxiosResponse } from 'axios'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'
import type { IAuthResponse } from '@/types/api.types'

const mockPush = vi.fn()
const mockLogin = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null, token: null, isLoading: false,
    login: mockLogin, logout: vi.fn(),
  }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: { login: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

const fillAndSubmit = async (email: string, password: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the Sign In submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('has a link to the register page', () => {
    render(<LoginPage />)
    expect(screen.getByText('Create one').closest('a')).toHaveAttribute('href', '/register')
  })

  it('disables the button and shows loading text while submitting', async () => {
    vi.mocked(authService.login).mockReturnValue(new Promise(() => {}))
    render(<LoginPage />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    const btn = screen.getByRole('button', { name: /signing in/i })
    expect(btn).toBeDisabled()
  })

  it('calls login() and redirects to / on success', async () => {
    const fakeToken = 'tok_abc'
    const fakeUser = { id: 1, email: 'a@b.com', name: 'Alice', createdAt: '2024-01-01' }
    vi.mocked(authService.login).mockResolvedValue({ data: { token: fakeToken, user: fakeUser } } as unknown as AxiosResponse<IAuthResponse>)
    render(<LoginPage />)
    await fillAndSubmit('a@b.com', 'secret')
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(fakeToken, fakeUser)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('shows a toast error with the server message on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    })
    render(<LoginPage />)
    await fillAndSubmit('a@b.com', 'wrong')
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Sign in failed',
        expect.objectContaining({ description: 'Invalid credentials' }),
      )
    })
  })

  it('shows a generic toast error when no server message is present', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Network'))
    render(<LoginPage />)
    await fillAndSubmit('a@b.com', 'wrong')
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Sign in failed',
        expect.objectContaining({ description: 'Invalid email or password' }),
      )
    })
  })

  it('re-enables the button after a failed submission', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error())
    render(<LoginPage />)
    await fillAndSubmit('a@b.com', 'wrong')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
    })
  })
})
