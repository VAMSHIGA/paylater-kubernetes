import { RegisterForm } from '../components/auth/RegisterForm'

export function Register() {
  return (
    <div className="glass-card rounded-3xl border border-slate-200/80 p-8 shadow-[var(--shadow-premium)] sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Create your PayLater account
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Choose how you want to use PayLater.
        </p>
      </div>

      <RegisterForm />
    </div>
  )
}
