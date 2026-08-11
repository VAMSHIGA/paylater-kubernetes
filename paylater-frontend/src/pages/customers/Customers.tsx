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

interface FormErrors {
  name?: string
  email?: string
  credit_limit?: string
}

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

function validateName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Name is required'
  }

  return undefined
}

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    credit_limit: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setListError(null)

    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      setCustomers([])
      setListError(getCustomerErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  function openCreateModal() {
    setFormData({ name: '', email: '', credit_limit: '' })
    setFieldErrors({})
    setCreateError(null)
    setIsModalOpen(true)
  }

  function closeCreateModal() {
    if (createLoading) {
      return
    }

    setIsModalOpen(false)
    setCreateError(null)
    setFieldErrors({})
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      credit_limit: validateCreditLimit(formData.credit_limit),
    }

    setFieldErrors(nextErrors)
    setCreateError(null)

    if (nextErrors.name || nextErrors.email || nextErrors.credit_limit) {
      return
    }

    setCreateLoading(true)

    try {
      const message = await createCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        credit_limit: formData.credit_limit.trim(),
      })

      setSuccessMessage(message || 'Customer created successfully')
      setIsModalOpen(false)
      setFormData({ name: '', email: '', credit_limit: '' })
      await loadCustomers()
    } catch (error) {
      setCreateError(getCustomerErrorMessage(error))
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

        <Button type="button" onClick={openCreateModal}>
          Create Customer
        </Button>
      </div>

      {successMessage ? (
        <Alert
          variant="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

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

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Customer"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateModal}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-customer-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        }
      >
        <form
          id="create-customer-form"
          className="flex flex-col gap-4"
          onSubmit={handleCreateSubmit}
          noValidate
        >
          {createError ? (
            <Alert
              variant="error"
              title={createError.title}
              message={createError.message}
            />
          ) : null}

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
