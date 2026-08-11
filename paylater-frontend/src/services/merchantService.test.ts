import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import {
  createMerchant,
  getMerchantErrorMessage,
  updateMerchantCommission,
} from './merchantService'

vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('merchantService', () => {
  it('creates a merchant', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { message: 'Merchant created successfully' },
    })

    await expect(
      createMerchant({
        merchant_name: 'Shop',
        phone_number: '1234567890',
        onboarding: '2026-08-10',
        commission: '2.5',
      }),
    ).resolves.toBe('Merchant created successfully')

    expect(mockedApiClient.post).toHaveBeenCalledWith('/merchants', {
      merchant_name: 'Shop',
      phone_number: '1234567890',
      onboarding: '2026-08-10',
      commission: '2.5',
    })
  })

  it('updates merchant commission', async () => {
    mockedApiClient.put.mockResolvedValueOnce({
      data: { message: 'Merchant commission updated successfully' },
    })

    await expect(
      updateMerchantCommission(3, { commission: '3.0' }),
    ).resolves.toBe('Merchant commission updated successfully')

    expect(mockedApiClient.put).toHaveBeenCalledWith('/merchants/3', {
      commission: '3.0',
    })
  })

  it('maps 404 merchant errors', () => {
    const error = new axios.AxiosError(
      'Not Found',
      '404',
      undefined,
      undefined,
      {
        status: 404,
        data: { error: 'not found' },
        statusText: 'Not Found',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      },
    )

    expect(getMerchantErrorMessage(error)).toEqual({
      title: 'Merchant not found',
      message: 'The specified merchant could not be found.',
    })
  })
})
