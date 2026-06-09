import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results found" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="No results found" description="Try a different search term" />)
    expect(screen.getByText('Try a different search term')).toBeInTheDocument()
  })

  it('does not render a description element when omitted', () => {
    const { container } = render(<EmptyState title="Empty" />)
    // Only one <p> tag — the title; no description paragraph
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })
})
