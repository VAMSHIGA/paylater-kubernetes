import axios from 'axios'

import type {
  ApiMessageResponse,
  CreateMerchantRequest,
  Merchant,
  MerchantDashboard,
  UpdateMerchantCommissionRequest,
} from '../types'
import { apiClient } from './api'

export async function getMyMerchant(): Promise<Merchant> {
  const { data } = await apiClient.get<Merchant>('/merchants/me')

  return data
}

export async function getMerchantDashboard(): Promise<MerchantDashboard> {
  const { data } = await apiClient.get<MerchantDashboard>(
    '/merchants/me/dashboard',
  )

  return data
}

export async function createMerchant(
  payload: CreateMerchantRequest,
): Promise<string> {
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/merchants',
    payload,
  )

  return data.message
}

export async function updateMerchantCommission(
  merchantId: number,
  payload: UpdateMerchantCommissionRequest,
): Promise<string> {
  const { data } = await apiClient.put<ApiMessageResponse>(
    `/merchants/${merchantId}`,
    payload,
  )

  return data.message
}

export function getMerchantErrorMessage(error: unknown): {
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

  if (error.response.status === 404) {
    return {
      title: 'Merchant not found',
      message: 'The specified merchant could not be found.',
    }
  }

  const apiError = error.response.data as { error?: string } | undefined

  return {
    title: 'Request failed',
    message: apiError?.error ?? 'Something went wrong. Please try again.',
  }
}
