import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

export interface SidebarNavItem {
  label: string
  merchantLabel?: string
  to: string
  icon: LucideIcon
  allowedRoles: UserRole[]
}

export interface SidebarProps {
  items?: SidebarNavItem[]
  collapsed?: boolean
  onCollapse?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  onLogout?: () => void
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const defaultNavItems: SidebarNavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'customer', 'merchant'],
  },
  {
    label: 'Customers',
    to: '/customers',
    icon: Users,
    allowedRoles: ['admin'],
  },
  {
    label: 'Merchants',
    merchantLabel: 'Merchant Profile',
    to: '/merchants',
    icon: Store,
    allowedRoles: ['admin', 'merchant'],
  },
  {
    label: 'Transactions',
    to: '/transactions',
    icon: Receipt,
    allowedRoles: ['admin', 'customer'],
  },
  {
    label: 'Paybacks',
    to: '/paybacks',
    icon: CreditCard,
    allowedRoles: ['admin', 'customer'],
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,
    allowedRoles: ['admin'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    allowedRoles: ['admin', 'customer', 'merchant'],
  },
]

function linkClassName(isActive: boolean, collapsed: boolean): string {
  return cn(
    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
    isActive
      ? 'bg-primary-600 text-white shadow-sm'
      : 'text-slate-300 hover:bg-white/10 hover:text-white',
    collapsed && 'justify-center px-2',
  )
}

export function Sidebar({
  items,
  collapsed = false,
  onCollapse,
  mobileOpen = false,
  onMobileClose,
  onLogout,
  className,
}: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

  const visibleItems = useMemo(() => {
    const source = items ?? defaultNavItems

    if (!user?.role) {
      return []
    }

    return source.filter((item) => item.allowedRoles.includes(user.role))
  }, [items, user?.role])

  useEffect(() => {
    onMobileClose?.()
  }, [location.pathname, onMobileClose])

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-navy-900 to-navy-800 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'w-20',
          className,
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/10 px-4',
            collapsed && 'justify-center px-2',
          )}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-white shadow-lg"
              aria-hidden="true"
            >
              P
            </span>
            {!collapsed ? (
              <span className="text-lg font-bold tracking-tight">PayLater</span>
            ) : null}
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
        >
          <ul className="flex flex-col gap-1.5">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const label =
                user?.role === 'merchant' && item.merchantLabel
                  ? item.merchantLabel
                  : item.label

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      linkClassName(isActive, collapsed)
                    }
                  >
                    <Icon size={20} aria-hidden="true" className="shrink-0" />
                    {!collapsed ? <span>{label}</span> : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(
                'mb-2 hidden w-full rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex',
                collapsed ? 'justify-center' : 'justify-start',
              )}
            >
              {collapsed ? '→' : '← Collapse'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors',
              'hover:bg-white/10 hover:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              collapsed && 'justify-center px-2',
            )}
          >
            <LogOut size={20} aria-hidden="true" className="shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>
    </>
  )
}
