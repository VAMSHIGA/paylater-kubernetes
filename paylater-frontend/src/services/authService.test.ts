import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockJwt } from '../test/mock-jwt'
import { apiClient } from './api'
import * as authService from './authService'

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    authService.registerUnauthorizedHandler(null)
    vi.restoreAllMocks()
  })

  it('returns null when logged out', () => {
    expect(authService.getStoredToken()).toBeNull()
    expect(authService.getStoredUser()).toBeNull()
    expect(authService.restoreStoredAuth()).toBeNull()
  })

  it('restores a valid stored session', () => {
    const token = createMockJwt({
      user_id: 42,
      email: 'admin@test.example',
      role: 'admin',
    })

    localStorage.setItem('paylater_token', token)
    localStorage.setItem(
      'paylater_user',
      JSON.stringify({ userId: 42, email: 'admin@test.example', role: 'admin' }),
    )

    const session = authService.restoreStoredAuth()

    expect(session).toEqual({
      user: { userId: 42, email: 'admin@test.example', role: 'admin' },
      token,
    })
  })

  it('clears storage when token is missing', () => {
    localStorage.setItem(
      'paylater_user',
      JSON.stringify({ userId: 1, email: 'a@test.example', role: 'admin' }),
    )

    expect(authService.restoreStoredAuth()).toBeNull()
    expect(localStorage.getItem('paylater_token')).toBeNull()
  })

  it('clears storage when user is missing', () => {
    localStorage.setItem('paylater_token', 'invalid')

    expect(authService.restoreStoredAuth()).toBeNull()
    expect(localStorage.getItem('paylater_user')).toBeNull()
  })

  it('clears storage when token payload is invalid', () => {
    localStorage.setItem('paylater_token', 'not.a.valid-jwt')
    localStorage.setItem(
      'paylater_user',
      JSON.stringify({ userId: 1, email: 'a@test.example', role: 'admin' }),
    )

    expect(authService.restoreStoredAuth()).toBeNull()
    expect(localStorage.getItem('paylater_token')).toBeNull()
  })

  it('logs in successfully and stores session', async () => {
    const token = createMockJwt({
      user_id: 7,
      email: 'user@test.example',
      role: 'customer',
    })

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { token } })

    const user = await authService.login({
      email: 'user@test.example',
      password: 'secret-password',
    })

    expect(user).toEqual({
      userId: 7,
      email: 'user@test.example',
      role: 'customer',
    })
    expect(authService.getStoredToken()).toBe(token)
    expect(authService.getStoredUser()).toEqual(user)
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.example',
      password: 'secret-password',
    })
  })

  it('throws when login returns an invalid token', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { token: 'bad-token' } })

    await expect(
      authService.login({
        email: 'user@test.example',
        password: 'secret-password',
      }),
    ).rejects.toThrow('Invalid authentication token received')
  })

  it('registers successfully', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { message: 'User registered successfully' },
    })

    const message = await authService.register({
      email: 'new@test.example',
      password: 'secret-password',
      role: 'customer',
    })

    expect(message).toBe('User registered successfully')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'new@test.example',
      password: 'secret-password',
      role: 'customer',
    })
  })

  it('clears auth on logout', () => {
    const token = createMockJwt({
      user_id: 1,
      email: 'a@test.example',
      role: 'admin',
    })

    localStorage.setItem('paylater_token', token)
    localStorage.setItem(
      'paylater_user',
      JSON.stringify({ userId: 1, email: 'a@test.example', role: 'admin' }),
    )

    authService.clearAuth()

    expect(authService.getStoredToken()).toBeNull()
    expect(authService.getStoredUser()).toBeNull()
  })

  it('maps login failure to a user-friendly message', () => {
    const error = new axios.AxiosError(
      'Unauthorized',
      '401',
      undefined,
      undefined,
      {
        status: 401,
        data: { error: 'invalid credentials' },
        statusText: 'Unauthorized',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      },
    )

    expect(authService.getLoginErrorMessage(error)).toEqual({
      title: 'Login failed',
      message: 'Invalid email or password',
    })
  })

  it('maps register conflict to a user-friendly message', () => {
    const error = new axios.AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        data: { error: 'email already registered' },
        statusText: 'Conflict',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      },
    )

    expect(authService.getRegisterErrorMessage(error)).toEqual({
      title: 'Registration failed',
      message: 'Email already registered',
    })
  })

  it('returns post-login paths by role', () => {
    expect(authService.getPostLoginPath('admin')).toBe('/admin')
    expect(authService.getPostLoginPath('customer')).toBe('/customer')
    expect(authService.getPostLoginPath('merchant')).toBe('/merchant')
  })

  it('invokes unauthorized handler and clears storage on 401 handling', () => {
    const handler = vi.fn()
    authService.registerUnauthorizedHandler(handler)

    localStorage.setItem('paylater_token', 'token')
    localStorage.setItem('paylater_user', '{}')

    authService.handleUnauthorizedSession()

    expect(handler).toHaveBeenCalledOnce()
    expect(authService.getStoredToken()).toBeNull()
  })
})
