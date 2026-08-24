// Import Axios to identify and handle API errors.
import axios from 'axios'

// Import report-related TypeScript types.
import type {
  CreditLimitCustomer,
  CustomerDue,
  MerchantFee,
  TotalDues,
} from '../types'

// Import the configured Axios API client.
import { apiClient } from './api'


// Get merchant fee report data from the backend.
export async function getMerchantFees(): Promise<MerchantFee[]> {

  // Send GET request to the merchant fees API.
  const { data } = await apiClient.get<MerchantFee[]>(
    '/reports/merchant-fees',
  )

  // Return merchant fee data.
  return data
}


// Get customer due report data from the backend.
export async function getCustomerDues(): Promise<CustomerDue[]> {

  // Send GET request to the customer dues API.
  const { data } = await apiClient.get<CustomerDue[]>(
    '/reports/customer-dues',
  )

  // Return customer due data.
  return data
}


// Get customer credit limit information.
export async function getCreditLimit(): Promise<CreditLimitCustomer[]> {

  // Send GET request to the credit limit API.
  const { data } = await apiClient.get<CreditLimitCustomer[]>(
    '/reports/credit-limit',
  )

  // Return credit limit data.
  return data
}


// Get the total amount of customer dues.
export async function getTotalDues(): Promise<TotalDues> {

  // Send GET request to the total dues API.
  const { data } = await apiClient.get<TotalDues>(
    '/reports/total-dues',
  )

  // Return total dues data.
  return data
}


// Convert report API errors into user-friendly messages.
export function getReportErrorMessage(error: unknown): {
  title: string
  message: string
} {

  // Check if the error came from Axios.
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Request failed',
      message: 'Something went wrong. Please try again.',
    }
  }


  // Handle the case where the backend cannot be reached.
  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }


  // Get the error message returned by the backend.
  const apiError = error.response.data as {
    error?: string
  } | undefined


  // Return backend error or a default error message.
  return {
    title: 'Request failed',
    message:
      apiError?.error ??
      'Something went wrong. Please try again.',
  }
}