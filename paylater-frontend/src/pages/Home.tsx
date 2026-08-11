import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { getPostLoginPath } from '../services/authService'

/**
 * Role-based dashboard entry — redirects authenticated users to their dashboard.
 */
export function Home() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return <Navigate to={getPostLoginPath(user.role)} replace />
}
