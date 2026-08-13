function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-slate-200/80',
        className,
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-sm">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  )
}
