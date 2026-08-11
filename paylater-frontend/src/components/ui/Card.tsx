import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'interactive'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'title'> {
  children: ReactNode
  title?: string
  description?: string
  header?: ReactNode
  footer?: ReactNode
  className?: string
  padding?: CardPadding
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
  variant?: CardVariant
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-slate-200 bg-surface shadow-sm',
  bordered: 'border border-slate-300 bg-surface',
  elevated: 'border border-slate-100 bg-surface shadow-md',
  interactive:
    'border border-slate-200 bg-surface shadow-sm hover:border-primary-500/40 hover:shadow-md',
}

export function Card({
  children,
  title,
  description,
  header,
  footer,
  className,
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  variant = 'default',
  ...rest
}: CardProps) {
  const isClickable = Boolean(onClick) || clickable
  const showHover =
    hoverable || variant === 'interactive' || isClickable

  const hasHeaderSection = Boolean(header || title || description)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isClickable || !onClick) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      {...rest}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={cn(
        'w-full overflow-hidden rounded-xl text-text transition-shadow duration-150',
        variantClasses[variant],
        showHover && variant !== 'interactive' && 'hover:shadow-md',
        isClickable && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        className,
      )}
    >
      {hasHeaderSection ? (
        <div
          className={cn(
            'border-b border-slate-100',
            padding === 'none' ? 'px-6 py-4' : paddingClasses[padding],
            padding !== 'none' && 'pb-4',
          )}
        >
          {header ?? (
            <div className="flex flex-col gap-1">
              {title ? (
                <h3 className="text-base font-semibold text-text">{title}</h3>
              ) : null}
              {description ? (
                <p className="text-sm text-text-muted">{description}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          paddingClasses[padding],
          hasHeaderSection && padding !== 'none' && 'pt-4',
        )}
      >
        {children}
      </div>

      {footer ? (
        <div
          className={cn(
            'border-t border-slate-100 bg-slate-50/50',
            padding === 'none' ? 'px-6 py-4' : paddingClasses[padding],
            padding !== 'none' && 'pt-4',
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
