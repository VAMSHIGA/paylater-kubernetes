import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import { createTransaction } from './transactionService'

vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('transactionService', () => {
  it('creates a transaction', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { message: 'Transaction created successfully' },
    })

    await expect(
      createTransaction({
        customer_id: 1,
        merchant_id: 2,
        amount: '100.00',
        commission: '2.50',
        transaction_date: '2026-08-10',
      }),
    ).resolves.toBe('Transaction created successfully')

    expect(mockedApiClient.post).toHaveBeenCalledWith('/transactions', {
      customer_id: 1,
      merchant_id: 2,
      amount: '100.00',
      commission: '2.50',
      transaction_date: '2026-08-10',
    })
  })
})
