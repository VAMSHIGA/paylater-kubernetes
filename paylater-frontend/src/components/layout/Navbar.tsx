import { ChevronDown, Menu, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatRoleLabel } from '../../utils/display'

export interface NavbarProps {
  userName?: string
  userRole?: string
  onMenuClick?: () => void
  onProfileClick?: () => void
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Navbar({
  userName = 'User',
  userRole,
  onMenuClick,
  className,
}: NavbarProps) {
  const roleLabel = formatRoleLabel(userRole)
  const initials = userName.charAt(0).toUpperCase()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className={cn(
          'inline-flex items-center justify-center rounded-xl p-2 text-text-muted lg:hidden',
          'transition-colors hover:bg-slate-100 hover:text-text',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        )}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2 lg:hidden">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-xs font-bold text-white"
          aria-hidden="true"
        >
          P
        </span>
        <span className="text-base font-bold text-text">PayLater</span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm font-medium text-text">PayLater Platform</p>
        <p className="text-xs text-text-muted">
          Secure payments and credit management
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {userRole ? (
          <span className="hidden rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 sm:inline-flex">
            {roleLabel}
          </span>
        ) : null}

        <Link
          to="/settings"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-2 py-1.5 sm:px-3',
            'transition-colors hover:bg-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initials || <User size={16} />}
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="max-w-[180px] truncate text-sm font-semibold text-text">
              {userName}
            </span>
            {userRole ? (
              <span className="text-xs text-text-muted">{roleLabel}</span>
            ) : null}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="hidden text-text-muted sm:block"
          />
        </Link>
      </div>
    </header>
  )
}
