import { Loader2 } from 'lucide-react'
import { type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-primary-500/20 disabled:bg-primary-600/60',
  secondary:
    'bg-slate-100 text-text hover:bg-slate-200 focus:ring-primary-500/20 disabled:bg-slate-100/60',
  outline:
    'border border-slate-300 bg-surface text-text hover:bg-slate-50 focus:ring-primary-500/20',
  ghost:
    'text-text-muted hover:bg-slate-100 hover:text-text focus:ring-primary-500/20',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-70',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}
