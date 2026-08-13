import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { createTestUser, seedAuthStorage } from '../test/auth-helpers'
import { useMerchantDashboard } from './useMerchantDashboard'

const getMerchantDashboard = vi.fn()

vi.mock('../services/merchantService', () => ({
  getMerchantDashboard: (...args: unknown[]) => getMerchantDashboard(...args),
  getMerchantErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
}))

const emptyDashboard = {
  ID: 6,
  MerchantName: 'Test Merchant',
  CommissionPercent: '5.00',
  TotalTransactions: 0,
  TotalSales: '0.00',
  TotalCommission: '0.00',
  MerchantEarnings: '0.00',
  PayLaterCommission: '0.00',
  RecentTransactions: [],
}

const updatedDashboard = {
  ...emptyDashboard,
  TotalTransactions: 1,
  TotalSales: '1000.00',
  TotalCommission: '50.00',
  MerchantEarnings: '950.00',
  PayLaterCommission: '50.00',
  RecentTransactions: [
    {
      ID: 1,
      CustomerID: 8,
      CustomerName: 'Customer',
      Amount: '1000.00',
      CommissionPercent: '5.00',
      CommissionAmount: '50.00',
      MerchantNetAmount: '950.00',
      TransactionDate: '2026-08-12',
    },
  ],
}

function renderMerchantDashboardHook() {
  seedAuthStorage(createTestUser('merchant', { userId: 23 }))

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      { initialEntries: ['/merchant'] },
      createElement(AuthProvider, null, children),
    )
  }

  return renderHook(() => useMerchantDashboard(), {
    wrapper: Wrapper,
  })
}

describe('useMerchantDashboard', () => {
  beforeEach(() => {
    getMerchantDashboard.mockReset()
    localStorage.clear()
  })

  it('loads dashboard data on mount', async () => {
    getMerchantDashboard.mockResolvedValueOnce(emptyDashboard)

    const { result } = renderMerchantDashboardHook()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getMerchantDashboard).toHaveBeenCalledTimes(1)
    expect(result.current.dashboard).toEqual(emptyDashboard)
  })

  it('refetches dashboard data when the tab becomes visible again', async () => {
    getMerchantDashboard
      .mockResolvedValueOnce(emptyDashboard)
      .mockResolvedValueOnce(updatedDashboard)

    const { result } = renderMerchantDashboardHook()

    await waitFor(() => {
      expect(result.current.dashboard).toEqual(emptyDashboard)
    })

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(result.current.dashboard).toEqual(updatedDashboard)
    })

    expect(getMerchantDashboard).toHaveBeenCalledTimes(2)
  })
})
