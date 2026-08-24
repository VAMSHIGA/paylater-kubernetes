import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'
import { RoleGuard } from './RoleGuard'

vi.mock('../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

// Helper function to test RoleGuard with different user roles
function renderRoleGuard(
  role: UserRole | null,
  allowedRoles: UserRole[],
  options: {
    isAuthenticated?: boolean
    isLoading?: boolean
  } = {},
) {
  // Mock the user's authentication and role
  mockedUseAuth.mockReturnValue({
    user: role
      ? {
          userId: 1,
          email: `${role}@test.example`,
          role,
        }
      : null,
    token: role ? 'token' : null,
    isAuthenticated: options.isAuthenticated ?? Boolean(role),
    isLoading: options.isLoading ?? false,
    login: vi.fn(),
    logout: vi.fn(),
  })

  // Create test routes for allowed and denied access
  return render(
    <MemoryRouter initialEntries={['/guarded']}>
      <Routes>

        {/* RoleGuard protects this page based on the user's role */}
        <Route element={<RoleGuard allowedRoles={allowedRoles} />}>
          <Route
            path="/guarded"
            element={<div>Allowed Content</div>}
          />
        </Route>

        {/* Login page for users who are not authenticated */}
        <Route
          path="/login"
          element={<div>Login Page</div>}
        />

      </Routes>
    </MemoryRouter>
  )
}

describe('RoleGuard', () => {

  // 1. Authentication is still loading → show Loading.
  it('shows loading UI while auth is loading', () => {
    renderRoleGuard('admin', ['admin'], {
      isAuthenticated: false,
      isLoading: true,
    })

    expect(
      screen.getByText('Loading...'),
    ).toBeInTheDocument()
  })

  // 2. User is not logged in → send user to Login.
  it('redirects unauthenticated users to login', () => {
    renderRoleGuard(null, ['admin'], {
      isAuthenticated: false,
    })

    expect(
      screen.getByText('Login Page'),
    ).toBeInTheDocument()
  })

  // 3. Admin is allowed when Admin role is required.
  it('allows admin when admin is required', () => {
    renderRoleGuard('admin', ['admin'])

    expect(
      screen.getByText('Allowed Content'),
    ).toBeInTheDocument()
  })

  // 4. Customer is denied when only Admin is allowed.
  it('denies customer when admin is required', () => {
    renderRoleGuard('customer', ['admin'])

    expect(
      screen.getByText('Access Denied'),
    ).toBeInTheDocument()
  })

  // 5. Merchant is denied when only Admin is allowed.
  it('denies merchant when admin is required', () => {
    renderRoleGuard('merchant', ['admin'])

    expect(
      screen.getByText('Access Denied'),
    ).toBeInTheDocument()
  })

  // 6. Customer is allowed when Customer role is required.
  it('allows customer when customer is required', () => {
    renderRoleGuard('customer', ['customer'])

    expect(
      screen.getByText('Allowed Content'),
    ).toBeInTheDocument()
  })

  // 7. Admin is denied when only Customer is allowed.
  it('denies admin when customer is required', () => {
    renderRoleGuard('admin', ['customer'])

    expect(
      screen.getByText('Access Denied'),
    ).toBeInTheDocument()
  })

  // 8. Merchant is allowed when Merchant role is required.
  it('allows merchant when merchant is required', () => {
    renderRoleGuard('merchant', ['merchant'])

    expect(
      screen.getByText('Allowed Content'),
    ).toBeInTheDocument()
  })

  // 9. Merchant is allowed when Admin OR Merchant is allowed.
  it('allows merchant for admin and merchant roles', () => {
    renderRoleGuard('merchant', ['admin', 'merchant'])

    expect(
      screen.getByText('Allowed Content'),
    ).toBeInTheDocument()
  })

  // 10. Customer is denied when only Admin OR Merchant is allowed.
  it('denies customer for admin and merchant roles', () => {
    renderRoleGuard('customer', ['admin', 'merchant'])

    expect(
      screen.getByText('Access Denied'),
    ).toBeInTheDocument()
  })
})


// 1. Loading → Loading...

// 2. Not logged in → Login

// 3. Admin → Admin allowed ✅

// 4. Customer → Admin denied ❌

// 5. Merchant → Admin denied ❌

// 6. Customer → Customer allowed ✅

// 7. Admin → Customer denied ❌

// 8. Merchant → Merchant allowed ✅

// 9. Merchant → Admin OR Merchant allowed ✅

// // 10. Customer → Admin OR Merchant denied ❌