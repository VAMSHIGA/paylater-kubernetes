import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { getPostLoginPath } from '../services/authService'

/**
 * Role-based dashboard entry — redirects authenticated users to their dashboard.
 */
export function Home() {
  // Get the currently logged-in user
  const { user } = useAuth()

  // If there is no logged-in user, don't redirect
  if (!user) {
    return null
  }

  // decides which URL/dashboard to go to based on the user's role.
  return <Navigate to={getPostLoginPath(user.role)} replace />
}