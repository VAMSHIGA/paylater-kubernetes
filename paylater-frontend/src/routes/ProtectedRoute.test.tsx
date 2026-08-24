import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function renderProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  mockedUseAuth.mockReturnValue({
    user: isAuthenticated
      ? { userId: 1, email: 'user@test.example', role: 'admin' }
      : null,
    token: isAuthenticated ? 'token' : null,
    isAuthenticated,
    isLoading,
    login: vi.fn(),
    logout: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows loading UI while auth is loading', () => {
    renderProtectedRoute(false, true)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    renderProtectedRoute(false, false)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders protected content for authenticated users', () => {
    renderProtectedRoute(true, false)

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

// ProtectedRoute = "Are you logged in? If yes, enter the application. If no, go to Login."