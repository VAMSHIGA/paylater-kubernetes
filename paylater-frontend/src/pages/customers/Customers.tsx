import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table, type TableColumn } from '../../components/ui/Table'

import {
  createCustomer,
  getCustomerErrorMessage,
  getCustomers,
} from '../../services/customerService'

import type { CreateCustomerRequest, Customer } from '../../types'


// Form validation errors
interface FormErrors {
  name?: string
  email?: string
  credit_limit?: string
}


// Customer table columns
const columns: TableColumn<Customer>[] = [
  {
    key: 'ID',
    header: 'ID',
  },
  {
    key: 'Name',
    header: 'Name',
  },
  {
    key: 'Email',
    header: 'Email',
  },
  {
    key: 'CreditLimit',
    header: 'Credit Limit',
  },
]


// Name validation
function validateName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Name is required'
  }

  return undefined
}


// Email validation
function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email)) {
    return 'Enter a valid email address'
  }

  return undefined
}


// Credit limit validation
function validateCreditLimit(creditLimit: string): string | undefined {
  if (!creditLimit.trim()) {
    return 'Credit limit is required'
  }

  const value = Number(creditLimit)

  if (Number.isNaN(value) || value <= 0) {
    return 'Enter a valid credit limit'
  }

  return undefined
}


export function Customers() {

  // Customer list
  const [customers, setCustomers] = useState<Customer[]>([])

  // Customer list loading state
  const [loading, setLoading] = useState(true)

  // Customer list API error
  const [listError, setListError] = useState<{
    title: string
    message: string
  } | null>(null)

  // Create customer modal open/close
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Create customer loading state
  const [createLoading, setCreateLoading] = useState(false)

  // Create customer API error
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)

  // Customer creation success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create customer form data
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    credit_limit: '',
  })

  // Form field validation errors
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})


  // Load customers from backend
  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setListError(null)

    try {

      // Get customers from backend
      const data = await getCustomers()

      setCustomers(data)

    } catch (error) {

      // Backend failure while loading customers
      setCustomers([])
      setListError(getCustomerErrorMessage(error))

    } finally {

      setLoading(false)
    }
  }, [])


  // Load customers when page opens
  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])


  // Open Create Customer modal
  function openCreateModal() {
    setFormData({
      name: '',
      email: '',
      credit_limit: '',
    })

    setFieldErrors({})
    setCreateError(null)
    setIsModalOpen(true)
  }


  // Close Create Customer modal
  function closeCreateModal() {
    if (createLoading) {
      return
    }

    setIsModalOpen(false)
    setCreateError(null)
    setFieldErrors({})
  }


  // Create Customer form submit
  async function handleCreateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()


    // Validate Name, Email and Credit Limit
    const nextErrors: FormErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      credit_limit: validateCreditLimit(formData.credit_limit),
    }


    // Store validation errors
    setFieldErrors(nextErrors)

    // Clear previous API error
    setCreateError(null)


    // Stop if validation fails
    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.credit_limit
    ) {
      return
    }


    // Start create loading
    setCreateLoading(true)


    try {

      // Create customer in backend
      const message = await createCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        credit_limit: formData.credit_limit.trim(),
      })


      // Success message
      setSuccessMessage(
        message || 'Customer created successfully',
      )

      // Close modal
      setIsModalOpen(false)

      // Clear form
      setFormData({
        name: '',
        email: '',
        credit_limit: '',
      })

      // Refresh customer list
      await loadCustomers()

    } catch (error) {

      // Backend failure while creating customer
      setCreateError(getCustomerErrorMessage(error))

    } finally {

      // Stop create loading
      setCreateLoading(false)
    }
  }


  return (
    <div className="space-y-6">

      {/* Page header and Create Customer button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <header>

          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Admin
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Customers
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Manage PayLater customer accounts and credit limits.
          </p>

        </header>


        {/* Open Create Customer modal */}
        <Button
          type="button"
          onClick={openCreateModal}
        >
          Create Customer
        </Button>

      </div>


      {/* Success message */}
      {successMessage ? (
        <Alert
          variant="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}


      {/* Customer list or loading error */}
      {listError ? (
        <Alert
          variant="error"
          title={listError.title}
          message={listError.message}
        />
      ) : (
        <Table
          columns={columns}
          data={customers}
          loading={loading}
          emptyMessage="No customers found."
          rowKey="ID"
        />
      )}


      {/* Create Customer modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Customer"
        size="md"
        footer={
          <div className="flex justify-end gap-3">

            {/* Cancel button */}
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateModal}
              disabled={createLoading}
            >
              Cancel
            </Button>


            {/* Create button */}
            <Button
              type="submit"
              form="create-customer-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading
                ? 'Creating...'
                : 'Create Customer'}
            </Button>

          </div>
        }
      >

        {/* Create Customer form */}
        <form
          id="create-customer-form"
          className="flex flex-col gap-4"
          onSubmit={handleCreateSubmit}
          noValidate
        >

          {/* Backend/API error */}
          {createError ? (
            <Alert
              variant="error"
              title={createError.title}
              message={createError.message}
            />
          ) : null}


          {/* Name field */}
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            error={fieldErrors.name}
            fullWidth
            required
            disabled={createLoading}
          />


          {/* Email field */}
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            error={fieldErrors.email}
            fullWidth
            required
            disabled={createLoading}
          />


          {/* Credit Limit field */}
          <Input
            label="Credit Limit"
            name="credit_limit"
            inputMode="decimal"
            value={formData.credit_limit}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                credit_limit: event.target.value,
              }))
            }
            error={fieldErrors.credit_limit}
            fullWidth
            required
            disabled={createLoading}
          />

        </form>

      </Modal>

    </div>
  )
}