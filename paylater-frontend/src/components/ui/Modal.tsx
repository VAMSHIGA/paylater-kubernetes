import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function handleOverlayClick() {
    if (closeOnOverlayClick) {
      onClose()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-xl',
          sizeClasses[size],
          className,
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            {title ? (
              <h2
                id={titleId}
                className="text-base font-semibold text-text"
              >
                {title}
              </h2>
            ) : (
              <span className="sr-only">Modal</span>
            )}

            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className={cn(
                  'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-text-muted',
                  'transition-colors hover:bg-slate-100 hover:text-text',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                )}
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}

        <div className="px-6 py-4">{children}</div>

        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
