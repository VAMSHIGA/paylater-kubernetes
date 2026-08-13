import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <div className="login-page min-h-screen bg-background lg:grid lg:grid-cols-2">
      <LoginBrandPanel />

      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center animate-fade-in lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-xl font-bold text-white shadow-lg shadow-primary-600/25">
              P
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">
              PayLater
            </p>
            <p className="mt-2 text-xl font-bold text-text">
              Buy today. Pay smarter.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
              Flexible payments for customers. Powerful tools for growing
              businesses.
            </p>
          </div>

          <div className="login-card animate-slide-up rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[var(--shadow-premium)] sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Welcome back 👋
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Login to your PayLater account
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
