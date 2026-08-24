// Import Axios to check and handle Axios errors.
import axios from 'axios'

// Import API response types and User types.
import type {
  ApiMessageResponse,
  LoginResponse,
  User,
  UserRole,
} from '../types'

// Import configured Axios client.
import { apiClient } from './api'


// Key used to store JWT token in localStorage.
const TOKEN_KEY = 'paylater_token'

// Key used to store user information in localStorage.
const USER_KEY = 'paylater_user'


// Data required for login.
export interface LoginCredentials {
  email: string
  password: string
}


// Data required for registration.
export interface RegisterCredentials {
  email: string
  password: string
  role: UserRole
}


// Data stored inside the JWT payload.
interface JwtPayload {
  user_id: number
  email: string
  role: UserRole
}


// Decode the information stored inside a JWT token.
function decodeJwtPayload(token: string): JwtPayload | null {
  try {

    // Split JWT into header, payload, and signature.
    const parts = token.split('.')

    // JWT must contain exactly three parts.
    if (parts.length !== 3) {
      return null
    }

    // Convert Base64URL format into normal Base64 format.
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Decode the Base64 payload.
    const decoded = atob(base64)

    // Convert decoded JSON into a JavaScript object.
    return JSON.parse(decoded) as JwtPayload

  } catch {

    // Return null if the token cannot be decoded.
    return null
  }
}


// Get the JWT token stored in the browser.
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}


// Get the user information stored in the browser.
export function getStoredUser(): User | null {

  // Read the stored user data.
  const raw = localStorage.getItem(USER_KEY)

  // Return null if no user is stored.
  if (!raw) {
    return null
  }

  try {

    // Convert stored JSON string into a User object.
    return JSON.parse(raw) as User

  } catch {

    // Return null if stored data is invalid.
    return null
  }
}


// Remove the token and user from localStorage.
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}


// Store a function that handles unauthorized users.
let unauthorizedHandler: (() => void) | null = null

// Prevent unauthorized handling from running multiple times.
let isHandlingUnauthorized = false


// Register the function used when authentication expires.
export function registerUnauthorizedHandler(
  handler: (() => void) | null,
): void {
  unauthorizedHandler = handler
}


// Handle a 401 unauthorized session.
export function handleUnauthorizedSession(): void {

  // Stop if unauthorized handling is already running.
  if (isHandlingUnauthorized) {
    return
  }

  // Mark unauthorized handling as running.
  isHandlingUnauthorized = true

  // Remove stored authentication information.
  clearAuth()

  // Run the registered unauthorized function.
  unauthorizedHandler?.()
}


// Allow unauthorized handling again.
function resetUnauthorizedHandling(): void {
  isHandlingUnauthorized = false
}


// Restore login information after a page refresh.
export function restoreStoredAuth(): {
  user: User
  token: string
} | null {

  // Get the stored JWT token.
  const token = getStoredToken()

  // Get the stored user information.
  const storedUser = getStoredUser()

  // Clear authentication if token or user is missing.
  if (!token || !storedUser) {
    clearAuth()
    return null
  }

  // Decode the JWT token.
  const payload = decodeJwtPayload(token)

  // Clear authentication if the token is invalid.
  if (!payload) {
    clearAuth()
    return null
  }

  // Create the current user from JWT information.
  const user: User = {
    userId: payload.user_id,
    email: payload.email,
    role: payload.role,
  }

  // Return the restored user and token.
  return { user, token }
}


// Decide which dashboard to open after login.
export function getPostLoginPath(role: UserRole): string {

  // Check the user's role.
  switch (role) {

    // Admin goes to the admin dashboard.
    case 'admin':
      return '/admin'

    // Customer goes to the customer dashboard.
    case 'customer':
      return '/customer'

    // Merchant goes to the merchant dashboard.
    case 'merchant':
      return '/merchant'

    // Unknown role goes to the home page.
    default:
      return '/'
  }
}


// Login the user using the backend API.
export async function login(
  credentials: LoginCredentials,
): Promise<User> {

  // Send email and password to the login API.
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/login',
    credentials,
  )

  // Decode the JWT returned by the backend.
  const payload = decodeJwtPayload(data.token)

  // Stop if the backend returned an invalid token.
  if (!payload) {
    throw new Error('Invalid authentication token received')
  }

  // Create the user object from the JWT.
  const user: User = {
    userId: payload.user_id,
    email: payload.email,
    role: payload.role,
  }

  // Store the JWT token in localStorage.
  localStorage.setItem(TOKEN_KEY, data.token)

  // Store user information in localStorage.
  localStorage.setItem(USER_KEY, JSON.stringify(user))

  // Reset unauthorized handling after successful login.
  resetUnauthorizedHandling()

  // Return the logged-in user.
  return user
}


// Register a new user using the backend API.
export async function register(
  credentials: RegisterCredentials,
): Promise<string> {

  // Send registration data to the backend.
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/auth/register',
    credentials,
  )

  // Return the success message from the backend.
  return data.message
}


// Convert registration errors into user-friendly messages.
export function getRegisterErrorMessage(error: unknown): {
  title: string
  message: string
} {

  // Check if the error came from Axios.
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Registration failed',
      message: 'Something went wrong. Please try again.',
    }
  }

  // Handle server connection failure.
  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }

  // Handle duplicate email error.
  if (error.response.status === 409) {
    return {
      title: 'Registration failed',
      message: 'Email already registered',
    }
  }

  // Read the error message returned by the backend.
  const apiError = error.response.data as {
    error?: string
  } | undefined

  // Return the backend error or a default message.
  return {
    title: 'Registration failed',
    message:
      apiError?.error ??
      'Something went wrong. Please try again.',
  }
}


// Convert login errors into user-friendly messages.
export function getLoginErrorMessage(error: unknown): {
  title: string
  message: string
} {

  // Check if the error came from Axios.
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Login failed',
      message: 'Something went wrong. Please try again.',
    }
  }

  // Handle server connection failure.
  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }

  // Handle invalid email or password.
  if (error.response.status === 401) {
    return {
      title: 'Login failed',
      message: 'Invalid email or password',
    }
  }

  // Read the error message returned by the backend.
  const apiError = error.response.data as {
    error?: string
  } | undefined

  // Return the backend error or a default message.
  return {
    title: 'Login failed',
    message:
      apiError?.error ??
      'Something went wrong. Please try again.',
  }
}