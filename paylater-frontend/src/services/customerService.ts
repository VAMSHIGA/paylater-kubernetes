// Import Axios to identify and handle API errors.
import axios from 'axios'

// Import customer-related TypeScript types.
import type {
  ApiMessageResponse,
  CreateCustomerRequest,
  Customer,
} from '../types'

// Import the configured Axios API client.
import { apiClient } from './api'


// Get all customers from the backend.
export async function getCustomers(): Promise<Customer[]> {

  // Send GET request to /customers.
  const { data } = await apiClient.get<Customer[]>('/customers')

  // Return the customer data.
  return data
}


// Get the currently logged-in customer's information.
export async function getMyCustomer(): Promise<Customer> {

  // Send GET request to /customers/me.
  const { data } = await apiClient.get<Customer>('/customers/me')

  // Return the customer data.
  return data
}


// Create a new customer.
export async function createCustomer(
  payload: CreateCustomerRequest,
): Promise<string> {

  // Send customer data to the backend using POST.
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/customers',
    payload,
  )

  // Return the success message from the backend.
  return data.message
}


// Convert customer API errors into user-friendly messages.
export function getCustomerErrorMessage(error: unknown): {
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