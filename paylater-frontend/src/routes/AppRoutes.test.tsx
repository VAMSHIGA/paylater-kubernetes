import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { createTestUser, seedAuthStorage } from '../test/auth-helpers'
import { AppRoutes } from './AppRoutes'

// Mock customer backend services  AppRoutes.test.tsx tests whether your application's URLs and user permissions are working correctly.
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

// Mock merchant backend services
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

// Mock transaction backend services
vi.mock('../services/transactionService', () => ({
  createTransaction: vi.fn(),
  getTransactionErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
  listTransactions: vi.fn().mockResolvedValue([]),
}))

// Mock payback backend services
vi.mock('../services/paybackService', () => ({
  createPayback: vi.fn(),
  getPaybackErrorMessage: vi.fn().mockReturnValue({
    title: 'Request failed',
    message: 'Something went wrong. Please try again.',
  }),
  listPaybacks: vi.fn().mockResolvedValue([]),
}))

// Mock report backend services
vi.mock('../services/reportService', () => ({
  getMerchantFees: vi.fn().mockResolvedValue([]),
  getCustomerDues: vi.fn().mockResolvedValue([]),
  getCreditLimit: vi.fn().mockResolvedValue([]),
  getTotalDues: vi.fn().mockResolvedValue({
    total_dues: '0.00',
  }),
  getReportErrorMessage: vi.fn(),
}))

// Helper function to open the application at a specific URL
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
  // Clear saved login information before every test
  beforeEach(() => {
    localStorage.clear()
  })

  // Test 1: Logged-out user can open the Login page
  // Example: User opens /login → Login page appears
  it('renders login for logged-out users', async () => {
    renderApp('/login')

    expect(
      await screen.findByText('Welcome back 👋'),
    ).toBeInTheDocument()
  })

  // Test 2: Logged-out user can open the Register page
  // Example: User opens /register → Register page appears
  it('renders register for logged-out users', async () => {
    renderApp('/register')

    expect(
      await screen.findByText('Create Account'),
    ).toBeInTheDocument()
  })

  // Test 3: Logged-out user cannot access protected pages
  // Example: User opens /customers → Redirected to Login
  it('redirects logged-out users from protected routes to login', async () => {
    renderApp('/customers')

    expect(
      await screen.findByText('Welcome back 👋'),
    ).toBeInTheDocument()
  })

  // Test 4: Admin user can access the Admin Dashboard
  // Example: Admin → /admin → Admin Dashboard
  it('renders admin dashboard for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/admin')

    expect(
      await screen.findByText(
        "Here's your PayLater platform overview.",
      ),
    ).toBeInTheDocument()
  })

  // Test 5: Customer user can access the Customer Dashboard
  // Example: Customer → /customer → Customer Dashboard
  it('renders customer dashboard for customer users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/customer')

    expect(
      await screen.findByText(
        "Here's your PayLater overview.",
      ),
    ).toBeInTheDocument()
  })

  // Test 6: Merchant user can access the Merchant Dashboard
  // Example: Merchant → /merchant → Merchant Dashboard
  it('renders merchant dashboard for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/merchant')

    expect(
      await screen.findByText(
        "Here's how your business is performing.",
      ),
    ).toBeInTheDocument()
  })

  // Test 7: Admin can access the Customers page
  // Example: Admin → /customers → Customers page
  it('renders customers page for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/customers')

    expect(
      await screen.findByRole('heading', {
        name: 'Customers',
      }),
    ).toBeInTheDocument()
  })

  // Test 8: Merchant is redirected away from the Customers page
  it('redirects merchant users away from customers page', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/customers')

    expect(
      await screen.findByText(/Here's how your business is performing/i),
    ).toBeInTheDocument()
  })

  // Test 9: Merchant can access the Merchants page
  // Example: Merchant → /merchants → Merchant Profile
  it('renders merchants page for merchant users', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/merchants')

    expect(
      await screen.findByRole('heading', {
        name: 'Merchant Profile',
      }),
    ).toBeInTheDocument()
  })

  // Test 10: Customer can access the Transactions page
  // Example: Customer → /transactions → Transaction Management
  it('renders transactions page for customer users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/transactions')

    expect(
      await screen.findByRole('heading', {
        name: 'Transaction Management',
      }),
    ).toBeInTheDocument()
  })

  // Test 11: Merchant is redirected away from the Transactions page
  it('redirects merchant users away from transactions page', async () => {
    seedAuthStorage(createTestUser('merchant'))
    renderApp('/transactions')

    expect(
      await screen.findByText(/Here's how your business is performing/i),
    ).toBeInTheDocument()
  })

  // Test 12: Admin can access the Reports page
  // Example: Admin → /reports → Reports page
  it('renders reports page for admin users', async () => {
    seedAuthStorage(createTestUser('admin'))
    renderApp('/reports')

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', {
          name: 'Reports',
        }).length,
      ).toBeGreaterThan(0)
    })
  })

  // Test 13: Authenticated user can access Settings
  // Example: Logged-in Customer → /settings → Account Settings
  it('renders settings for authenticated users', async () => {
    seedAuthStorage(createTestUser('customer'))
    renderApp('/settings')

    expect(
      await screen.findByRole('heading', {
        name: 'Account Settings',
      }),
    ).toBeInTheDocument()
  })

  // Test 14: Unknown URL displays the 404 page
  // Example: User opens /does-not-exist → Page Not Found
  it('renders not found page for unknown routes', async () => {
    renderApp('/does-not-exist')

    expect(
      await screen.findByRole('heading', {
        name: 'Page Not Found',
      }),
    ).toBeInTheDocument()
  })
})