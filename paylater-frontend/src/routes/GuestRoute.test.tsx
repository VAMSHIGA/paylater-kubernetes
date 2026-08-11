import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import { GuestRoute } from './GuestRoute'

vi.mock('../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function renderGuestRoute(
  path: string,
  options: {
    isAuthenticated: boolean
    isLoading: boolean
    role?: 'admin' | 'customer' | 'merchant'
  },
) {
  mockedUseAuth.mockReturnValue({
    user: options.isAuthenticated
      ? {
          userId: 1,
          email: 'user@test.example',
          role: options.role ?? 'admin',
        }
      : null,
    token: options.isAuthenticated ? 'token' : null,
    isAuthenticated: options.isAuthenticated,
    isLoading: options.isLoading,
    login: vi.fn(),
    logout: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/register" element={<div>Register Page</div>} />
        </Route>
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
        <Route path="/customer" element={<div>Customer Dashboard</div>} />
        <Route path="/merchant" element={<div>Merchant Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GuestRoute', () => {
  it('shows loading UI while auth is loading', () => {
    renderGuestRoute('/login', { isAuthenticated: false, isLoading: true })

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('allows logged-out users to access login', () => {
    renderGuestRoute('/login', { isAuthenticated: false, isLoading: false })

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('allows logged-out users to access register', () => {
    renderGuestRoute('/register', { isAuthenticated: false, isLoading: false })

    expect(screen.getByText('Register Page')).toBeInTheDocument()
  })

  it('redirects authenticated admin users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'admin',
    })

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('redirects authenticated customer users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'customer',
    })

    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument()
  })

  it('redirects authenticated merchant users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'merchant',
    })

    expect(screen.getByText('Merchant Dashboard')).toBeInTheDocument()
  })
})
