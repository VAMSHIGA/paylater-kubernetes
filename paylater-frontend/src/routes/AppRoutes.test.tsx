import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { createTestUser, seedAuthStorage } from '../test/auth-helpers'
import { AppRoutes } from './AppRoutes'

vi.mock('../services/customerService', () => ({
  getCustomers: vi.fn().mockResolvedValue([]),
  getMyCustomer: vi.fn().mockResolvedValue({
    ID: 8,
    Name: 'Test Customer',
    Email: 'customer@test.example',
    CreditLimit: '10000.00',
    OutstandingDue: '0.00',
    AvailableCredit: '10000.00',
  }),
  createCustomer: vi.fn(),
  getCustomerErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
}))

vi.mock('../services/merchantService', () => ({
  createMerchant: vi.fn(),
  updateMerchantCommission: vi.fn(),
  getMyMerchant: vi.fn().mockResolvedValue({
    ID: 1,
    MerchantName: 'Test Merchant',
    PhoneNumber: '1234567890',
    Onboarding: '2026-08-10',
    Commission: '5.00',
  }),
  getMerchantDashboard: vi.fn().mockResolvedValue({
    ID: 1,
    MerchantName: 'Test Merchant',
    CommissionPercent: '5.00',
    TotalTransactions: 0,
    TotalSales: '0.00',
    TotalCommission: '0.00',
    MerchantEarnings: '0.00',
    PayLaterCommission: '0.00',
    RecentTransactions: [],
  }),
  getMerchantErrorMessage: vi.fn(),
}))

vi.mock('../services/transactionService', () => ({
  createTransaction: vi.fn(),
  getTransactionErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
  listTransactions: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/paybackService', () => ({
  createPayback: vi.fn(),
  getPaybackErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
  listPaybacks: vi.fn().mockResolvedValue([]),
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

    expect(await screen.findByText('Welcome back 👋')).toBeInTheDocument()
  })

  it('renders register for logged-out users', async () => {
    renderApp('/register')

    expect(await screen.findByText('Create Account')).toBeInTheDocument()
  })

  it('redirects logged-out users from protected routes to login', async () => {
    renderApp('/customers')

    expect(await screen.findByText('Welcome back 👋')).toBeInTheDocument()
  })

  it('renders admin dashboard for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/admin')

    expect(
      await screen.findByText("Here's your PayLater platform overview."),
    ).toBeInTheDocument()
  })

  it('renders customer dashboard for customer users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/customer')

    expect(
      await screen.findByText("Here's your PayLater overview."),
    ).toBeInTheDocument()
  })

  it('renders merchant dashboard for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/merchant')

    expect(
      await screen.findByText("Here's how your business is performing."),
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
      await screen.findByRole('heading', { name: 'Merchant Profile' }),
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
