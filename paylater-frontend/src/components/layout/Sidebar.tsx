// Import icons from lucide-react
import {
  BarChart3,          // Reports icon
  CreditCard,         // Paybacks icon
  LayoutDashboard,    // Dashboard icon
  LogOut,             // Logout icon
  Receipt,            // Transactions icon
  Settings,           // Settings icon
  Store,              // Merchants icon
  Users,              // Customers icon
  type LucideIcon,    // Type for icons
} from 'lucide-react'

// React hooks
import { useEffect, useMemo } from 'react'

// React Router
// NavLink = navigation between pages
// useLocation = gets the current URL
import { NavLink, useLocation } from 'react-router-dom'

// Get the currently logged-in user
import { useAuth } from '../../hooks/useAuth'

// User roles: admin, customer, merchant
import type { UserRole } from '../../types'


// ======================================================
// 1. SIDEBAR NAVIGATION ITEM INTERFACE
// ======================================================

// Defines what information every Sidebar menu item needs
export interface SidebarNavItem {
  label: string              // Menu name: Dashboard, Customers, etc.
  merchantLabel?: string     // Special name for Merchant
  to: string                 // URL: /, /customers, /settings, etc.
  icon: LucideIcon           // Menu icon
  allowedRoles: UserRole[]   // Which roles can see this menu
}


// ======================================================
// 2. SIDEBAR PROPS
// ======================================================

export interface SidebarProps {
  items?: SidebarNavItem[]      // Optional custom menu items

  collapsed?: boolean           // Sidebar collapsed or normal

  onCollapse?: () => void      // Function called when Collapse is clicked

  mobileOpen?: boolean          // Is mobile Sidebar open?

  onMobileClose?: () => void   // Function to close mobile Sidebar

  onLogout?: () => void         // Function called when Logout is clicked

  className?: string            // Additional CSS class
}


// ======================================================
// 3. cn() FUNCTION
// ======================================================

// Combines CSS classes together.
// It removes false/undefined values.
function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}


// ======================================================
// 4. DEFAULT SIDEBAR MENU
// ======================================================

// This is where we define:
// Which menu exists
// Which URL it goes to
// Which roles can see it

const defaultNavItems: SidebarNavItem[] = [

  // ---------------- Dashboard ----------------
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,

    // All users can see Dashboard
    allowedRoles: ['admin', 'customer', 'merchant'],
  },


  // ---------------- Customers ----------------
  {
    label: 'Customers',
    to: '/customers',
    icon: Users,

    // Only Admin can see Customers
    allowedRoles: ['admin'],
  },


  // ---------------- Merchants ----------------
  {
    label: 'Merchants',

    // Merchant will see "Merchant Profile"
    merchantLabel: 'Merchant Profile',

    to: '/merchants',
    icon: Store,

    // Admin and Merchant can see this
    allowedRoles: ['admin', 'merchant'],
  },


  // ---------------- Transactions ----------------
  {
    label: 'Transactions',
    to: '/transactions',
    icon: Receipt,

    // Admin and Customer can see Transactions
    allowedRoles: ['admin', 'customer'],
  },


  // ---------------- Paybacks ----------------
  {
    label: 'Paybacks',
    to: '/paybacks',
    icon: CreditCard,

    // Admin and Customer can see Paybacks
    allowedRoles: ['admin', 'customer'],
  },


  // ---------------- Reports ----------------
  {
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,

    // Only Admin can see Reports
    allowedRoles: ['admin'],
  },


  // ---------------- Settings ----------------
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,

    // Everyone can see Settings
    allowedRoles: ['admin', 'customer', 'merchant'],
  },
]


// ======================================================
// 5. ACTIVE LINK STYLING
// ======================================================

// This function controls the appearance of a Sidebar link.
//
// isActive:
//   true  = current page
//   false = normal page
//
// collapsed:
//   true  = Sidebar is collapsed
//   false = Sidebar is normal

function linkClassName(
  isActive: boolean,
  collapsed: boolean
): string {

  return cn(

    // Normal Sidebar link styling
    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',

    // Focus styling
    'focus:outline-none focus:ring-2 focus:ring-primary-500/20',

    // If link is active → highlighted styling
    // Otherwise → normal styling
    isActive
      ? 'bg-primary-600 text-white shadow-sm'
      : 'text-slate-300 hover:bg-white/10 hover:text-white',

    // If Sidebar is collapsed → center the icon
    collapsed && 'justify-center px-2',
  )
}


// ======================================================
// 6. SIDEBAR COMPONENT
// ======================================================

