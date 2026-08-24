// Import icons from lucide-react
import { ChevronDown, Menu, User } from 'lucide-react'

// Link is used for navigation using React Router
import { Link } from 'react-router-dom'

// Helper function used to display the user's role
// Example: "customer" → "Customer"
import { formatRoleLabel } from '../../utils/display'


// Props that can be passed to the Navbar component
export interface NavbarProps {

  // User's name
  // Example: "Galinki Vamshi"
  userName?: string

  // User's role
  // Example: "customer", "merchant", "admin"
  userRole?: string

  // Function called when the mobile menu button is clicked
  onMenuClick?: () => void

  // Function that can be used when profile is clicked
  onProfileClick?: () => void

  // Additional CSS classes
  className?: string
}


// Helper function for combining CSS classes
function cn(
  ...parts: Array<string | false | undefined>
): string {
  return parts.filter(Boolean).join(' ')
}


// Navbar component
export function Navbar({
  // Default user name is "User"
  userName = 'User',

  // User role
  userRole,

  // Function for mobile menu
  onMenuClick,

  // Additional CSS class
  className,

}: NavbarProps) {


  // Convert the role into a readable format
  //
  // Example:
  // "customer" → "Customer"
  // "merchant" → "Merchant"
  // "admin" → "Admin"
  const roleLabel = formatRoleLabel(userRole)


  // Get the first letter of the user's name
  //
  // Example:
  // "Galinki" → "G"
  //
  // Convert it to uppercase
  const initials = userName.charAt(0).toUpperCase()


  // Return the Navbar UI
  return (

    <header
      className={cn(

        // Navbar stays at the top when scrolling
        'sticky top-0 z-30',

        // Navbar layout
        'flex h-16 shrink-0 items-center gap-4',

        // Border and background
        'border-b border-slate-200/80 bg-white/90',

        // Padding
        'px-4 sm:px-6',

        // Blur background
        'backdrop-blur-md',

        // Additional classes passed through props
        className,
      )}
    >


      {/* ==================================================
          MOBILE MENU BUTTON
          ================================================== */}

      <button
        type="button"

        // Open the sidebar/navigation menu
        onClick={onMenuClick}

        // Accessibility label
        aria-label="Open navigation menu"

        className={cn(
          // Button styling
          'inline-flex items-center justify-center rounded-xl p-2',

          // Text color
          'text-text-muted lg:hidden',

          // Hover effect
          'transition-colors hover:bg-slate-100 hover:text-text',

          // Focus effect
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        )}
      >

        {/* Menu icon */}
        <Menu
          size={20}
          aria-hidden="true"
        />

      </button>


      {/* ==================================================
          PAYLATER LOGO
          ================================================== */}

      <div className="flex items-center gap-2 lg:hidden">

        {/* 
          PayLater logo

          "P" is capital P.
          This is the small PayLater logo shown on mobile.
        */}
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-xs font-bold text-white"
          aria-hidden="true"
        >
          P
        </span>


        {/* 
          PayLater application name

          Displayed next to the P logo.
        */}
        <span className="text-base font-bold text-text">
          PayLater
        </span>

      </div>


      {/* ==================================================
          DESKTOP PAYLATER INFORMATION
          ================================================== */}

      <div className="hidden lg:block">

        {/* Main application name */}
        <p className="text-sm font-medium text-text">
          PayLater Platform
        </p>

        {/* Application description */}
        <p className="text-xs text-text-muted">
          Secure payments and credit management
        </p>

      </div>


      {/* ==================================================
          USER INFORMATION
          ================================================== */}

      <div className="ml-auto flex items-center gap-3">


        {/* ==================================================
            CUSTOMER / USER ROLE
            ================================================== */}

        {userRole ? (

          <span
            className="hidden rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 sm:inline-flex"
          >

            {/*
              Display the user's role.

              Example:

              userRole = "customer"

              roleLabel = "Customer"

              userRole = "admin"

              roleLabel = "Admin"
            */}
            {roleLabel}

          </span>

        ) : null}


        {/* ==================================================
            CUSTOMER PROFILE
            ================================================== */}

        <Link
          to="/settings"

          className={cn(

            // Profile layout
            'inline-flex items-center gap-2 rounded-xl px-2 py-1.5 sm:px-3',

            // Hover effect
            'transition-colors hover:bg-slate-100',

            // Focus effect
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >


          {/* ==================================================
              CUSTOMER INITIAL / PROFILE ICON
              ================================================== */}

          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white"
            aria-hidden="true"
          >

            {/*
              Display first letter of customer name.

              Example:

              userName = "Galinki"

              initials = "G"

              So the screen displays:

              G
            */}

            {initials || (
              <User
                size={16}
              />
            )}

          </span>


          {/* ==================================================
              CUSTOMER INFORMATION
              ================================================== */}

          <span
            className="hidden flex-col items-start sm:flex"
          >

            {/* 
              Customer/User name

              Example:
              Galinki Vamshi
            */}
            <span
              className="max-w-[180px] truncate text-sm font-semibold text-text"
            >
              {userName}
            </span>


            {/* 
              Customer role

              Example:
              Customer
            */}
            {userRole ? (

              <span className="text-xs text-text-muted">
                {roleLabel}
              </span>

            ) : null}

          </span>


          {/* ==================================================
              DROPDOWN ARROW
              ================================================== */}

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