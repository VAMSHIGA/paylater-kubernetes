// ======================================================
// 1. IMPORTS
// ======================================================

// Loader2 = loading/spinner icon
import { Loader2 } from 'lucide-react'

// ButtonHTMLAttributes = gives us normal HTML button properties
// like onClick, id, name, value, etc.
import { type ButtonHTMLAttributes } from 'react'


// ======================================================
// 2. BUTTON VARIANTS
// ======================================================

// Defines the types/styles of buttons available
//
// primary   → main button
// secondary → secondary button
// outline   → button with border
// ghost     → simple/text button

export type ButtonVariant =
  'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'


// ======================================================
// 3. BUTTON PROPS
// ======================================================

// Defines what properties our Button component accepts.
//
// Omit removes the normal "className" property because
// we define our own className below.

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className'
  > {

  // Which button style should be used?
  variant?: ButtonVariant

  // Is the button currently loading?
  loading?: boolean

  // Should the button take the full available width?
  fullWidth?: boolean

  // Additional CSS classes
  className?: string
}


// ======================================================
// 4. cn() FUNCTION
// ======================================================

// Combines CSS classes.
//
// Example:
// cn('button', true && 'active')
// → "button active"
//
// It removes false/undefined values.

function cn(
  ...parts: Array<string | false | undefined>
): string {
  return parts.filter(Boolean).join(' ')
}


// ======================================================
// 5. BUTTON VARIANT STYLES
// ======================================================

// Each button type has its own CSS classes.

const variantClasses: Record<ButtonVariant, string> = {

  // Primary button
  // Example: Login, Submit, Pay Now
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-primary-500/20 disabled:bg-primary-600/60',

  // Secondary button
  secondary:
    'bg-slate-100 text-text hover:bg-slate-200 focus:ring-primary-500/20 disabled:bg-slate-100/60',

  // Outline button
  // Has a border around it
  outline:
    'border border-slate-300 bg-surface text-text hover:bg-slate-50 focus:ring-primary-500/20',

  // Ghost button
  // Mostly text with no strong background
  ghost:
    'text-text-muted hover:bg-slate-100 hover:text-text focus:ring-primary-500/20',
}


// ======================================================
// 6. BUTTON COMPONENT
// ======================================================

export function Button({

  // Default button style is primary
  variant = 'primary',

  // Default loading state is false
  loading = false,

  // Default fullWidth is false
  fullWidth = false,

  // Normal HTML disabled property
  disabled,

  // Custom CSS class
  className,

  // Text/content inside the button
  children,

  // Default HTML button type
  type = 'button',

  // Any other normal button properties
  ...rest

}: ButtonProps) {


  // ====================================================
  // 7. DISABLED CONDITION
  // ====================================================

  // Button becomes disabled if:
  //
  // disabled = true
  // OR
  // loading = true

  const isDisabled = disabled || loading


  // ====================================================
  // 8. RETURN BUTTON UI
  // ====================================================

  return (
    <button

      // Button type
      type={type}

      // Disable button when loading or disabled
      disabled={isDisabled}

      // Tells accessibility tools that button is loading
      aria-busy={loading || undefined}


      // ==================================================
      // BUTTON CSS
      // ==================================================

      className={cn(

        // Basic button design
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',

        // Focus design
        'focus:outline-none focus:ring-2 focus:ring-offset-0',

        // Disabled design
        'disabled:cursor-not-allowed disabled:opacity-70',

        // Apply selected variant
        //
        // Example:
        // variant="primary"
        // ↓
        // variantClasses.primary
        variantClasses[variant],

        // If fullWidth = true
        // button becomes 100% width
        fullWidth && 'w-full',

        // Any additional CSS provided by user
        className,
      )}


      // Pass remaining button properties
      // Example: onClick, id, name, value
      {...rest}
    >


      {/* ================================================
          9. LOADING SPINNER
          ================================================ */}

      {loading ? (

        // Show spinner when loading = true
        <Loader2
          size={18}
          className="animate-spin"
          aria-hidden="true"
        />

      ) : null}


      {/* ================================================
          10. BUTTON CONTENT
          ================================================ */}

      {children}

    </button>
  )
}