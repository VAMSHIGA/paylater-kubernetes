import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { createTestUser, seedAuthStorage } from '../test/auth-helpers'
import { AppRoutes } from './AppRoutes'

vi.mock('../services/customerService', () => ({
  getCustomers: vi.fn().mockResolvedValue([]),
  createCustomer: vi.fn(),
  getCustomerErrorMessage: vi.fn(),
}))

vi.mock('../services/merchantService', () => ({
  createMerchant: vi.fn(),
  updateMerchantCommission: vi.fn(),
  getMerchantErrorMessage: vi.fn(),
}))

vi.mock('../services/transactionService', () => ({
  createTransaction: vi.fn(),
  getTransactionErrorMessage: vi.fn(),
}))

vi.mock('../services/paybackService', () => ({
  createPayback: vi.fn(),
  getPaybackErrorMessage: vi.fn(),
}))

vi.mock('../services/reportService', () => ({
  getMerchantFees: vi.fn().mockResolvedValue([]),
  getCustomerDues: vi.fn().mockResolvedValue([]),
  getCreditLimit: vi.fn().mockResolvedValue([]),
  getTotalDues: vi.fn().mockResolvedValue({ total_dues: '0.00' }),
  getReportErrorMessage: vi.fn(),
}))

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders login for logged-out users', async () => {
    renderApp('/login')

    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  it('renders register for logged-out users', async () => {
    renderApp('/register')

    expect(await screen.findByText('Create Account')).toBeInTheDocument()
  })

  it('redirects logged-out users from protected routes to login', async () => {
    renderApp('/customers')

    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  it('renders admin dashboard for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('renders customer dashboard for customer users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/customer')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('renders merchant dashboard for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/merchant')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('renders customers page for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/customers')

    expect(
      await screen.findByRole('heading', { name: 'Customers' }),
    ).toBeInTheDocument()
  })

  it('denies customers page for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/customers')

    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
  })

  it('renders merchants page for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/merchants')

    expect(
      await screen.findByRole('heading', { name: 'Merchant Management' }),
    ).toBeInTheDocument()
  })

  it('renders transactions page for customer users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/transactions')

    expect(
      await screen.findByRole('heading', { name: 'Transaction Management' }),
    ).toBeInTheDocument()
  })

  it('denies transactions page for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/transactions')

    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
  })

  it('renders reports page for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/reports')

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'Reports' }).length).toBeGreaterThan(0)
    })
  })

  it('renders settings for authenticated users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/settings')

    expect(
      await screen.findByRole('heading', { name: 'Account Settings' }),
    ).toBeInTheDocument()
  })

  it('renders not found page for unknown routes', async () => {
    renderApp('/does-not-exist')

    expect(
      await screen.findByRole('heading', { name: 'Page Not Found' }),
    ).toBeInTheDocument()
  })
})
