import { Bell, ChevronDown, Menu, Search, User } from 'lucide-react'

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
  onProfileClick,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-surface px-4 sm:px-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className={cn(
          'inline-flex items-center justify-center rounded-lg p-2 text-text-muted lg:hidden',
          'transition-colors hover:bg-slate-100 hover:text-text',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        )}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2 lg:hidden">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-xs font-bold text-white"
          aria-hidden="true"
        >
          P
        </span>
        <span className="text-base font-semibold text-text">PayLater</span>
      </div>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          placeholder="Search..."
          disabled
          aria-label="Search"
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-text',
            'placeholder:text-text-muted',
            'cursor-not-allowed opacity-70',
          )}
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            'inline-flex items-center justify-center rounded-lg p-2 text-text-muted',
            'transition-colors hover:bg-slate-100 hover:text-text',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >
          <Bell size={20} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          aria-label="User profile menu"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3',
            'transition-colors hover:bg-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-700"
            aria-hidden="true"
          >
            <User size={16} />
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-medium text-text">{userName}</span>
            {userRole ? (
              <span className="text-xs text-text-muted">{userRole}</span>
            ) : null}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="hidden text-text-muted sm:block"
          />
        </button>
      </div>
    </header>
  )
}
