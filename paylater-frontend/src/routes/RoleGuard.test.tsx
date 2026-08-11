import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'
import { RoleGuard } from './RoleGuard'

vi.mock('../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function renderRoleGuard(
  role: UserRole | null,
  allowedRoles: UserRole[],
  options: { isAuthenticated?: boolean; isLoading?: boolean } = {},
) {
  mockedUseAuth.mockReturnValue({
    user: role
      ? { userId: 1, email: `${role}@test.example`, role }
      : null,
    token: role ? 'token' : null,
    isAuthenticated: options.isAuthenticated ?? Boolean(role),
    isLoading: options.isLoading ?? false,
    login: vi.fn(),
    logout: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={['/guarded']}>
      <Routes>
        <Route element={<RoleGuard allowedRoles={allowedRoles} />}>
          <Route path="/guarded" element={<div>Allowed Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleGuard', () => {
  it('shows loading UI while auth is loading', () => {
    renderRoleGuard('admin', ['admin'], { isAuthenticated: false, isLoading: true })

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    renderRoleGuard(null, ['admin'], { isAuthenticated: false })

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('allows admin when admin is required', () => {
    renderRoleGuard('admin', ['admin'])

    expect(screen.getByText('Allowed Content')).toBeInTheDocument()
  })

  it('denies customer when admin is required', () => {
    renderRoleGuard('customer', ['admin'])

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('denies merchant when admin is required', () => {
    renderRoleGuard('merchant', ['admin'])

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('allows customer when customer is required', () => {
    renderRoleGuard('customer', ['customer'])

    expect(screen.getByText('Allowed Content')).toBeInTheDocument()
  })

  it('denies admin when customer is required', () => {
    renderRoleGuard('admin', ['customer'])

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('allows merchant when merchant is required', () => {
    renderRoleGuard('merchant', ['merchant'])

    expect(screen.getByText('Allowed Content')).toBeInTheDocument()
  })

  it('allows merchant for admin and merchant roles', () => {
    renderRoleGuard('merchant', ['admin', 'merchant'])

    expect(screen.getByText('Allowed Content')).toBeInTheDocument()
  })

  it('denies customer for admin and merchant roles', () => {
    renderRoleGuard('customer', ['admin', 'merchant'])

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })
})
