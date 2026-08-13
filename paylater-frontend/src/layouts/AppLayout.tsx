import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Navbar } from '../components/layout/Navbar'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../hooks/useAuth'

/**
 * Root application layout shell with sidebar and top navigation.
 */
export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleMobileClose = useCallback(() => setMobileOpen(false), [])
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="dashboard-grid flex min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          userName={user?.email ?? 'User'}
          userRole={user?.role}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
