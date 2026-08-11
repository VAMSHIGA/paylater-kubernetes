import { useCallback } from 'react'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function Settings() {
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          View your account details and manage your session.
        </p>
      </header>

      <Alert
        variant="info"
        message="The current API does not provide profile, password, or preferences endpoints. Account details below are from your active session."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account" padding="md">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-text-muted">Email</dt>
              <dd className="mt-1 text-sm text-text">{user?.email ?? '—'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-text-muted">Role</dt>
              <dd className="mt-1 text-sm text-text">
                {user?.role ? formatRole(user.role) : '—'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-text-muted">User ID</dt>
              <dd className="mt-1 text-sm text-text">
                {user?.userId ?? '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Session" padding="md">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-text-muted">Status</dt>
              <dd className="mt-1 text-sm text-text">
                {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <Button type="button" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
