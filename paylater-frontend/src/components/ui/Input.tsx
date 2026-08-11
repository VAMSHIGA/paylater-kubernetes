import { type InputHTMLAttributes, useId } from 'react'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  id: idProp,
  required,
  disabled,
  readOnly,
  type = 'text',
  ...inputProps
}: InputProps) {
  const generatedId = useId()
  const inputId = idProp ?? generatedId
  const hasError = Boolean(error)
  const messageId = `${inputId}-message`
  const showMessage = hasError || Boolean(helperText)

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-text',
            disabled && 'text-text-muted',
          )}
        >
          {label}
          {required ? (
            <span className="text-error" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <input
        id={inputId}
        type={type}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={hasError || undefined}
        aria-describedby={showMessage ? messageId : undefined}
        aria-required={required || undefined}
        className={cn(
          'block rounded-lg border bg-surface px-3 py-2 text-sm text-text',
          'placeholder:text-text-muted',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          fullWidth ? 'w-full' : 'w-auto min-w-[12rem]',
          hasError
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/20',
          disabled &&
            'cursor-not-allowed border-slate-200 bg-slate-50 text-text-muted',
          readOnly && 'cursor-default border-slate-200 bg-slate-50',
          className,
        )}
        {...inputProps}
      />

      {hasError ? (
        <p
          id={messageId}
          role="alert"
          className="text-sm text-error"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className="text-sm text-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
