import { describe, expect, it } from 'vitest'

import { formatMoney } from './format'

describe('formatMoney', () => {
  it('formats numeric strings as INR currency', () => {
    expect(formatMoney('4265.00')).toBe('₹4,265.00')
  })

  it('returns em dash for empty values', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney('')).toBe('—')
  })
})
