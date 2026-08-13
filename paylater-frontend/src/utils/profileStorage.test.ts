import { describe, expect, it, beforeEach } from 'vitest'

import {
  clearDomainProfile,
  getDomainProfile,
  saveDomainProfile,
} from './profileStorage'

describe('profileStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty profile for unknown email', () => {
    expect(getDomainProfile('user@test.example')).toEqual({})
  })

  it('saves and reads customer and merchant IDs', () => {
    saveDomainProfile('user@test.example', { customerId: 2, merchantId: 5 })

    expect(getDomainProfile('user@test.example')).toEqual({
      customerId: 2,
      merchantId: 5,
    })
  })

  it('clears profile for an email', () => {
    saveDomainProfile('user@test.example', { customerId: 2 })
    clearDomainProfile('user@test.example')

    expect(getDomainProfile('user@test.example')).toEqual({})
  })
})
