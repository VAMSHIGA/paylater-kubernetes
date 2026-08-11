import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import type { AuthContextValue } from '../context/authContext'
import { AuthContext } from '../context/authContext'

interface RouterOptions {
  initialEntries?: MemoryRouterProps['initialEntries']
}

export function renderWithRouter(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: RouterOptions & RenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
    options,
  )
}

export function renderWithAuthProvider(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: RouterOptions & RenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
    options,
  )
}

export function renderWithAuthContext(
  ui: ReactElement,
  authValue: AuthContextValue,
  { initialEntries = ['/'], ...options }: RouterOptions & RenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
    </MemoryRouter>,
    options,
  )
}

export function createMockAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

export function AuthWrapper({
  children,
  authValue,
}: {
  children: ReactNode
  authValue: AuthContextValue
}) {
  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  )
}
