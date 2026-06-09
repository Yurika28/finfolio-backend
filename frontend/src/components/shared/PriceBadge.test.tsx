import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceBadge } from './PriceBadge'

describe('PriceBadge', () => {
  it('renders a positive value with a + prefix', () => {
    render(<PriceBadge value={2.5} />)
    expect(screen.getByText('+2.50%')).toBeInTheDocument()
  })

  it('renders a negative value without double-minus', () => {
    render(<PriceBadge value={-1.75} />)
    expect(screen.getByText('-1.75%')).toBeInTheDocument()
  })

  it('renders zero as positive', () => {
    render(<PriceBadge value={0} />)
    expect(screen.getByText('+0.00%')).toBeInTheDocument()
  })

  it('uses a custom suffix', () => {
    render(<PriceBadge value={10} suffix="$" />)
    expect(screen.getByText('+10.00$')).toBeInTheDocument()
  })
})
