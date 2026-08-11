import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-text">Page Not Found</h1>
        <p className="mt-4 text-sm text-text-muted">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </section>
    </main>
  )
}
