import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import * as transactionService from '../../services/transactionService'
import { Transactions } from './Transactions'

vi.mock('../../services/transactionService', () => ({
  createTransaction: vi.fn(),
  getTransactionErrorMessage: vi.fn(),
}))

const mockedTransactionService = vi.mocked(transactionService)

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
  })

  it('renders create transaction UI for customer', () => {
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
