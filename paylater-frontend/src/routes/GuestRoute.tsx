import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { getPostLoginPath } from '../services/authService'

export function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-text-muted">
        Loading...
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostLoginPath(user.role)} replace />
  }

  return <Outlet />
}
