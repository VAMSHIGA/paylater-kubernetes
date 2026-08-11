import axios from 'axios'

import {
  getStoredToken,
  handleUnauthorizedSession,
} from './authService'

/**
 * Base URL for the PayLater API Gateway.
 * In local dev, defaults to /api so Vite proxies to http://localhost:8080.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080')

function isPublicAuthRequest(url: string | undefined): boolean {
  return url === '/auth/login' || url === '/auth/register'
}

/**
 * Shared Axios instance for API service modules.
 * Attaches Authorization: Bearer <JWT> for authenticated requests.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const isPublicAuthRoute = isPublicAuthRequest(config.url)

  if (isPublicAuthRoute) {
    return config
  }

  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url

      if (!isPublicAuthRequest(requestUrl)) {
        handleUnauthorizedSession()
      }
    }

    return Promise.reject(error)
  },
)