import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  clearAuth,
  getStoredToken,
  login as loginRequest,
  registerUnauthorizedHandler,
  restoreStoredAuth,
  type LoginCredentials,
} from '../services/authService'
import type { User } from '../types'
import { AuthContext, type AuthContextValue } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = restoreStoredAuth()

    if (session) {
      setUser(session.user)
      setToken(session.token)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null)
      setToken(null)
    })

    return () => {
      registerUnauthorizedHandler(null)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await loginRequest(credentials)
    const storedToken = getStoredToken()

    setUser(loggedInUser)
    setToken(storedToken)

    return loggedInUser
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-text-muted">
        Loading...
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
