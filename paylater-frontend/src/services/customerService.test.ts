import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import {
  createCustomer,
  getCustomerErrorMessage,
  getCustomers,
} from './customerService'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

describe('customerService', () => {
  it('fetches customers', async () => {
    const customers = [
      {
        ID: 1,
        Name: 'Alice',
        Email: 'alice@test.example',
        CreditLimit: '1000.00',
      },
    ]

    mockedApiClient.get.mockResolvedValueOnce({ data: customers })

    await expect(getCustomers()).resolves.toEqual(customers)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/customers')
  })

  it('creates a customer', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { message: 'Customer created successfully' },
    })

    await expect(
      createCustomer({
        name: 'Alice',
        email: 'alice@test.example',
        credit_limit: '1000',
      }),
    ).resolves.toBe('Customer created successfully')

    expect(mockedApiClient.post).toHaveBeenCalledWith('/customers', {
      name: 'Alice',
      email: 'alice@test.example',
      credit_limit: '1000',
    })
  })

  it('maps customer errors', () => {
    expect(getCustomerErrorMessage(new Error('boom'))).toEqual({
      title: 'Request failed',
      message: 'Something went wrong. Please try again.',
    })
  })
})
