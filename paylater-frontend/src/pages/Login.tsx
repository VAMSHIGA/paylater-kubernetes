import { Card } from '../components/ui/Card'
import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <Card padding="lg" className="w-full">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
          P
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          PayLater
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Welcome Back</h1>
        <p className="mt-2 text-sm text-text-muted">
          Sign in to continue to your PayLater account.
        </p>
      </div>

      <LoginForm />
    </Card>
  )
}
