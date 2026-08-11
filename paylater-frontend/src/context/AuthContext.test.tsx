import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { createMockJwt } from '../test/mock-jwt'
import { renderWithAuthProvider } from '../test/render'
import { AuthProvider } from './AuthContext'

vi.mock('../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/authService')>()

  return {
    ...actual,
    restoreStoredAuth: vi.fn(),
    login: vi.fn(),
    registerUnauthorizedHandler: vi.fn(),
    clearAuth: vi.fn(),
    getStoredToken: vi.fn(),
  }
})

const mockedAuthService = vi.mocked(authService)

function AuthProbe() {
  const auth = useAuth()

  return (
    <div>
      <span>{auth.isAuthenticated ? 'authenticated' : 'logged-out'}</span>
      <button type="button" onClick={() => auth.logout()}>
        Probe Logout
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mockedAuthService.restoreStoredAuth.mockReturnValue(null)
    mockedAuthService.getStoredToken.mockReturnValue(null)
  })

  it('restores an authenticated session', async () => {
    const token = createMockJwt({
      user_id: 5,
      email: 'admin@test.example',
      role: 'admin',
    })

    mockedAuthService.restoreStoredAuth.mockReturnValue({
      user: { userId: 5, email: 'admin@test.example', role: 'admin' },
      token,
    })

    renderWithAuthProvider(<div>App Content</div>)

    expect(await screen.findByText('App Content')).toBeInTheDocument()
  })

  it('logs in through auth service', async () => {
    const token = createMockJwt({
      user_id: 2,
      email: 'customer@test.example',
      role: 'customer',
    })

    mockedAuthService.login.mockResolvedValue({
      userId: 2,
      email: 'customer@test.example',
      role: 'customer',
    })
    mockedAuthService.getStoredToken.mockReturnValue(token)

    const user = await mockedAuthService.login({
      email: 'customer@test.example',
      password: 'secret-password',
    })

    expect(user.role).toBe('customer')
    expect(mockedAuthService.login).toHaveBeenCalledWith({
      email: 'customer@test.example',
      password: 'secret-password',
    })
  })

  it('logs out and clears session', async () => {
    mockedAuthService.restoreStoredAuth.mockReturnValue({
      user: { userId: 1, email: 'admin@test.example', role: 'admin' },
      token: createMockJwt({
        user_id: 1,
        email: 'admin@test.example',
        role: 'admin',
      }),
    })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    expect(await screen.findByText('authenticated')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Probe Logout' }))

    await waitFor(() => {
      expect(mockedAuthService.clearAuth).toHaveBeenCalled()
    })
  })
})
