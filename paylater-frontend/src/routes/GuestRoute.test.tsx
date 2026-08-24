import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import { GuestRoute } from './GuestRoute'

vi.mock('../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

// Helper function to test GuestRoute with different authentication states and roles
function renderGuestRoute(
  path: string,
  options: {
    isAuthenticated: boolean
    isLoading: boolean
    role?: 'admin' | 'customer' | 'merchant'
  },
) {
  // Mock the current authentication state
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

  // Create test routes for Login, Register and Dashboards
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>

        {/* GuestRoute protects Login and Register pages */}
        <Route element={<GuestRoute />}>
          <Route
            path="/login"
            element={<div>Login Page</div>}
          />

          <Route
            path="/register"
            element={<div>Register Page</div>}
          />
        </Route>

        {/* Dashboard pages used to test authenticated-user redirects */}
        <Route
          path="/admin"
          element={<div>Admin Dashboard</div>}
        />

        <Route
          path="/customer"
          element={<div>Customer Dashboard</div>}
        />

        <Route
          path="/merchant"
          element={<div>Merchant Dashboard</div>}
        />

      </Routes>
    </MemoryRouter>
  )
}

describe('GuestRoute', () => {

  // 1. Authentication loading works.
  // Example: App is checking whether the user is logged in → Loading...
  it('shows loading UI while auth is loading', () => {
    renderGuestRoute('/login', {
      isAuthenticated: false,
      isLoading: true,
    })

    expect(
      screen.getByText('Loading...'),
    ).toBeInTheDocument()
  })

  // 2. Logged-out users can open Login.
  // Example: User is not logged in → /login → Login Page.
  it('allows logged-out users to access login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: false,
      isLoading: false,
    })

    expect(
      screen.getByText('Login Page'),
    ).toBeInTheDocument()
  })

  // 3. Logged-out users can open Register.
  // Example: User is not logged in → /register → Register Page.
  it('allows logged-out users to access register', () => {
    renderGuestRoute('/register', {
      isAuthenticated: false,
      isLoading: false,
    })

    expect(
      screen.getByText('Register Page'),
    ).toBeInTheDocument()
  })

  // 4. Logged-in Admin is sent to Admin Dashboard.
  // Example: Admin opens /login → redirected to /admin.
  it('redirects authenticated admin users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'admin',
    })

    expect(
      screen.getByText('Admin Dashboard'),
    ).toBeInTheDocument()
  })

  // 5. Logged-in Customer is sent to Customer Dashboard.
  // Example: Customer opens /login → redirected to /customer.
  it('redirects authenticated customer users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'customer',
    })

    expect(
      screen.getByText('Customer Dashboard'),
    ).toBeInTheDocument()
  })

  // 6. Logged-in Merchant is sent to Merchant Dashboard.
  // Example: Merchant opens /login → redirected to /merchant.
  it('redirects authenticated merchant users away from login', () => {
    renderGuestRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      role: 'merchant',
    })

    expect(
      screen.getByText('Merchant Dashboard'),
    ).toBeInTheDocument()
  })
})