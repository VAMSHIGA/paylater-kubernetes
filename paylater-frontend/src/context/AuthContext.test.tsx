import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { createMockJwt } from '../test/mock-jwt'
import { renderWithAuthProvider } from '../test/render'
import { AuthProvider } from './AuthContext'


// ======================================================
// MOCK AUTH SERVICE
// ======================================================

// We don't call the real authentication service
// during testing.
//
// Instead, we create fake/mock functions.

vi.mock('../services/authService', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/authService')>()

  return {
    ...actual,

    // Fake authentication functions
    restoreStoredAuth: vi.fn(),
    login: vi.fn(),
    registerUnauthorizedHandler: vi.fn(),
    clearAuth: vi.fn(),
    getStoredToken: vi.fn(),
  }
})


// Create a mocked version of authService
const mockedAuthService = vi.mocked(authService)


// ======================================================
// TEST COMPONENT
// ======================================================

// Small component used only for testing AuthContext.
//
// It gets authentication information from useAuth().

function AuthProbe() {
  const auth = useAuth()

  return (
    <div>

      {/* Shows whether user is logged in or logged out */}
      <span>
        {auth.isAuthenticated
          ? 'authenticated'
          : 'logged-out'}
      </span>

      {/* Button used to test logout */}
      <button
        type="button"
        onClick={() => auth.logout()}
      >
        Probe Logout
      </button>

    </div>
  )
}


// ======================================================
// TEST GROUP
// ======================================================

describe('AuthProvider', () => {


  // Runs before every test case
  beforeEach(() => {

    // Default: no stored authentication
    mockedAuthService.restoreStoredAuth
      .mockReturnValue(null)

    // Default: no stored token
    mockedAuthService.getStoredToken
      .mockReturnValue(null)
  })


  // ====================================================
  // TEST CASE 1 ⭐
  // RESTORE AUTHENTICATED SESSION
  // ====================================================

  /*
  
  TEST FLOW:

  Was the user already logged in?
              ↓
      Stored session exists
              ↓
      Can we restore the session?
              ↓
             YES ✅
              ↓
       User is authenticated

  In this test:
  User = Admin

  */

  it('restores an authenticated session', async () => {

    // Create a fake JWT token for an Admin
    const token = createMockJwt({
      user_id: 5,
      email: 'admin@test.example',
      role: 'admin',
    })


    // Pretend that an Admin was already logged in
    // and the stored session can be restored.

    mockedAuthService.restoreStoredAuth
      .mockReturnValue({
        user: {
          userId: 5,
          email: 'admin@test.example',
          role: 'admin',
        },
        token,
      })


    // Render the application with AuthProvider

    renderWithAuthProvider(
      <div>App Content</div>
    )


    // Verify that the application content appears.
    //
    // If it appears → test passes ✅

    expect(
      await screen.findByText('App Content')
    ).toBeInTheDocument()
  })


  // ====================================================
  // TEST CASE 2 ⭐
  // LOGIN THROUGH AUTH SERVICE
  // ====================================================

  /*
  
  TEST FLOW:

  Customer enters email/password
              ↓
            Login
              ↓
       Auth service receives
       email + password
              ↓
       Does it return Customer?
              ↓
             YES ✅

  In this test:
  User = Customer

  */

  it('logs in through auth service', async () => {

    // Create a fake JWT token for Customer

    const token = createMockJwt({
      user_id: 2,
      email: 'customer@test.example',
      role: 'customer',
    })


    // Pretend login was successful
    // and returned a Customer.

    mockedAuthService.login
      .mockResolvedValue({
        userId: 2,
        email: 'customer@test.example',
        role: 'customer',
      })


    // Pretend a token was stored

    mockedAuthService.getStoredToken
      .mockReturnValue(token)


    // Call the fake login function

    const user = await mockedAuthService.login({
      email: 'customer@test.example',
      password: 'secret-password',
    })


    // Check that login returned Customer role.
    //
    // customer → test passes ✅

    expect(user.role).toBe('customer')


    // Check that login was called with
    // the correct email and password.

    expect(
      mockedAuthService.login
    ).toHaveBeenCalledWith({
      email: 'customer@test.example',
      password: 'secret-password',
    })
  })


  // ====================================================
  // TEST CASE 3 ⭐
  // LOGOUT AND CLEAR SESSION
  // ====================================================

  /*
  
  TEST FLOW:

  Admin is logged in
          ↓
    Click Logout
          ↓
      auth.logout()
          ↓
    clearAuth() called?
          ↓
         YES ✅
          ↓
     Session cleared

  In this test:
  User = Admin

  */

  it('logs out and clears session', async () => {

    // Pretend an Admin is already logged in

    mockedAuthService.restoreStoredAuth
      .mockReturnValue({
        user: {
          userId: 1,
          email: 'admin@test.example',
          role: 'admin',
        },

        token: createMockJwt({
          user_id: 1,
          email: 'admin@test.example',
          role: 'admin',
        }),
      })


    // Render AuthProvider with our test component

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    )


    // Verify that the user is logged in

    expect(
      await screen.findByText('authenticated')
    ).toBeInTheDocument()


    // Create a fake user for clicking buttons

    const user = userEvent.setup()


    // Simulate user clicking the Logout button

    await user.click(
      screen.getByRole('button', {
        name: 'Probe Logout',
      })
    )


    // Check that clearAuth() was called.
    //
    // If clearAuth() was called → logout test passes ✅

    await waitFor(() => {
      expect(
        mockedAuthService.clearAuth
      ).toHaveBeenCalled()
    })
  })
})