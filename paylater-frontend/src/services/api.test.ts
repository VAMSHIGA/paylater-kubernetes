import axios, { type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestUser, seedAuthStorage } from '../test/auth-helpers'
import { createMockJwt } from '../test/mock-jwt'
import * as authService from './authService'
import { apiClient } from './api'

function getAuthorizationHeader(
  config: InternalAxiosRequestConfig,
): string | undefined {
  const headers = config.headers

  if (!headers) {
    return undefined
  }

  if (typeof headers.get === 'function') {
    return headers.get('Authorization') as string | undefined
  }

  return (headers as Record<string, string | undefined>).Authorization
}

describe('apiClient interceptors', () => {
  const originalAdapter = apiClient.defaults.adapter

  beforeEach(async () => {
    localStorage.clear()
    authService.registerUnauthorizedHandler(null)

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        token: createMockJwt({
          user_id: 1,
          email: 'reset@test.example',
          role: 'admin',
        }),
      },
    })

    await authService.login({
      email: 'reset@test.example',
      password: 'reset-password',
    })
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    authService.registerUnauthorizedHandler(null)
  })

  it('attaches Authorization header for protected requests', async () => {
    seedAuthStorage(createTestUser('admin'), 'mock-token')
    let capturedAuthorization: string | undefined

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      capturedAuthorization = getAuthorizationHeader(config)

      return {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    await apiClient.get('/customers')

    expect(capturedAuthorization).toBe('Bearer mock-token')
  })

  it('does not attach Authorization header for login', async () => {
    seedAuthStorage(createTestUser('admin'), 'mock-token')
    let capturedAuthorization: string | undefined

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      capturedAuthorization = getAuthorizationHeader(config)

      return {
        data: { token: 'ignored' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    await apiClient.post('/auth/login', {
      email: 'user@test.example',
      password: 'secret-password',
    })

    expect(capturedAuthorization).toBeUndefined()
  })

  it('does not attach Authorization header for register', async () => {
    seedAuthStorage(createTestUser('admin'), 'mock-token')
    let capturedAuthorization: string | undefined

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      capturedAuthorization = getAuthorizationHeader(config)

      return {
        data: { message: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    await apiClient.post('/auth/register', {
      email: 'user@test.example',
      password: 'secret-password',
      role: 'customer',
    })

    expect(capturedAuthorization).toBeUndefined()
  })

  it('clears session when protected request returns 401', async () => {
    seedAuthStorage(createTestUser('admin'))
    const handler = vi.fn()
    authService.registerUnauthorizedHandler(handler)

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = new axios.AxiosError(
        'Unauthorized',
        '401',
        config,
        undefined,
        {
          status: 401,
          data: { error: 'unauthorized' },
          statusText: 'Unauthorized',
          headers: {},
          config,
        },
      )

      throw error
    }

    await expect(apiClient.get('/customers')).rejects.toThrow()
    expect(authService.getStoredToken()).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not clear session when login returns 401', async () => {
    seedAuthStorage(createTestUser('admin'), 'session-token')

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = new axios.AxiosError(
        'Unauthorized',
        '401',
        config,
        undefined,
        {
          status: 401,
          data: { error: 'invalid credentials' },
          statusText: 'Unauthorized',
          headers: {},
          config,
        },
      )

      throw error
    }

    await expect(
      apiClient.post('/auth/login', {
        email: 'user@test.example',
        password: 'secret-password',
      }),
    ).rejects.toThrow()

    expect(authService.getStoredToken()).toBe('session-token')
  })

  it('does not clear session for 403 responses', async () => {
    seedAuthStorage(createTestUser('admin'), 'session-token')

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = new axios.AxiosError(
        'Forbidden',
        '403',
        config,
        undefined,
        {
          status: 403,
          data: { error: 'forbidden' },
          statusText: 'Forbidden',
          headers: {},
          config,
        },
      )

      throw error
    }

    await expect(apiClient.get('/customers')).rejects.toThrow()
    expect(authService.getStoredToken()).toBe('session-token')
  })

  it('does not clear session for 500 responses', async () => {
    seedAuthStorage(createTestUser('admin'), 'session-token')

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = new axios.AxiosError(
        'Server Error',
        '500',
        config,
        undefined,
        {
          status: 500,
          data: { error: 'internal error' },
          statusText: 'Internal Server Error',
          headers: {},
          config,
        },
      )

      throw error
    }

    await expect(apiClient.get('/customers')).rejects.toThrow()
    expect(authService.getStoredToken()).toBe('session-token')
  })
})
