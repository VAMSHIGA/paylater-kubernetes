import type { ReactNode } from 'react'

import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  loading?: boolean
  error?: string
}

export function StatCard({
  label,
  value,
  hint,
  loading = false,
  error,
}: StatCardProps) {
  return (
    <Card padding="md" className="h-full">
      <p className="text-sm font-medium text-text-muted">{label}</p>

      {loading ? (
        <p className="mt-2 text-sm text-text-muted">Loading...</p>
      ) : error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
      )}

      {hint && !loading && !error ? (
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      ) : null}
    </Card>
  )
}
