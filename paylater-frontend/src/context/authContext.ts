import { createContext } from 'react'

import type { LoginCredentials } from '../services/authService'
import type { User } from '../types'


// ======================================================
// AUTH CONTEXT - EASY TO UNDERSTAND
// ======================================================
//
// AuthContext
//     ↓
// Stores authentication information
//     ↓
// ┌─────────────────────────┐
// │ user                    │ → Who is logged in?
// │ token                   │ → Authentication token
// │ isAuthenticated         │ → Logged in or not?
// │ isLoading               │ → Authentication loading?
// │ login()                 │ → Login user
// │ logout()                │ → Logout user
// └─────────────────────────┘
//
// These values can be shared with components such as:
// Navbar, Sidebar, Dashboard, Login, etc.
// ======================================================


// ======================================================
// AUTH CONTEXT VALUE
// ======================================================

// This interface defines what information and functions
// are available inside the AuthContext.

export interface AuthContextValue {

  // Who is currently logged in?
  // User object → logged in
  // null → no user
  user: User | null


  // Authentication token
  // Used to identify/authenticate the logged-in user.
  token: string | null


  // Checks whether the user is authenticated.
  //
  // true  → user is logged in
  // false → user is logged out
  isAuthenticated: boolean


  // Checks whether authentication is still loading.
  //
  // true  → authentication is being checked
  // false → authentication check is finished
  isLoading: boolean


  // Login function.
  //
  // Takes login credentials such as:
  // email + password
  //
  // Returns the logged-in User.

  login: (
    credentials: LoginCredentials
  ) => Promise<User>


  // Logout function.
  //
  // Logs the user out and clears the session.

  logout: () => void
}


// ======================================================
// CREATE AUTH CONTEXT
// ======================================================

// createContext() creates the React Context.
//
// Other components can access these authentication
// values through the AuthProvider/useAuth setup.

export const AuthContext =
  createContext<AuthContextValue | null>(null)