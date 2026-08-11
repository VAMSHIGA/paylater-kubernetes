import { type FormEvent, useState } from 'react'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import {
  createPayback,
  getPaybackErrorMessage,
} from '../../services/paybackService'

interface FormState {
  customer_id: string
  amount: string
  payment_date: string
}

interface FormErrors {
  customer_id?: string
  amount?: string
  payment_date?: string
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const initialFormData: FormState = {
  customer_id: '',
  amount: '',
  payment_date: '',
}

function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) {
    return `${label} is required`
  }

  return undefined
}

function validatePositiveInteger(
  value: string,
  label: string,
): string | undefined {
  const required = validateRequired(value, label)

  if (required) {
    return required
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return `Enter a valid ${label.toLowerCase()}`
  }

  return undefined
}

function validateAmount(amount: string): string | undefined {
  const required = validateRequired(amount, 'Amount')

  if (required) {
    return required
  }

  const value = Number(amount)

  if (Number.isNaN(value) || value <= 0) {
    return 'Enter a valid amount'
  }

  return undefined
}

function validatePaymentDate(paymentDate: string): string | undefined {
  const required = validateRequired(paymentDate, 'Payment date')

  if (required) {
    return required
  }

  if (!datePattern.test(paymentDate)) {
    return 'Payment date must be in YYYY-MM-DD format'
  }

  return undefined
}

export function Paybacks() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  function openCreateModal() {
    setFormData(initialFormData)
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
      customer_id: validatePositiveInteger(formData.customer_id, 'Customer ID'),
      amount: validateAmount(formData.amount),
      payment_date: validatePaymentDate(formData.payment_date),
    }

    setFieldErrors(nextErrors)
    setCreateError(null)

    if (nextErrors.customer_id || nextErrors.amount || nextErrors.payment_date) {
      return
    }

    setCreateLoading(true)

    try {
      const message = await createPayback({
        customer_id: Number(formData.customer_id),
        amount: formData.amount.trim(),
        payment_date: formData.payment_date.trim(),
      })

      setSuccessMessage(message || 'Payback created successfully')
      setIsModalOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      setCreateError(getPaybackErrorMessage(error))
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Paybacks
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Payback Management
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Record customer repayments against PayLater balances.
          </p>
        </header>

        <Button type="button" onClick={openCreateModal}>
          Create Payback
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

      <Alert
        variant="info"
        message="The current API does not provide a payback list endpoint. Use Create Payback to record a new customer repayment."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Payback"
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
              form="create-payback-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create Payback'}
            </Button>
          </div>
        }
      >
        <form
          id="create-payback-form"
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
            label="Customer ID"
            name="customer_id"
            inputMode="numeric"
            value={formData.customer_id}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                customer_id: event.target.value,
              }))
            }
            error={fieldErrors.customer_id}
            fullWidth
            required
            disabled={createLoading}
          />

          <Input
            label="Amount"
            name="amount"
            inputMode="decimal"
            value={formData.amount}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            error={fieldErrors.amount}
            fullWidth
            required
            disabled={createLoading}
          />

          <Input
            label="Payment Date"
            name="payment_date"
            type="date"
            value={formData.payment_date}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                payment_date: event.target.value,
              }))
            }
            error={fieldErrors.payment_date}
            fullWidth
            required
            disabled={createLoading}
          />
        </form>
      </Modal>
    </div>
  )
}
