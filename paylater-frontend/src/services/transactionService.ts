// Import Axios to identify and handle API errors.
import axios from 'axios'

// Import transaction-related TypeScript types.
import type {
  ApiMessageResponse,
  CreateTransactionRequest,
  Transaction,
} from '../types'

// Import the configured Axios API client.
import { apiClient } from './api'


// Get all transactions from the backend.
export async function listTransactions(): Promise<Transaction[]> {

  // Send GET request to /transactions.
  const { data } = await apiClient.get<Transaction[]>('/transactions')

  // Return the transaction data.
  return data
}


// Create a new transaction.
export async function createTransaction(
  payload: CreateTransactionRequest,
): Promise<string> {

  // Send transaction data to the backend using POST.
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/transactions',
    payload,
  )

  // Return the success message from the backend.
  return data.message
}


// Convert transaction API errors into user-friendly messages.
export function getTransactionErrorMessage(error: unknown): {
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


  // Use the backend error message if available.
  const errorMessage =
    apiError?.error ??
    'Something went wrong. Please try again.'


  // Handle transaction not found error.
  if (error.response.status === 404) {
    return {
      title: 'Not found',
      message: errorMessage,
    }
  }


  // Return a general transaction error message.
  return {
    title: 'Request failed',
    message: errorMessage,
  }
}