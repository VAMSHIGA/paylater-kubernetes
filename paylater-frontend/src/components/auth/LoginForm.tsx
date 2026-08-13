import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { getLoginErrorMessage, getPostLoginPath } from '../../services/authService'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface FormErrors {
  email?: string
  password?: string
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

  return undefined
}

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }

    setFieldErrors(nextErrors)
    setApiError(null)

    if (nextErrors.email || nextErrors.password) {
      return
    }

    setLoading(true)

    try {
      const user = await login({ email: email.trim(), password })
      navigate(getPostLoginPath(user.role), { replace: true })
    } catch (error) {
      setApiError(getLoginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {apiError ? (
        <Alert
          variant="error"
          title={apiError.title}
          message={apiError.message}
        />
      ) : null}

      <div className="relative w-full">
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
          disabled={loading}
          className="pl-10 transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />
        <Mail
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[2.2rem] text-text-muted"
        />
      </div>

      <div className="relative w-full">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          fullWidth
          required
          disabled={loading}
          className="pl-10 pr-10 transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />
        <Lock
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[2.2rem] text-text-muted"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={loading}
          className="absolute right-3 top-[2.15rem] rounded-md p-1 text-text-muted transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <Button
        type="submit"
        fullWidth
        loading={loading}
        disabled={loading}
        className="mt-1 shadow-md shadow-primary-600/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/25 active:translate-y-0"
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
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
