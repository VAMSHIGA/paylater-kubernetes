import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as reportService from '../../services/reportService'
import { Reports } from './Reports'

vi.mock('../../services/reportService', () => ({
  getMerchantFees: vi.fn(),
  getCustomerDues: vi.fn(),
  getCreditLimit: vi.fn(),
  getTotalDues: vi.fn(),
  getReportErrorMessage: vi.fn(),
}))

const mockedReportService = vi.mocked(reportService)

describe('Reports', () => {
  beforeEach(() => {
    mockedReportService.getMerchantFees.mockResolvedValue([
      { MerchantName: 'Shop', Commission: '2.50' },
    ])
    mockedReportService.getCustomerDues.mockResolvedValue([])
    mockedReportService.getCreditLimit.mockResolvedValue([])
    mockedReportService.getTotalDues.mockResolvedValue({ total_dues: '100.00' })
    mockedReportService.getReportErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Failed to load report',
    })
  })

  it('renders loading and success states', async () => {
    render(<Reports />)

    expect(screen.getByText('Loading total dues...')).toBeInTheDocument()

    expect(await screen.findByText('₹100.00')).toBeInTheDocument()
    expect(screen.getByText('Shop')).toBeInTheDocument()
  })

  it('shows empty table message', async () => {
    render(<Reports />)

    expect(
      await screen.findByText('No customer dues data available.'),
    ).toBeInTheDocument()
  })

  it('shows section error independently', async () => {
    mockedReportService.getMerchantFees.mockRejectedValueOnce(new Error('fail'))

    render(<Reports />)

    expect(await screen.findByText('Failed to load report')).toBeInTheDocument()
    expect(await screen.findByText('₹100.00')).toBeInTheDocument()
  })

  it('refreshes all report sections', async () => {
    const user = userEvent.setup()
    render(<Reports />)

    await screen.findByText('₹100.00')

    const initialCalls = mockedReportService.getTotalDues.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Refresh Reports' }))

    await waitFor(() => {
      expect(mockedReportService.getTotalDues.mock.calls.length).toBeGreaterThan(
        initialCalls,
      )
    })
  })
})
