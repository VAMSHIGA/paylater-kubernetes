/*
===========================================================
                AUTHENTICATION FLOW
===========================================================

User enters Email + Password
            ↓
        Login Page
            ↓
    login(credentials)
            ↓
    loginRequest(credentials)
            ↓
       authService
            ↓
     Backend Login API
            ↓
 Backend checks Email + Password
            ↓
       ┌────┴────┐
       ↓         ↓
    SUCCESS    FAILURE
       ↓         ↓
   JWT Token   Error
   + User       ↓
       ↓     Login Failed
getStoredToken()
       ↓
 setUser(user)
 setToken(token)
       ↓
isAuthenticated = true
       ↓
   User Logged In ✅


===========================================================
                 LOGOUT FLOW
===========================================================

User clicks Logout
        ↓
      logout()
        ↓
    clearAuth()
        ↓
 setUser(null)
 setToken(null)
        ↓
isAuthenticated = false
        ↓
   User Logged Out


===========================================================
             PAGE REFRESH / RESTORE FLOW
===========================================================

Application starts
        ↓
   AuthProvider
        ↓
 restoreStoredAuth()
        ↓
 Is saved session available?
        ↓
   ┌────┴────┐
   ↓         ↓
  YES        NO
   ↓         ↓
setUser()   Stay null
setToken()
   └────┬────┘
        ↓
setIsLoading(false)
        ↓
Application displayed


===========================================================
          UNAUTHORIZED / EXPIRED TOKEN FLOW
===========================================================

User makes API request
        ↓
      Backend
        ↓
 Token expired/invalid
        ↓
  401 Unauthorized
        ↓
registerUnauthorizedHandler()
        ↓
 setUser(null)
 setToken(null)
        ↓
 User becomes logged out
===========================================================
*/

import {
  // useCallback → remembers a function between renders
  useCallback,

  // useEffect → runs code after component renders
  useEffect,

  // useMemo → remembers a calculated value/object
  useMemo,

  // useState → stores data that can change
  useState,

  // ReactNode → TypeScript type for React children
  type ReactNode,
} from 'react'

import {
  // Removes saved authentication information
  clearAuth,

  // Gets the saved JWT token
  getStoredToken,

  // Calls the login API
  // Renamed to loginRequest to avoid conflict with our login function
  login as loginRequest,

  // Handles unauthorized/401 responses
  registerUnauthorizedHandler,

  // Restores previously saved user + token
  restoreStoredAuth,

  // Type for login credentials
  type LoginCredentials,
} from '../services/authService'

// User type
import type { User } from '../types'

// AuthContext → shares authentication information
// AuthContextValue → TypeScript type for context data
import { AuthContext, type AuthContextValue } from './authContext'


// Props received by AuthProvider
interface AuthProviderProps {
  // Everything placed inside <AuthProvider>
  // becomes the children
  children: ReactNode
}


// =======================================================
// AUTH PROVIDER
// =======================================================
//
// This component manages authentication for the application.
//
// It manages:
// 1. Current user
// 2. JWT token
// 3. Login
// 4. Logout
// 5. Authentication loading state
// 6. Unauthorized/expired token handling
//
// =======================================================

