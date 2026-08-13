import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import * as transactionService from '../../services/transactionService'
import * as useCustomerProfileModule from '../../hooks/useCustomerProfile'
import { Transactions } from './Transactions'

vi.mock('../../services/transactionService', () => ({
  createTransaction: vi.fn(),
  getTransactionErrorMessage: vi.fn(),
  listTransactions: vi.fn(),
}))

vi.mock('../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: vi.fn(),
}))

const mockedTransactionService = vi.mocked(transactionService)
const mockedUseCustomerProfile = vi.mocked(
  useCustomerProfileModule.useCustomerProfile,
)

function renderTransactions(role: 'admin' | 'customer' | 'merchant') {
  return renderWithAuthContext(
    <Transactions />,
    createMockAuthValue({
      isAuthenticated: true,
      user: { userId: 1, email: `${role}@test.example`, role },
      token: 'token',
    }),
  )
}

describe('Transactions page', () => {
  beforeEach(() => {
    mockedUseCustomerProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    mockedTransactionService.listTransactions.mockResolvedValue([])
    mockedTransactionService.createTransaction.mockResolvedValue(
      'Transaction created successfully',
    )
    mockedTransactionService.getTransactionErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Unable to create transaction',
    })
  })

  it('renders create transaction UI for admin', () => {
    renderTransactions('admin')

    expect(
      screen.getByRole('heading', { name: 'Transaction Management' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Transaction' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Transaction History' })).toBeInTheDocument()
  })

  it('renders create transaction UI for customer', () => {
    mockedUseCustomerProfile.mockReturnValue({
      profile: {
        ID: 8,
        Name: 'Customer',
        Email: 'customer@test.example',
        CreditLimit: '1000.00',
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    renderTransactions('customer')

    expect(screen.getByRole('button', { name: 'Create Transaction' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderTransactions('admin')

    await user.click(screen.getAllByRole('button', { name: 'Create Transaction' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Create Transaction' })[1]!)

    expect(await screen.findByText('Customer ID is required')).toBeInTheDocument()
  })

  it('creates a transaction successfully', async () => {
    const user = userEvent.setup()
    renderTransactions('admin')

    await user.click(screen.getAllByRole('button', { name: 'Create Transaction' })[0]!)
    await user.type(screen.getByRole('textbox', { name: /^Customer ID/ }), '1')
    await user.type(screen.getByRole('textbox', { name: /^Merchant ID/ }), '2')
    await user.type(screen.getByRole('textbox', { name: /^Amount/ }), '100')
    await user.type(screen.getByRole('textbox', { name: /^Commission/ }), '2.5')
    await user.type(screen.getByLabelText(/^Transaction Date/), '2026-08-10')
    await user.click(screen.getAllByRole('button', { name: 'Create Transaction' })[1]!)

    expect(await screen.findByText('Transaction created successfully')).toBeInTheDocument()
  })
})
