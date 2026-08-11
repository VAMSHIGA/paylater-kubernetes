import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import { createPayback } from './paybackService'

vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('paybackService', () => {
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
