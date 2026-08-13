import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Skeleton } from './Skeleton'

export interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  accent?: 'default' | 'primary' | 'success' | 'warning'
  loading?: boolean
  className?: string
}

const accentClasses = {
  default: 'bg-slate-50 text-slate-600',
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'default',
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={`group rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-28" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {value}
            </p>
          )}
          {hint && !loading ? (
            <p className="mt-1 text-xs text-text-muted">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}
          >
            <Icon size={20} aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
