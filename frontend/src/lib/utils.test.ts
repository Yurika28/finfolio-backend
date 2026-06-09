import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500')
  })

  it('omits falsy conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included')
  })

  it('handles undefined gracefully', () => {
    expect(cn('base', undefined)).toBe('base')
  })

  it('merges padding utilities correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('returns an empty string when no args given', () => {
    expect(cn()).toBe('')
  })
})
