import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'

export function NotFound() {
  // Used to navigate the user to another page
  const navigate = useNavigate()

  return (
    // Full-screen 404 page
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">

      {/* 404 message box */}
      <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-surface p-8 text-center shadow-sm">

        {/* Shows 404 */}
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          404
        </p>

        {/* Page title */}
        <h1 className="mt-2 text-3xl font-semibold text-text">
          Page Not Found
        </h1>

        {/* Explanation to the user */}
        <p className="mt-4 text-sm text-text-muted">
          The page you are looking for does not exist or may have been moved.
        </p>

        {/* Go back to Dashboard */}
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