import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import * as paybackService from '../../services/paybackService'
import { Paybacks } from './Paybacks'

vi.mock('../../services/paybackService', () => ({
  createPayback: vi.fn(),
  getPaybackErrorMessage: vi.fn(),
}))

const mockedPaybackService = vi.mocked(paybackService)

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
    mockedPaybackService.createPayback.mockResolvedValue(
      'Payback created successfully',
    )
    mockedPaybackService.getPaybackErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Unable to create payback',
    })
  })

  it('renders create payback UI', () => {
    renderPaybacks('customer')

    expect(
      screen.getByRole('heading', { name: 'Payback Management' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Payback' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderPaybacks('admin')

    await user.click(screen.getAllByRole('button', { name: 'Create Payback' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Create Payback' })[1]!)

    expect(await screen.findByText('Customer ID is required')).toBeInTheDocument()
  })

  it('creates a payback successfully', async () => {
    const user = userEvent.setup()
    renderPaybacks('admin')

    await user.click(screen.getAllByRole('button', { name: 'Create Payback' })[0]!)
    await user.type(screen.getByRole('textbox', { name: /^Customer ID/ }), '1')
    await user.type(screen.getByRole('textbox', { name: /^Amount/ }), '50')
    await user.type(screen.getByLabelText(/^Payment Date/), '2026-08-10')
    await user.click(screen.getAllByRole('button', { name: 'Create Payback' })[1]!)

    expect(await screen.findByText('Payback created successfully')).toBeInTheDocument()
  })
})
