// Icons from lucide-react
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

// React Hook and TypeScript type for form events
import { type FormEvent, useState } from 'react'

// React Router:
// Link     → navigate using a link
// useNavigate → navigate using JavaScript
import { Link, useNavigate } from 'react-router-dom'

// Custom authentication Hook
import { useAuth } from '../../hooks/useAuth'

// Functions related to login and post-login navigation
import {
  getLoginErrorMessage,
  getPostLoginPath,
} from '../../services/authService'

// Reusable UI components
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'


// TypeScript interface for form validation errors
// Both email and password errors are optional
interface FormErrors {
  email?: string
  password?: string
}


// Function to validate the email
function validateEmail(email: string): string | undefined {

  // Check if email is empty
  if (!email.trim()) {
    return 'Email is required'
  }

  // Regular expression to check email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Check whether email matches the pattern
  if (!emailPattern.test(email)) {
    return 'Enter a valid email address'
  }

  // No error
  return undefined
}


// Function to validate the password
function validatePassword(password: string): string | undefined {

  // Check if password is empty
  if (!password) {
    return 'Password is required'
  }

  // No error
  return undefined
}


// LoginForm component
export function LoginForm() {

  // useNavigate allows us to navigate to another route
  const navigate = useNavigate()

  // Get the login function from our authentication Hook
  const { login } = useAuth()


  // Store email entered by the user
  const [email, setEmail] = useState('')

  // Store password entered by the user
  const [password, setPassword] = useState('')

  // Store whether password should be visible
  // false → password hidden
  // true  → password visible
  const [showPassword, setShowPassword] = useState(false)


  // Store validation errors for email/password
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})


  // Store API/login error
  // null means there is no API error
  const [apiError, setApiError] = useState<{
    title: string
    message: string
  } | null>(null)


  // Store loading state
  // false → normal
  // true  → login request is running
  const [loading, setLoading] = useState(false)


  // Function executed when the login form is submitted
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    // Prevent the browser from refreshing the page
    event.preventDefault()


    // Validate email and password
    const nextErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }


    // Save validation errors in state
    setFieldErrors(nextErrors)

    // Remove any previous API error
    setApiError(null)


    // If email or password has an error,
    // stop the login process
    if (nextErrors.email || nextErrors.password) {
      return
    }


    // Start loading
    setLoading(true)


    try {

      // Call the login function
      // This communicates with the authentication service/backend
      const user = await login({
        email: email.trim(),
        password,
      })


      // Login was successful.
      // Get the correct page based on the user's role
      // and navigate to that page.
      navigate(
        getPostLoginPath(user.role),
        { replace: true }
      )

    } catch (error) {

      // If login fails,
      // convert the error into a user-friendly message
      setApiError(
        getLoginErrorMessage(error)
      )

    } finally {

      // Stop loading whether login succeeds or fails
      setLoading(false)
    }
  }


  // UI returned by the component
  return (

    // Login form
    <form
      className="flex flex-col gap-5"

      // Run handleSubmit when form is submitted
      onSubmit={handleSubmit}

      // Disable browser's default validation
      noValidate
    >


      {/* Show API error only when apiError exists */}
      {apiError ? (

        <Alert
          variant="error"
          title={apiError.title}
          message={apiError.message}
        />

      ) : null}


      {/* EMAIL INPUT */}
      <div className="relative w-full">

        <Input
          label="Email"
          type="email"
          name="email"

          // Browser autofill
          autoComplete="email"

          placeholder="Enter your email"

          // Value comes from React state
          value={email}

          // Update email state whenever user types
          onChange={(event) =>
            setEmail(event.target.value)
          }

          // Display validation error
          error={fieldErrors.email}

          fullWidth
          required

          // Disable input while login is happening
          disabled={loading}

          className="pl-10 transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />


        {/* Email icon */}
        <Mail
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[2.2rem] text-text-muted"
        />

      </div>


      {/* PASSWORD INPUT */}
      <div className="relative w-full">

        <Input
          label="Password"

          // Change between password and text
          // password → hidden
          // text → visible
          type={showPassword ? 'text' : 'password'}

          name="password"

          autoComplete="current-password"

          placeholder="Enter your password"

          // Password value from state
          value={password}

          // Update password state when user types
          onChange={(event) =>
            setPassword(event.target.value)
          }

          // Display password validation error
          error={fieldErrors.password}

          fullWidth
          required

          // Disable while loading
          disabled={loading}

          className="pl-10 pr-10 transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />


        {/* Lock icon */}
        <Lock
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[2.2rem] text-text-muted"
        />


        {/* Show / Hide password button */}
        <button
          type="button"

          // Toggle password visibility
          onClick={() =>
            setShowPassword(
              (current) => !current
            )
          }

          // Accessibility label
          aria-label={
            showPassword
              ? 'Hide password'
              : 'Show password'
          }

          disabled={loading}

          className="absolute right-3 top-[2.15rem] rounded-md p-1 text-text-muted transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed"
        >

          {/* Show EyeOff when password is visible */}
          {showPassword ? (

            <EyeOff
              size={18}
              aria-hidden="true"
            />

          ) : (

            // Show Eye when password is hidden
            <Eye
              size={18}
              aria-hidden="true"
            />

          )}

        </button>

      </div>


      {/* LOGIN BUTTON */}
      <Button
        type="submit"

        // Button takes full width
        fullWidth

        // Show loading indicator
        loading={loading}

        // Disable button while login is running
        disabled={loading}

        className="mt-1 shadow-md shadow-primary-600/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/25 active:translate-y-0"
      >

        {/* Change button text while loading */}
        {loading
          ? 'Logging in...'
          : 'Login'}

      </Button>


      {/* REGISTER LINK */}
      <p className="text-center text-sm text-text-muted">

        Don't have an account?{' '}

        {/* React Router navigation */}
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
        >
          Create account
        </Link>

      </p>

    </form>
  )
}