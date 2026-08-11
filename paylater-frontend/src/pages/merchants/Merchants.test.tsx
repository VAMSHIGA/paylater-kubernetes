import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as merchantService from '../../services/merchantService'
import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import { Merchants } from './Merchants'

vi.mock('../../services/merchantService', () => ({
  createMerchant: vi.fn(),
  updateMerchantCommission: vi.fn(),
  getMerchantErrorMessage: vi.fn(),
}))

const mockedMerchantService = vi.mocked(merchantService)

function renderMerchants(role: 'admin' | 'merchant') {
  return renderWithAuthContext(
    <Merchants />,
    createMockAuthValue({
      isAuthenticated: true,
      user: { userId: 1, email: `${role}@test.example`, role },
      token: 'token',
    }),
  )
}

describe('Merchants', () => {
  beforeEach(() => {
    mockedMerchantService.createMerchant.mockResolvedValue(
      'Merchant created successfully',
    )
    mockedMerchantService.updateMerchantCommission.mockResolvedValue(
      'Merchant commission updated successfully',
    )
    mockedMerchantService.getMerchantErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Unable to save merchant',
    })
  })

  it('shows update commission form for admin', () => {
    renderMerchants('admin')

    expect(screen.getByText('Update Merchant Commission')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Merchant ID/ })).toBeInTheDocument()
  })

  it('hides update commission form for merchant', () => {
    renderMerchants('merchant')

    expect(
      screen.queryByText('Update Merchant Commission'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Merchant' })).toBeInTheDocument()
  })

  it('creates a merchant successfully', async () => {
    const user = userEvent.setup()
    renderMerchants('admin')

    await user.click(screen.getAllByRole('button', { name: 'Create Merchant' })[0]!)
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: /^Merchant Name/ }), 'Shop')
    await user.type(within(dialog).getByRole('textbox', { name: /^Phone Number/ }), '1234567890')
    await user.type(within(dialog).getByLabelText(/^Onboarding Date/), '2026-08-10')
    await user.type(within(dialog).getByRole('textbox', { name: /^Commission/ }), '2.5')
    await user.click(within(dialog).getByRole('button', { name: 'Create Merchant' }))

    expect(await screen.findByText('Merchant created successfully')).toBeInTheDocument()
  })

  it('updates merchant commission for admin', async () => {
    const user = userEvent.setup()
    renderMerchants('admin')

    await user.type(screen.getByRole('textbox', { name: /^Merchant ID/ }), '1')
    await user.type(screen.getByRole('textbox', { name: /^Commission/ }), '3.0')
    await user.click(screen.getByRole('button', { name: 'Update Commission' }))

    expect(
      await screen.findByText('Merchant commission updated successfully'),
    ).toBeInTheDocument()
  })
})
