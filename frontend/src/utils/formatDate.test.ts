import { describe, it, expect } from 'vitest'
import { formatDate, formatDateShort, formatUnixTimestamp } from './formatDate'

describe('formatDate', () => {
  it('formats an ISO date string with month, day, and year', () => {
    expect(formatDate('2024-01-15T00:00:00Z')).toMatch(/Jan/)
    expect(formatDate('2024-01-15T00:00:00Z')).toMatch(/2024/)
  })
})

describe('formatDateShort', () => {
  it('includes month and day', () => {
    const result = formatDateShort('2024-06-03T00:00:00Z')
    expect(result).toMatch(/Jun/)
  })

  it('omits the year', () => {
    const result = formatDateShort('2024-06-03T00:00:00Z')
    expect(result).not.toMatch(/2024/)
  })
})

describe('formatUnixTimestamp', () => {
  it('converts unix seconds to a readable date', () => {
    // 2024-03-01 00:00:00 UTC
    const unix = 1709251200
    const result = formatUnixTimestamp(unix)
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2024/)
  })
})
