import axios from 'axios'

import type { ApiMessageResponse, CreatePaybackRequest } from '../types'
import { apiClient } from './api'

export async function createPayback(
  payload: CreatePaybackRequest,
): Promise<string> {
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/paybacks',
    payload,
  )

  return data.message
}

export function getPaybackErrorMessage(error: unknown): {
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
