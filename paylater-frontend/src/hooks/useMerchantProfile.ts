import { useCallback, useEffect, useState } from 'react'

import {
  getMerchantErrorMessage,
  getMyMerchant,
} from '../services/merchantService'
import type { Merchant } from '../types'
import { useAuth } from './useAuth'

interface MerchantProfileState {
  profile: Merchant | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useMerchantProfile(): MerchantProfileState {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'merchant') {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextProfile = await getMyMerchant()
      setProfile(nextProfile)
    } catch (nextError) {
      setProfile(null)
      setError(getMerchantErrorMessage(nextError).message)
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
