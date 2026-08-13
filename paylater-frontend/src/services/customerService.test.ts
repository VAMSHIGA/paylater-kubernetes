import { describe, expect, it, vi } from 'vitest'

import { apiClient } from './api'
import {
  createCustomer,
  getCustomerErrorMessage,
  getCustomers,
  getMyCustomer,
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

  it('fetches the authenticated customer profile', async () => {
    const profile = {
      ID: 8,
      Name: 'Galinki',
      Email: 'galinkivamshi420@gmail.com',
      CreditLimit: '10000.00',
      OutstandingDue: '300.00',
      AvailableCredit: '9700.00',
    }

    mockedApiClient.get.mockResolvedValueOnce({ data: profile })

    await expect(getMyCustomer()).resolves.toEqual(profile)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/customers/me')
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
