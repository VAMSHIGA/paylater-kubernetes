import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import * as paybackService from '../../services/paybackService'
import * as useCustomerProfileModule from '../../hooks/useCustomerProfile'
import { Paybacks } from './Paybacks'

vi.mock('../../services/paybackService', () => ({
  createPayback: vi.fn(),
  getPaybackErrorMessage: vi.fn(),
  listPaybacks: vi.fn(),
}))

vi.mock('../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: vi.fn(),
}))

const mockedPaybackService = vi.mocked(paybackService)
const mockedUseCustomerProfile = vi.mocked(
  useCustomerProfileModule.useCustomerProfile,
)

function renderPaybacks(role: 'admin' | 'customer') {
  return renderWithAuthContext(
    <Paybacks />,
    createMockAuthValue({
      isAuthenticated: true,
      user: { userId: 1, email: `${role}@test.example`, role },
      token: 'token',
    }),
  )
}

describe('Paybacks page', () => {
  beforeEach(() => {
    mockedUseCustomerProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    mockedPaybackService.listPaybacks.mockResolvedValue([])
    mockedPaybackService.createPayback.mockResolvedValue(
      'Payback created successfully',
    )
    mockedPaybackService.getPaybackErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Unable to create payback',
    })
  })

  // Test Case 1: Display Payback UI for customer
  it('renders create payback UI', () => {
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

    renderPaybacks('customer')

    expect(
      screen.getByRole('heading', { name: 'Payback Management' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Create Payback' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Payback History' }),
    ).toBeInTheDocument()
  })

  // Test Case 2: Validate required fields  "Customer ID is required" ❌
  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderPaybacks('admin')

    await user.click(
      screen.getAllByRole('button', { name: 'Create Payback' })[0]!,
    )

    await user.click(
      screen.getAllByRole('button', { name: 'Create Payback' })[1]!,
    )

    expect(
      await screen.findByText('Customer ID is required'),
    ).toBeInTheDocument()
  })

  // Test Case 3: Create payback successfully
  it('creates a payback successfully', async () => {
    const user = userEvent.setup()
    renderPaybacks('admin')

    await user.click(
      screen.getAllByRole('button', { name: 'Create Payback' })[0]!,
    )

    await user.type(
      screen.getByRole('textbox', { name: /^Customer ID/ }),
      '1',
    )

    await user.type(
      screen.getByRole('textbox', { name: /^Amount/ }),
      '50',
    )

    await user.type(
      screen.getByLabelText(/^Payment Date/),
      '2026-08-10',
    )

    await user.click(
      screen.getAllByRole('button', { name: 'Create Payback' })[1]!,
    )

    expect(
      await screen.findByText('Payback created successfully'),
    ).toBeInTheDocument()
  })
})