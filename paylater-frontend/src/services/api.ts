import axios from 'axios'

import {
  getStoredToken,
  handleUnauthorizedSession,
} from './authService'

/**
 * Base URL for the PayLater API Gateway.
 * - Local dev: /api (Vite proxies to http://localhost:8080)
 * - Production/K8s ingress: '' (same-origin; POST /auth/login hits the gateway)
 */
function resolveApiBaseUrl(): string {
  if (!import.meta.env.DEV) {
    return ''
  }

  const configured = import.meta.env.VITE_API_BASE_URL

  if (configured !== undefined && configured !== null && configured !== '') {
    return configured
  }

  return '/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

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