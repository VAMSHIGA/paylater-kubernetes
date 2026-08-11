import { type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

export interface RoleGuardProps {
  allowedRoles: UserRole[]
  children?: ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-text-muted">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm font-medium text-text">Access Denied</p>
      </div>
    )
  }

  return children ?? <Outlet />
}
