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


  // TEST CASE 1
  // Customer list loads successfully
  //
  // Flow:
  // Customers page opens
  //        ↓
  // getCustomers()
  //        ↓
  // Success
  //        ↓
  // Customer table is displayed
  //
  // User sees:
  // Alice
  // alice@test.example
  //
  // Purpose:
  // Check that customers are loaded and displayed correctly.
  it('renders loading then customer table', async () => {
    render(<Customers />)

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@test.example')).toBeInTheDocument()
  })


  // TEST CASE 2
  // No customers are available
  //
  // Flow:
  // Customers page opens
  //        ↓
  // getCustomers()
  //        ↓
  // Returns []
  //        ↓
  // No customers found
  //
  // User sees:
  // "No customers found."
  //
  // Purpose:
  // Check that the UI handles an empty customer list.
  it('renders empty state', async () => {
    mockedCustomerService.getCustomers.mockResolvedValueOnce([])

    render(<Customers />)

    expect(await screen.findByText('No customers found.')).toBeInTheDocument()
  })


  // TEST CASE 3
  // Loading customers fails
  //
  // Flow:
  // Customers page opens
  //        ↓
  // getCustomers()
  //        ↓
  // API request fails
  //        ↓
  // Show error message
  //
  // User sees:
  // "Unable to load customers"
  //
  // Purpose:
  // Check that the application handles
  // a failed customer loading request.
  //
  // Example UI:
  // "Unable to load customers"
  // "Please try again"
  //
  // Note:
  // This test currently checks only
  // "Unable to load customers".
  it('renders list error', async () => {
    mockedCustomerService.getCustomers.mockRejectedValueOnce(new Error('fail'))
    mockedCustomerService.getCustomerErrorMessage.mockReturnValueOnce({
      title: 'Request failed',
      message: 'Unable to load customers',
    })

    render(<Customers />)

    expect(await screen.findByText('Unable to load customers')).toBeInTheDocument()
  })


  // TEST CASE 4
  // Create Customer form validation
  //
  // Flow:
  // Open Create Customer
  //        ↓
  // Leave fields empty
  //        ↓
  // Click Create
  //        ↓
  // Validation runs
  //
  // User sees:
  // "Name is required"
  // "Email is required"
  // "Credit limit is required"
  //
  // Purpose:
  // Check that required fields are validated
  // before creating a customer.
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


  // TEST CASE 5
  // Customer is created successfully
  //
  // Flow:
  // Open Create Customer
  //        ↓
  // Enter customer details
  //        ↓
  // Click Create
  //        ↓
  // createCustomer()
  //        ↓
  // Success
  //        ↓
  // Show success message
  //        ↓
  // Refresh customer list
  //        ↓
  // Bob appears
  //
  // User sees:
  // "Customer created successfully"
  //
  // Purpose:
  // Check the complete customer creation flow
  // and verify that the list is refreshed.
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


  // TEST CASE 6
  // Customer creation fails
  //
  // Flow:
  // Open Create Customer
  //        ↓
  // Enter customer details
  //        ↓
  // Click Create
  //        ↓
  // createCustomer()
  //        ↓
  // API request fails
  //        ↓
  // Show error message
  //
  // User sees:
  // "Unable to create customer"
  //
  // Example UI:
  // "Unable to create customer"
  // "Please try again"
  //
  // Purpose:
  // Check that the application handles
  // an error while creating a customer.
  //
  // Note:
  // This test currently checks only
  // "Unable to create customer".
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