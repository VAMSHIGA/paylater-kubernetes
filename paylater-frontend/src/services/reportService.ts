import axios from 'axios'

import type {
  CreditLimitCustomer,
  CustomerDue,
  MerchantFee,
  TotalDues,
} from '../types'
import { apiClient } from './api'

export async function getMerchantFees(): Promise<MerchantFee[]> {
  const { data } = await apiClient.get<MerchantFee[]>('/reports/merchant-fees')

  return data
}

export async function getCustomerDues(): Promise<CustomerDue[]> {
  const { data } = await apiClient.get<CustomerDue[]>('/reports/customer-dues')

  return data
}

export async function getCreditLimit(): Promise<CreditLimitCustomer[]> {
  const { data } = await apiClient.get<CreditLimitCustomer[]>(
    '/reports/credit-limit',
  )

  return data
}

export async function getTotalDues(): Promise<TotalDues> {
  const { data } = await apiClient.get<TotalDues>('/reports/total-dues')

  return data
}

export function getReportErrorMessage(error: unknown): {
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
