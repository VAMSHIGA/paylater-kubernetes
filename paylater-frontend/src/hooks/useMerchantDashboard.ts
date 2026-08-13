import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import {
  getMerchantDashboard,
  getMerchantErrorMessage,
} from '../services/merchantService'
import type { MerchantDashboard } from '../types'
import { useAuth } from './useAuth'

interface MerchantDashboardState {
  dashboard: MerchantDashboard | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface RefreshOptions {
  silent?: boolean
}

export function useMerchantDashboard(): MerchantDashboardState {
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const refresh = useCallback(
    async (options: RefreshOptions = {}) => {
      if (!user || user.role !== 'merchant') {
        setDashboard(null)
        setError(null)
        setLoading(false)
        hasLoadedRef.current = false
        return
      }

      const silent = options.silent === true && hasLoadedRef.current

      if (!silent) {
        setLoading(true)
      }

      setError(null)

      try {
        const nextDashboard = await getMerchantDashboard()
        setDashboard(nextDashboard)
        hasLoadedRef.current = true
      } catch (nextError) {
        setDashboard(null)
        setError(getMerchantErrorMessage(nextError).message)
        hasLoadedRef.current = false
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [user],
  )

  useEffect(() => {
    void refresh()
  }, [refresh, location.pathname])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true })
      }
    }

    function handleWindowFocus() {
      void refresh({ silent: true })
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  return {
    dashboard,
    loading,
    error,
    refresh: () => refresh(),
  }
}
