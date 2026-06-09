import { describe, it, expect } from 'vitest'
import { formatCurrency, formatLargeNumber } from './formatCurrency'

describe('formatCurrency', () => {
  it('formats a positive USD value', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats a negative value', () => {
    expect(formatCurrency(-50.5)).toBe('-$50.50')
  })

  it('always produces two decimal places', () => {
    expect(formatCurrency(10)).toBe('$10.00')
    expect(formatCurrency(10.1)).toBe('$10.10')
  })
})

describe('formatLargeNumber', () => {
  it('formats trillions', () => {
    expect(formatLargeNumber(2.5e12)).toBe('$2.50T')
  })

  it('formats billions', () => {
    expect(formatLargeNumber(3.14e9)).toBe('$3.14B')
  })

  it('formats millions', () => {
    expect(formatLargeNumber(1.5e6)).toBe('$1.50M')
  })

  it('falls back to formatCurrency for values under 1M', () => {
    expect(formatLargeNumber(999)).toBe('$999.00')
  })
})
