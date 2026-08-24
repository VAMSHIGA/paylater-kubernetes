// Import Axios to identify and handle API errors.
import axios from 'axios'

// Import merchant-related TypeScript types.
import type {
  ApiMessageResponse,
  CreateMerchantRequest,
  Merchant,
  MerchantDashboard,
  UpdateMerchantCommissionRequest,
} from '../types'

// Import the configured Axios API client.
import { apiClient } from './api'


// Get the currently logged-in merchant's information.
export async function getMyMerchant(): Promise<Merchant> {

  // Send GET request to /merchants/me.
  const { data } = await apiClient.get<Merchant>('/merchants/me')

  // Return merchant data.
  return data
}


// Get the currently logged-in merchant's dashboard data.
export async function getMerchantDashboard(): Promise<MerchantDashboard> {

  // Send GET request to the merchant dashboard API.
  const { data } = await apiClient.get<MerchantDashboard>(
    '/merchants/me/dashboard',
  )

  // Return merchant dashboard data.
  return data
}


// Create a new merchant.
export async function createMerchant(
  payload: CreateMerchantRequest,
): Promise<string> {

  // Send merchant data to the backend using POST.
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/merchants',
    payload,
  )

  // Return the success message from the backend.
  return data.message
}


// Update a merchant's commission.
export async function updateMerchantCommission(
  merchantId: number,
  payload: UpdateMerchantCommissionRequest,
): Promise<string> {

  // Send updated commission data using PUT.
  const { data } = await apiClient.put<ApiMessageResponse>(
    `/merchants/${merchantId}`,
    payload,
  )

  // Return the success message from the backend.
  return data.message
}


// Convert merchant API errors into user-friendly messages.
export function getMerchantErrorMessage(error: unknown): {
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


  // Handle merchant not found error.
  if (error.response.status === 404) {
    return {
      title: 'Merchant not found',
      message: 'The specified merchant could not be found.',
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