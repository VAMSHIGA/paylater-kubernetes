import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import { createPayback, listPaybacks } from './paybackService'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('paybackService', () => {
  it('lists paybacks', async () => {
    const paybacks = [
      {
        ID: 1,
        CustomerID: 8,
        Amount: '100.00',
        PaymentDate: '2026-08-12',
      },
    ]

    mockedApiClient.get.mockResolvedValueOnce({ data: paybacks })

    await expect(listPaybacks()).resolves.toEqual(paybacks)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/paybacks')
  })

  it('creates a payback', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { message: 'Payback created successfully' },
    })

    await expect(
      createPayback({
        customer_id: 1,
        amount: '50.00',
        payment_date: '2026-08-10',
      }),
    ).resolves.toBe('Payback created successfully')

    expect(mockedApiClient.post).toHaveBeenCalledWith('/paybacks', {
      customer_id: 1,
      amount: '50.00',
      payment_date: '2026-08-10',
    })
  })
})
