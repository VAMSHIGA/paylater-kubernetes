import { Outlet } from 'react-router-dom'

import { AuthBrandPanel } from '../components/auth/AuthBrandPanel'

/**
 * Authentication layout for Login / Register.
 *
 * Desktop:
 * 2 columns → Branding | Login/Register
 *
 * Mobile:
 * 1 column → Mobile Branding + Login/Register
 */
export function AuthLayout() {
  return (

    // Main authentication container
    // Desktop (lg): 2 columns
    // Mobile: 1 column
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">

      {/* Desktop LEFT column: Branding / Design */}
      <AuthBrandPanel />

      {/* Desktop RIGHT column / Mobile main column */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">

        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile ONLY branding
              lg:hidden = hidden on desktop */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-lg">
              P
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">
              PayLater
            </p>

            <p className="mt-2 text-lg font-semibold text-text">
              Buy today. Pay smarter.
            </p>
          </div>

          {/* Login / Register page appears here */}
          <Outlet />

        </div>
      </div>
    </div>
  )
}