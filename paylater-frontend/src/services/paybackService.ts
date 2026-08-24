// Import Axios to identify and handle API errors.
import axios from 'axios'

// Import payback-related TypeScript types.
import type {
  ApiMessageResponse,
  CreatePaybackRequest,
  Payback,
} from '../types'

// Import the configured Axios API client.
import { apiClient } from './api'


// Get the list of paybacks from the backend.
export async function listPaybacks(): Promise<Payback[]> {

  // Send GET request to /paybacks.
  const { data } = await apiClient.get<Payback[]>('/paybacks')

  // Return the payback data.
  return data
}


// Create a new payback.
export async function createPayback(
  payload: CreatePaybackRequest,
): Promise<string> {

  // Send payback data to the backend using POST.
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/paybacks',
    payload,
  )

  // Return the success message from the backend.
  return data.message
}


// Convert payback API errors into user-friendly messages.
export function getPaybackErrorMessage(error: unknown): {
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