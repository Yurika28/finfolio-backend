import { describe, it, expect } from 'vitest'
import { formatChange, changeColor } from './formatChange'

describe('formatChange', () => {
  it('prefixes positive values with +', () => {
    expect(formatChange(2.5)).toBe('+2.50%')
  })

  it('does not double-prefix negative values', () => {
    expect(formatChange(-1.75)).toBe('-1.75%')
  })

  it('treats zero as positive', () => {
    expect(formatChange(0)).toBe('+0.00%')
  })

  it('accepts a custom suffix', () => {
    expect(formatChange(3.0, '$')).toBe('+3.00$')
  })

  it('rounds to two decimal places', () => {
    expect(formatChange(1.999)).toBe('+2.00%')
  })
})

describe('changeColor', () => {
  it('returns green class for positive values', () => {
    expect(changeColor(1.5)).toBe('text-green-400')
  })

  it('returns red class for negative values', () => {
    expect(changeColor(-0.1)).toBe('text-red-400')
  })

  it('returns green class for zero', () => {
    expect(changeColor(0)).toBe('text-green-400')
  })
})
