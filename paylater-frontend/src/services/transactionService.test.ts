import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import { createTransaction, listTransactions } from './transactionService'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('transactionService', () => {
  it('lists transactions', async () => {
    const transactions = [
      {
        ID: 1,
        CustomerID: 8,
        MerchantID: 2,
        Amount: '300.00',
        Commission: '5.00',
        TransactionDate: '2026-08-12',
      },
    ]

    mockedApiClient.get.mockResolvedValueOnce({ data: transactions })

    await expect(listTransactions()).resolves.toEqual(transactions)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/transactions')
  })

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