export function Sidebar({

  items,

  // Default: Sidebar is NOT collapsed
  collapsed = false,

  onCollapse,

  // Default: Mobile Sidebar is closed
  mobileOpen = false,

  onMobileClose,

  onLogout,

  className,

}: SidebarProps) {


  // ====================================================
  // 7. GET CURRENT URL
  // ====================================================

  // useLocation() gives the current URL.
  //
  // Example:
  // /transactions
  // /settings
  // /customers

  const location = useLocation()


  // ====================================================
  // 8. GET LOGGED-IN USER
  // ====================================================

  // useAuth() gives the currently logged-in user.
  //
  // Example:
  // user.role = 'customer'
  // user.role = 'admin'
  // user.role = 'merchant'

  const { user } = useAuth()


  // ====================================================
  // 9. ROLE-BASED SIDEBAR LOGIC ⭐
  // ====================================================

  // This creates the menu items that the current
  // logged-in user is allowed to see.

  const visibleItems = useMemo(() => {

    // If custom items are provided, use them.
    // Otherwise use defaultNavItems.
    const source = items ?? defaultNavItems


    // If there is no logged-in user role,
    // don't show any menu.
    if (!user?.role) {
      return []
    }


    // Check every menu item's allowedRoles.
    //
    // Example:
    //
    // user.role = 'customer'
    //
    // Dashboard:
    // allowedRoles = ['admin', 'customer', 'merchant']
    // customer exists → YES ✅
    //
    // Customers:
    // allowedRoles = ['admin']
    // customer exists → NO ❌
    //
    // Therefore Customers will not be displayed.

    return source.filter((item) =>
      item.allowedRoles.includes(user.role)
    )

  }, [items, user?.role])


  // ====================================================
  // 10. CLOSE MOBILE SIDEBAR WHEN URL CHANGES
  // ====================================================

  useEffect(() => {

    // When the user navigates to another page,
    // close the mobile Sidebar.

    onMobileClose?.()

  }, [location.pathname, onMobileClose])


  // ====================================================
  // 11. RETURN SIDEBAR UI
  // ====================================================

  return (
    <>


      {/* ==============================================
          12. MOBILE DARK OVERLAY
          ============================================== */}

      {mobileOpen ? (

        // If mobile Sidebar is open,
        // show dark overlay behind it.

        <button
          type="button"

          // Accessibility label
          aria-label="Close navigation menu"

          // Dark transparent background
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"

          // Clicking overlay closes Sidebar
          onClick={onMobileClose}
        />

      ) : null}


      {/* ==============================================
          13. SIDEBAR CONTAINER
          ============================================== */}

      <aside
        className={cn(

          // Main Sidebar design
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-navy-900 to-navy-800 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',

          // Mobile:
          //
          // open  → show Sidebar
          // closed → hide Sidebar
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full',

          // If collapsed → make Sidebar smaller
          collapsed && 'w-20',

          className,
        )}
      >


        {/* ============================================
            14. PAYLATER LOGO
            ============================================ */}

        <div
          className={cn(

            // Header styling
            'flex h-16 shrink-0 items-center border-b border-white/10 px-4',

            // If collapsed → center the P icon
            collapsed && 'justify-center px-2',
          )}
        >

          <div className="flex items-center gap-2.5">

            {/* PayLater P logo */}
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-white shadow-lg"
              aria-hidden="true"
            >
              P
            </span>


            {/* If NOT collapsed → show PayLater text */}
            {!collapsed ? (
              <span className="text-lg font-bold tracking-tight">
                PayLater
              </span>
            ) : null}

          </div>

        </div>


        {/* ============================================
            15. NAVIGATION AREA
            ============================================ */}

        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
        >

          <ul className="flex flex-col gap-1.5">


            {/* ========================================
                16. DISPLAY ALLOWED MENU ITEMS
                ======================================== */}

            {visibleItems.map((item) => {

              // Get the icon for this menu
              const Icon = item.icon


              // ======================================
              // 17. MERCHANT LABEL CONDITION
              // ======================================

              // If the logged-in user is Merchant
              // AND merchantLabel exists,
              // use "Merchant Profile".
              //
              // Otherwise use normal label.

              const label =
                user?.role === 'merchant' && item.merchantLabel
                  ? item.merchantLabel
                  : item.label


              return (

                // Each menu item
                <li key={item.to}>


                  {/* ==================================
                      18. REACT ROUTER NAVIGATION
                      ================================== */}

                  <NavLink
                    to={item.to}

                    // Dashboard "/" should match exactly
                    end={item.to === '/'}

                    // If collapsed, show label as tooltip
                    title={
                      collapsed
                        ? label
                        : undefined
                    }


                    // Check if this link is active
                    className={({ isActive }) =>
                      linkClassName(
                        isActive,
                        collapsed
                      )
                    }
                  >


                    {/* Menu icon */}
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="shrink-0"
                    />


                    {/* If Sidebar is NOT collapsed,
                        show menu text */}
                    {!collapsed ? (
                      <span>{label}</span>
                    ) : null}

                  </NavLink>

                </li>
              )
            })}

          </ul>

        </nav>


        {/* ============================================
            19. BOTTOM SECTION
            ============================================ */}

        <div className="border-t border-white/10 p-3">


          {/* ==========================================
              20. COLLAPSE BUTTON
              ========================================== */}

          {onCollapse ? (

            <button
              type="button"

              // When clicked, call onCollapse
              onClick={onCollapse}

              className={cn(

                // Button styling
                'mb-2 hidden w-full rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex',

                // Center button when collapsed
                collapsed
                  ? 'justify-center'
                  : 'justify-start',
              )}
            >

              {/* Change text based on collapsed state */}
              {collapsed
                ? '→'
                : '← Collapse'}

            </button>

          ) : null}


          {/* ==========================================
              21. LOGOUT BUTTON
              ========================================== */}

          <button
            type="button"

            // When clicked, call logout function
            onClick={onLogout}

            // If collapsed, title shows "Logout"
            title={
              collapsed
                ? 'Logout'
                : undefined
            }

            className={cn(

              // Logout button styling
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors',

              // Hover styling
              'hover:bg-white/10 hover:text-white',

              // Focus styling
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20',

              // Center icon when collapsed
              collapsed && 'justify-center px-2',
            )}
          >

            {/* Logout icon */}
            <LogOut
              size={20}
              aria-hidden="true"
              className="shrink-0"
            />


            {/* Show "Logout" text when NOT collapsed */}
            {!collapsed ? (
              <span>Logout</span>
            ) : null}

          </button>

        </div>

      </aside>

    </>
  )
}