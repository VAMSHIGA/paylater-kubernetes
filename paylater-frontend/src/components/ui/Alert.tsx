import {
  CheckCircle2,
  CircleX,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react'
import { type ReactNode } from 'react'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export interface AlertProps {
  variant: AlertVariant
  message: string
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const variantConfig: Record<
  AlertVariant,
  {
    icon: ReactNode
    container: string
    iconClassName: string
    titleClassName: string
    messageClassName: string
    live: 'assertive' | 'polite'
  }
> = {
  success: {
    icon: <CheckCircle2 size={20} aria-hidden="true" />,
    container: 'border-green-200 bg-green-50',
    iconClassName: 'text-success',
    titleClassName: 'text-success',
    messageClassName: 'text-green-800',
    live: 'polite',
  },
  error: {
    icon: <CircleX size={20} aria-hidden="true" />,
    container: 'border-red-200 bg-red-50',
    iconClassName: 'text-error',
    titleClassName: 'text-error',
    messageClassName: 'text-red-800',
    live: 'assertive',
  },
  warning: {
    icon: <TriangleAlert size={20} aria-hidden="true" />,
    container: 'border-amber-200 bg-amber-50',
    iconClassName: 'text-warning',
    titleClassName: 'text-warning',
    messageClassName: 'text-amber-900',
    live: 'polite',
  },
  info: {
    icon: <Info size={20} aria-hidden="true" />,
    container: 'border-primary-100 bg-primary-50',
    iconClassName: 'text-primary-600',
    titleClassName: 'text-primary-700',
    messageClassName: 'text-primary-800',
    live: 'polite',
  },
}

export function Alert({
  variant,
  message,
  title,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const config = variantConfig[variant]

  return (
    <div
      role="alert"
      aria-live={config.live}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 shadow-sm',
        config.container,
        className,
      )}
    >
      <span className={cn('mt-0.5 shrink-0', config.iconClassName)}>
        {config.icon}
      </span>

      <div className="min-w-0 flex-1">
        {title ? (
          <p className={cn('text-sm font-semibold', config.titleClassName)}>
            {title}
          </p>
        ) : null}
        <p
          className={cn(
            'text-sm',
            title ? 'mt-1' : undefined,
            config.messageClassName,
          )}
        >
          {message}
        </p>
      </div>

      {dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-text-muted',
            'transition-colors hover:bg-white/60 hover:text-text',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
