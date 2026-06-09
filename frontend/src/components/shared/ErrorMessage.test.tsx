import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the error text', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders a different message when passed different props', () => {
    render(<ErrorMessage message="Failed to load data" />)
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })
})
