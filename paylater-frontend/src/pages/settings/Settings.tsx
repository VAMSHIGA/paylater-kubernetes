import { useCallback } from 'react'

import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { useMerchantProfile } from '../../hooks/useMerchantProfile'
import { formatRoleLabel } from '../../utils/display'

export function Settings() {
  const { user, isAuthenticated, logout } = useAuth()
  const { profile: customerProfile, loading: customerProfileLoading } =
    useCustomerProfile()
  const {
    profile: merchantProfile,
    loading: merchantProfileLoading,
    error: merchantProfileError,
  } = useMerchantProfile()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary-600">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Account Settings
        </h1>
        <p className="text-sm text-text-muted">
          View your account details and manage your session.
        </p>
      </header>

      {merchantProfileError && user?.role === 'merchant' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {merchantProfileError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account" padding="lg" variant="elevated">
          <dl className="space-y-5">
            <div>
              <dt className="text-sm font-medium text-text-muted">Email</dt>
              <dd className="mt-1 text-base font-semibold text-text">
                {user?.email ?? '—'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-text-muted">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
                  {user?.role ? formatRoleLabel(user.role) : '—'}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-text-muted">User ID</dt>
              <dd className="mt-1 text-base font-semibold text-text">
                {user?.userId ?? '—'}
              </dd>
            </div>

            {user?.role === 'customer' ? (
              <div>
                <dt className="text-sm font-medium text-text-muted">Name</dt>
                <dd className="mt-1 text-base font-semibold text-text">
                  {customerProfileLoading
                    ? 'Loading...'
                    : customerProfile?.Name ?? '—'}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        {user?.role === 'merchant' ? (
          <Card title="Merchant Profile" padding="lg" variant="elevated">
            <dl className="space-y-5">
              <div>
                <dt className="text-sm font-medium text-text-muted">
                  Merchant ID
                </dt>
                <dd className="mt-1 text-base font-semibold text-text">
                  {merchantProfileLoading
                    ? 'Loading...'
                    : merchantProfile?.ID ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-muted">
                  Merchant Name
                </dt>
                <dd className="mt-1 text-base font-semibold text-text">
                  {merchantProfileLoading
                    ? 'Loading...'
                    : merchantProfile?.MerchantName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-muted">
                  Commission Rate
                </dt>
                <dd className="mt-1 text-base font-semibold text-text">
                  {merchantProfileLoading
                    ? 'Loading...'
                    : merchantProfile?.Commission
                      ? `${merchantProfile.Commission}%`
                      : '—'}
                </dd>
              </div>
            </dl>
          </Card>
        ) : null}

        <Card title="Session" padding="lg" variant="elevated">
          <dl className="space-y-5">
            <div>
              <dt className="text-sm font-medium text-text-muted">Status</dt>
              <dd className="mt-1 text-base font-semibold text-text">
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
