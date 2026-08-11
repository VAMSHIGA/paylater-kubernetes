import axios from 'axios'

import type {
  ApiMessageResponse,
  CreateCustomerRequest,
  Customer,
} from '../types'
import { apiClient } from './api'

export async function getCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers')

  return data
}

export async function createCustomer(
  payload: CreateCustomerRequest,
): Promise<string> {
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/customers',
    payload,
  )

  return data.message
}

export function getCustomerErrorMessage(error: unknown): {
  title: string
  message: string
} {
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Request failed',
      message: 'Something went wrong. Please try again.',
    }
  }

  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }

  const apiError = error.response.data as { error?: string } | undefined

  return {
    title: 'Request failed',
    message: apiError?.error ?? 'Something went wrong. Please try again.',
  }
}
