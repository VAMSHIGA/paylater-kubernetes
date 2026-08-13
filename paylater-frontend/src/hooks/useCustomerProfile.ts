import { useCallback, useEffect, useState } from 'react'

import {
  getCustomerErrorMessage,
  getMyCustomer,
} from '../services/customerService'
import type { Customer } from '../types'
import { useAuth } from './useAuth'

interface CustomerProfileState {
  profile: Customer | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCustomerProfile(): CustomerProfileState {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextProfile = await getMyCustomer()
      setProfile(nextProfile)
    } catch (nextError) {
      setProfile(null)
      setError(getCustomerErrorMessage(nextError).message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    profile,
    loading,
    error,
    refresh,
  }
}
