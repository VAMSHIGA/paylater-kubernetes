// ======================================================
// 1. IMPORT ICONS
// ======================================================

import {
  CheckCircle2,   // Success icon
  CircleX,        // Error icon
  Info,           // Info icon
  TriangleAlert,  // Warning icon
  X,              // Close/Dismiss icon
} from 'lucide-react'

// ReactNode is used for storing React elements like icons
import { type ReactNode } from 'react'


// ======================================================
// 2. ALERT TYPES
// ======================================================

// Alert can have 4 types:
// success, error, warning, info

export type AlertVariant =
  'success'
  | 'error'
  | 'warning'
  | 'info'


// ======================================================
// 3. ALERT PROPS
// ======================================================

// These are the values that can be passed to <Alert />

export interface AlertProps {

  // Which type of alert?
  // Example: "success"
  variant: AlertVariant

  // Main message to display
  message: string

  // Optional title
  title?: string

  // Should the alert have an X/close button?
  dismissible?: boolean

  // Function that runs when X is clicked
  onDismiss?: () => void

  // Optional CSS class
  className?: string
}


// ======================================================
// 4. cn() FUNCTION
// ======================================================

// Combines CSS class names together.
// It also removes false or undefined values.

function cn(
  ...parts: Array<string | false | undefined>
): string {
  return parts.filter(Boolean).join(' ')
}


// ======================================================
// 5. ALERT CONFIGURATION
// ======================================================

// This object contains the design for each alert type.
//
// success → green
// error   → red
// warning → yellow
// info    → blue

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


  // ====================================================
  // SUCCESS ALERT
  // ====================================================

  success: {

    // Success icon
    icon: (
      <CheckCircle2
        size={20}
        aria-hidden="true"
      />
    ),

    // Alert background and border
    container: 'border-green-200 bg-green-50',

    // Icon color
    iconClassName: 'text-success',

    // Title color
    titleClassName: 'text-success',

    // Message color
    messageClassName: 'text-green-800',

    // Screen reader announcement
    live: 'polite',
  },


  // ====================================================
  // ERROR ALERT
  // ====================================================

  error: {

    // Error icon
    icon: (
      <CircleX
        size={20}
        aria-hidden="true"
      />
    ),

    // Red background and border
    container: 'border-red-200 bg-red-50',

    // Icon color
    iconClassName: 'text-error',

    // Title color
    titleClassName: 'text-error',

    // Message color
    messageClassName: 'text-red-800',

    // Error should be announced immediately
    live: 'assertive',
  },


  // ====================================================
  // WARNING ALERT
  // ====================================================

  warning: {

    // Warning icon
    icon: (
      <TriangleAlert
        size={20}
        aria-hidden="true"
      />
    ),

    // Yellow/amber background
    container: 'border-amber-200 bg-amber-50',

    // Icon color
    iconClassName: 'text-warning',

    // Title color
    titleClassName: 'text-warning',

    // Message color
    messageClassName: 'text-amber-900',

    // Screen reader announcement
    live: 'polite',
  },


  // ====================================================
  // INFO ALERT
  // ====================================================

  info: {

    // Information icon
    icon: (
      <Info
        size={20}
        aria-hidden="true"
      />
    ),

    // Blue background
    container: 'border-primary-100 bg-primary-50',

    // Icon color
    iconClassName: 'text-primary-600',

    // Title color
    titleClassName: 'text-primary-700',

    // Message color
    messageClassName: 'text-primary-800',

    // Screen reader announcement
    live: 'polite',
  },
}


// ======================================================
// 6. ALERT COMPONENT
// ======================================================

export function Alert({

  // Alert type
  variant,

  // Alert message
  message,

  // Optional title
  title,

  // Default is false
  dismissible = false,

  // Function for closing the alert
  onDismiss,

  // Optional CSS class
  className,

}: AlertProps) {


  // ====================================================
  // 7. GET THE CONFIGURATION
  // ====================================================

  // Example:
  //
  // variant = "success"
  //
  // config becomes:
  // success configuration
  //
  // Example:
  // icon = CheckCircle2
  // background = green
  // text = green

  const config = variantConfig[variant]


  // ====================================================
  // 8. RETURN ALERT UI
  // ====================================================

  return (

    <div

      // Tells accessibility tools this is an alert
      role="alert"

      // Determines how screen readers announce it
      aria-live={config.live}

      // Alert styling
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 shadow-sm',

        // Apply the selected variant's background
        // and border
        config.container,

        // Any additional CSS from props
        className,
      )}
    >


      {/* ==================================================
          9. ALERT ICON
          ================================================== */}

      <span
        className={cn(
          'mt-0.5 shrink-0',

          // Apply icon color based on variant
          config.iconClassName,
        )}
      >

        {/* Display the selected icon */}
        {config.icon}

      </span>


      {/* ==================================================
          10. TITLE + MESSAGE
          ================================================== */}

      <div className="min-w-0 flex-1">


        {/* ================================================
            Show title only if title is provided
            ================================================ */}

        {title ? (

          <p
            className={cn(
              'text-sm font-semibold',

              // Apply title color based on variant
              config.titleClassName,
            )}
          >
            {title}
          </p>

        ) : null}


        {/* ================================================
            ALERT MESSAGE
            ================================================ */}

        <p
          className={cn(

            // Message font size
            'text-sm',

            // If title exists, add some space
            title ? 'mt-1' : undefined,

            // Apply message color based on variant
            config.messageClassName,
          )}
        >

          {/* Display the message */}
          {message}

        </p>

      </div>


      {/* ==================================================
          11. DISMISS / CLOSE BUTTON
          ================================================== */}

      {dismissible ? (

        <button
          type="button"

          // When X is clicked,
          // call onDismiss()
          onClick={onDismiss}

          // Accessibility label
          aria-label="Dismiss alert"

          // Button styling
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-text-muted',

            // Hover styling
            'transition-colors hover:bg-white/60 hover:text-text',

            // Focus styling
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >

          {/* X / close icon */}
          <X
            size={16}
            aria-hidden="true"
          />

        </button>

      ) : null}

    </div>
  )
}