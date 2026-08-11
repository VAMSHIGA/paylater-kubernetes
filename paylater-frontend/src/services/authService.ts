import axios from 'axios'

import type { ApiMessageResponse, LoginResponse, User, UserRole } from '../types'
import { apiClient } from './api'

const TOKEN_KEY = 'paylater_token'
const USER_KEY = 'paylater_user'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  role: UserRole
}

interface JwtPayload {
  user_id: number
  email: string
  role: UserRole
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')

    if (parts.length !== 3) {
      return null
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)

    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

let unauthorizedHandler: (() => void) | null = null
let isHandlingUnauthorized = false

export function registerUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export function handleUnauthorizedSession(): void {
  if (isHandlingUnauthorized) {
    return
  }

  isHandlingUnauthorized = true
  clearAuth()
  unauthorizedHandler?.()
}

function resetUnauthorizedHandling(): void {
  isHandlingUnauthorized = false
}

export function restoreStoredAuth(): {
  user: User
  token: string
} | null {
  const token = getStoredToken()
  const storedUser = getStoredUser()

  if (!token || !storedUser) {
    clearAuth()
    return null
  }

  const payload = decodeJwtPayload(token)

  if (!payload) {
    clearAuth()
    return null
  }

  const user: User = {
    userId: payload.user_id,
    email: payload.email,
    role: payload.role,
  }

  return { user, token }
}

export function getPostLoginPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'customer':
      return '/customer'
    case 'merchant':
      return '/merchant'
    default:
      return '/'
  }
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/login',
    credentials,
  )

  const payload = decodeJwtPayload(data.token)

  if (!payload) {
    throw new Error('Invalid authentication token received')
  }

  const user: User = {
    userId: payload.user_id,
    email: payload.email,
    role: payload.role,
  }

  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  resetUnauthorizedHandling()

  return user
}

export async function register(
  credentials: RegisterCredentials,
): Promise<string> {
  const { data } = await apiClient.post<ApiMessageResponse>(
    '/auth/register',
    credentials,
  )

  return data.message
}

export function getRegisterErrorMessage(error: unknown): {
  title: string
  message: string
} {
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Registration failed',
      message: 'Something went wrong. Please try again.',
    }
  }

  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }

  if (error.response.status === 409) {
    return {
      title: 'Registration failed',
      message: 'Email already registered',
    }
  }

  const apiError = error.response.data as { error?: string } | undefined

  return {
    title: 'Registration failed',
    message: apiError?.error ?? 'Something went wrong. Please try again.',
  }
}

export function getLoginErrorMessage(error: unknown): {
  title: string
  message: string
} {
  if (!axios.isAxiosError(error)) {
    return {
      title: 'Login failed',
      message: 'Something went wrong. Please try again.',
    }
  }

  if (!error.response) {
    return {
      title: 'Connection error',
      message: 'Unable to connect to the server.',
    }
  }

  if (error.response.status === 401) {
    return {
      title: 'Login failed',
      message: 'Invalid email or password',
    }
  }

  const apiError = error.response.data as { error?: string } | undefined

  return {
    title: 'Login failed',
    message: apiError?.error ?? 'Something went wrong. Please try again.',
  }
}
