import axios from 'axios'

import type { ApiMessageResponse, CreateTransactionRequest } from '../types'
import { apiClient } from './api'

export async function createTransaction(
  payload: CreateTransactionRequest,
): Promise<string> {
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/transactions',
    payload,
  )

  return data.message
}

export function getTransactionErrorMessage(error: unknown): {
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
  const errorMessage =
    apiError?.error ?? 'Something went wrong. Please try again.'

  if (error.response.status === 404) {
    return {
      title: 'Not found',
      message: errorMessage,
    }
  }

  return {
    title: 'Request failed',
    message: errorMessage,
  }
}
