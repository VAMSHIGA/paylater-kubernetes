import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as customerService from '../../services/customerService'
import { Customers } from './Customers'

vi.mock('../../services/customerService', () => ({
  getCustomers: vi.fn(),
  createCustomer: vi.fn(),
  getCustomerErrorMessage: vi.fn(),
}))

const mockedCustomerService = vi.mocked(customerService)

describe('Customers', () => {
  beforeEach(() => {
    mockedCustomerService.getCustomers.mockResolvedValue([
      {
        ID: 1,
        Name: 'Alice',
        Email: 'alice@test.example',
        CreditLimit: '1000.00',
      },
    ])
    mockedCustomerService.createCustomer.mockResolvedValue(
      'Customer created successfully',
    )
    mockedCustomerService.getCustomerErrorMessage.mockReturnValue({
      title: 'Request failed',
      message: 'Unable to create customer',
    })
  })

  it('renders loading then customer table', async () => {
    render(<Customers />)

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@test.example')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    mockedCustomerService.getCustomers.mockResolvedValueOnce([])

    render(<Customers />)

    expect(await screen.findByText('No customers found.')).toBeInTheDocument()
  })

  it('renders list error', async () => {
    mockedCustomerService.getCustomers.mockRejectedValueOnce(new Error('fail'))
    mockedCustomerService.getCustomerErrorMessage.mockReturnValueOnce({
      title: 'Request failed',
      message: 'Unable to load customers',
    })

    render(<Customers />)

    expect(await screen.findByText('Unable to load customers')).toBeInTheDocument()
  })

  it('validates create customer form', async () => {
    const user = userEvent.setup()
    render(<Customers />)

    await screen.findByText('Alice')
    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[1]!)

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Credit limit is required')).toBeInTheDocument()
  })

  it('creates a customer and refreshes the list', async () => {
    const user = userEvent.setup()

    mockedCustomerService.getCustomers
      .mockResolvedValueOnce([
        {
          ID: 1,
          Name: 'Alice',
          Email: 'alice@test.example',
          CreditLimit: '1000.00',
        },
      ])
      .mockResolvedValueOnce([
        {
          ID: 1,
          Name: 'Alice',
          Email: 'alice@test.example',
          CreditLimit: '1000.00',
        },
        {
          ID: 2,
          Name: 'Bob',
          Email: 'bob@test.example',
          CreditLimit: '2000.00',
        },
      ])

    render(<Customers />)
    await screen.findByText('Alice')

    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[0]!)
    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Bob')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'bob@test.example')
    await user.type(screen.getByRole('textbox', { name: /^Credit Limit/ }), '2000')
    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[1]!)

    expect(await screen.findByText('Customer created successfully')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedCustomerService.createCustomer).toHaveBeenCalledWith({
        name: 'Bob',
        email: 'bob@test.example',
        credit_limit: '2000',
      })
    })
    expect(await screen.findByText('Bob')).toBeInTheDocument()
  })

  it('shows API error on create failure', async () => {
    const user = userEvent.setup()
    mockedCustomerService.createCustomer.mockRejectedValueOnce(new Error('fail'))

    render(<Customers />)
    await screen.findByText('Alice')

    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[0]!)
    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Bob')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'bob@test.example')
    await user.type(screen.getByRole('textbox', { name: /^Credit Limit/ }), '2000')
    await user.click(screen.getAllByRole('button', { name: 'Create Customer' })[1]!)

    expect(await screen.findByText('Unable to create customer')).toBeInTheDocument()
  })
})
