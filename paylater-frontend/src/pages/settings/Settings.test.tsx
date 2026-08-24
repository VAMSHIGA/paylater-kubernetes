import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import { Settings } from './Settings'

describe('Settings', () => {

  // Test Case 1: Display authenticated user account details
  it('displays authenticated account details', () => {
    renderWithAuthContext(
      <Settings />,
      createMockAuthValue({
        isAuthenticated: true,
        user: {
          userId: 42,
          email: 'user@test.example',
          role: 'customer',
        },
        token: 'token',
      }),
    )

    expect(screen.getByText('user@test.example')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Authenticated')).toBeInTheDocument()
  })


  // Test Case 2: Check logout button calls logout function
  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    renderWithAuthContext(
      <Settings />,
      createMockAuthValue({
        isAuthenticated: true,
        user: {
          userId: 1,
          email: 'admin@test.example',
          role: 'admin',
        },
        token: 'token',
        logout,
      }),
    )

    await user.click(
      screen.getByRole('button', { name: 'Logout' }),
    )

    expect(logout).toHaveBeenCalledOnce()
  })
})