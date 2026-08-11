import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import {
  getCreditLimit,
  getCustomerDues,
  getMerchantFees,
  getTotalDues,
} from './reportService'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('reportService', () => {
  it('fetches merchant fees', async () => {
    const data = [{ MerchantName: 'Shop', Commission: '2.50' }]
    mockedApiClient.get.mockResolvedValueOnce({ data })

    await expect(getMerchantFees()).resolves.toEqual(data)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/reports/merchant-fees')
  })

  it('fetches customer dues', async () => {
    const data = [
      {
        customer_id: 1,
        name: 'Alice',
        total_transaction: '100.00',
        total_repaid: '20.00',
        remaining_due: '80.00',
      },
    ]
    mockedApiClient.get.mockResolvedValueOnce({ data })

    await expect(getCustomerDues()).resolves.toEqual(data)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/reports/customer-dues')
  })

  it('fetches credit limit customers', async () => {
    const data = [
      {
        customer_id: 1,
        name: 'Alice',
        credit_limit: '1000.00',
        remaining_due: '1000.00',
      },
    ]
    mockedApiClient.get.mockResolvedValueOnce({ data })

    await expect(getCreditLimit()).resolves.toEqual(data)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/reports/credit-limit')
  })

  it('fetches total dues', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { total_dues: '150.00' },
    })

    await expect(getTotalDues()).resolves.toEqual({ total_dues: '150.00' })
    expect(mockedApiClient.get).toHaveBeenCalledWith('/reports/total-dues')
  })
})
