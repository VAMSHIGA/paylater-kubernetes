import { Eye, EyeOff, ShoppingBag, Store } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getRegisterErrorMessage,
  register,
} from '../../services/authService'
import type { UserRole } from '../../types'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
}

const roleOptions: Array<{
  value: UserRole
  title: string
  description: string
  icon: typeof ShoppingBag
}> = [
  {
    value: 'customer',
    title: 'Customer',
    description: 'Buy now and pay later',
    icon: ShoppingBag,
  },
  {
    value: 'merchant',
    title: 'Merchant',
    description: 'Grow your business with PayLater',
    icon: Store,
  },
]

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email)) {
    return 'Enter a valid email address'
  }

  return undefined
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required'
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }

  return undefined
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) {
    return 'Confirm password is required'
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.'
  }

  return undefined
}

function validateRole(role: UserRole | ''): string | undefined {
  if (!role) {
    return 'Account type is required'
  }

  return undefined
}

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isComplete = Boolean(successMessage)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isComplete) {
      return
    }

    const nextErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      role: validateRole(role),
    }

    setFieldErrors(nextErrors)
    setApiError(null)

    if (
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword ||
      nextErrors.role
    ) {
      return
    }

    setLoading(true)

    try {
      const message = await register({
        email: email.trim(),
        password,
        role,
      })

      setSuccessMessage(
        message || 'Account created successfully. Please log in.',
      )
    } catch (error) {
      setApiError(getRegisterErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {successMessage ? (
        <Alert
          variant="success"
          title="Success"
          message={successMessage}
        />
      ) : null}

      {apiError ? (
        <Alert
          variant="error"
          title={apiError.title}
          message={apiError.message}
        />
      ) : null}

      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        fullWidth
        required
        disabled={loading || isComplete}
      />

      <div className="relative w-full">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          fullWidth
          required
          disabled={loading || isComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={loading || isComplete}
          className="absolute right-3 top-[2.15rem] rounded-md p-1 text-text-muted transition-colors hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="relative w-full">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Enter your password again"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
          fullWidth
          required
          disabled={loading || isComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((current) => !current)}
          aria-label={
            showConfirmPassword
              ? 'Hide confirm password'
              : 'Show confirm password'
          }
          disabled={loading || isComplete}
          className="absolute right-3 top-[2.15rem] rounded-md p-1 text-text-muted transition-colors hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed"
        >
          {showConfirmPassword ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex w-full flex-col gap-2">
        <span className="text-sm font-medium text-text">Account Type</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {roleOptions.map((option) => {
            const Icon = option.icon
            const isSelected = role === option.value

            return (
              <button
                key={option.value}
                type="button"
                disabled={loading || isComplete}
                onClick={() => setRole(option.value)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500/20'
                    : 'border-slate-200 bg-surface hover:border-primary-300 hover:bg-slate-50',
                  (loading || isComplete) && 'cursor-not-allowed opacity-70',
                )}
              >
                <div
                  className={cn(
                    'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-text-muted',
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-text">{option.title}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
        {fieldErrors.role ? (
          <p role="alert" className="text-sm text-error">
            {fieldErrors.role}
          </p>
        ) : null}
      </div>

      {isComplete ? (
        <Link
          to="/login"
          className={cn(
            'inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white',
            'transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          )}
        >
          Go to Login
        </Link>
      ) : (
        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      )}

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
        >
          Login
        </Link>
      </p>
    </form>
  )
}
