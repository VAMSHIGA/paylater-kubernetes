import { Outlet } from 'react-router-dom'

/**
 * Public authentication layout — no sidebar or navbar.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