export function AuthProvider({ children }: AuthProviderProps) {


  // =====================================================
  // USER STATE
  // =====================================================
  //
  // Stores the currently logged-in user.
  //
  // Initially:
  // user = null
  //
  // After successful login:
  // user = logged-in user
  //
  const [user, setUser] = useState<User | null>(null)


  // =====================================================
  // TOKEN STATE
  // =====================================================
  //
  // Stores the JWT authentication token.
  //
  // Initially:
  // token = null
  //
  // After successful login:
  // token = JWT
  //
  const [token, setToken] = useState<string | null>(null)


  // =====================================================
  // LOADING STATE
  // =====================================================
  //
  // Initially true because we need to check whether
  // the user already has a saved login session.
  //
  const [isLoading, setIsLoading] = useState(true)


  // =====================================================
  // RESTORE PREVIOUS LOGIN
  // =====================================================
  //
  // This runs when AuthProvider loads.
  //
  // [] means this effect runs once when the component
  // is mounted.
  //
  useEffect(() => {

    // Check browser/storage for a previously saved
    // authentication session.
    //
    // It may return:
    //
    // {
    //   user: ...,
    //   token: ...
    // }
    //
    const session = restoreStoredAuth()


    // If a saved session exists
    if (session) {

      // Restore the saved user into React state
      setUser(session.user)

      // Restore the saved JWT token into React state
      setToken(session.token)
    }


    // Authentication checking is finished
    setIsLoading(false)

  }, [])


  // =====================================================
  // HANDLE UNAUTHORIZED REQUESTS
  // =====================================================
  //
  // This handles cases such as:
  //
  // JWT expired
  // JWT invalid
  // Backend returns 401 Unauthorized
  //
  useEffect(() => {

    // Register a function that should run when
    // authentication becomes invalid.
    registerUnauthorizedHandler(() => {

      // Remove user from React state
      setUser(null)

      // Remove token from React state
      setToken(null)
    })


    // Cleanup function
    //
    // When AuthProvider is removed, unregister the
    // unauthorized handler.
    return () => {
      registerUnauthorizedHandler(null)
    }

  }, [])


  // =====================================================
  // LOGIN
  // =====================================================
  //
  // credentials contains information such as:
  //
  // {
  //   email: "user@gmail.com",
  //   password: "123456"
  // }
  //
  const login = useCallback(async (credentials: LoginCredentials) => {


    // Send email/password to the authentication service.
    //
    // authService will communicate with the backend.
    //
    // Backend checks the credentials.
    //
    // If successful, it returns the logged-in user.
    //
    const loggedInUser = await loginRequest(credentials)


    // Get the JWT token that was stored by authService
    // after successful login.
    //
    const storedToken = getStoredToken()


    // Save the logged-in user in React state
    setUser(loggedInUser)


    // Save the JWT token in React state
    setToken(storedToken)


    // Return the logged-in user to the component
    // that called login().
    return loggedInUser

  }, [])


  // =====================================================
  // LOGOUT
  // =====================================================
  //
  // Removes the user's authentication information.
  //
  const logout = useCallback(() => {

    // Remove saved authentication information
    // from browser/storage.
    clearAuth()


    // Remove user from React state
    setUser(null)


    // Remove JWT token from React state
    setToken(null)

  }, [])


  // =====================================================
  // AUTH CONTEXT VALUE
  // =====================================================
  //
  // Create one object containing all authentication
  // information and functions.
  //
  const value = useMemo<AuthContextValue>(
    () => ({

      // Current logged-in user
      user,

      // Current JWT token
      token,

      // Checks whether user AND token exist.
      //
      // user exists + token exists
      //          ↓
      //      true
      //
      // user doesn't exist OR token doesn't exist
      //          ↓
      //      false
      //
      isAuthenticated: Boolean(user && token),

      // Authentication loading status
      isLoading,

      // Login function
      login,

      // Logout function
      logout,
    }),

    // Recalculate the context value when any of
    // these values/functions change.
    [user, token, isLoading, login, logout],
  )


  // =====================================================
  // LOADING SCREEN
  // =====================================================
  //
  // While restoreStoredAuth() is checking the previous
  // authentication session, show Loading...
  //
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-text-muted">
        Loading...
      </div>
    )
  }


  // =====================================================
  // PROVIDE AUTHENTICATION TO THE APPLICATION
  // =====================================================
  //
  // AuthContext.Provider makes the following available
  // to child components:
  //
  // user
  // token
  // isAuthenticated
  // isLoading
  // login
  // logout
  //
  // children represents the rest of the application.
  //
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}