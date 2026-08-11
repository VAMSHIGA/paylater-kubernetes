import { type FormEvent, useState } from 'react'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import {
  createTransaction,
  getTransactionErrorMessage,
} from '../../services/transactionService'

interface FormState {
  customer_id: string
  merchant_id: string
  amount: string
  commission: string
  transaction_date: string
}

interface FormErrors {
  customer_id?: string
  merchant_id?: string
  amount?: string
  commission?: string
  transaction_date?: string
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const initialFormData: FormState = {
  customer_id: '',
  merchant_id: '',
  amount: '',
  commission: '',
  transaction_date: '',
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

function validateCommission(commission: string): string | undefined {
  const required = validateRequired(commission, 'Commission')

  if (required) {
    return required
  }

  const value = Number(commission)

  if (Number.isNaN(value) || value < 0) {
    return 'Enter a valid commission'
  }

  return undefined
}

function validateTransactionDate(transactionDate: string): string | undefined {
  const required = validateRequired(transactionDate, 'Transaction date')

  if (required) {
    return required
  }

  if (!datePattern.test(transactionDate)) {
    return 'Transaction date must be in YYYY-MM-DD format'
  }

  return undefined
}

export function Transactions() {
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
      merchant_id: validatePositiveInteger(formData.merchant_id, 'Merchant ID'),
      amount: validateAmount(formData.amount),
      commission: validateCommission(formData.commission),
      transaction_date: validateTransactionDate(formData.transaction_date),
    }

    setFieldErrors(nextErrors)
    setCreateError(null)

    if (
      nextErrors.customer_id ||
      nextErrors.merchant_id ||
      nextErrors.amount ||
      nextErrors.commission ||
      nextErrors.transaction_date
    ) {
      return
    }

    setCreateLoading(true)

    try {
      const message = await createTransaction({
        customer_id: Number(formData.customer_id),
        merchant_id: Number(formData.merchant_id),
        amount: formData.amount.trim(),
        commission: formData.commission.trim(),
        transaction_date: formData.transaction_date.trim(),
      })

      setSuccessMessage(message || 'Transaction created successfully')
      setIsModalOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      setCreateError(getTransactionErrorMessage(error))
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Transactions
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Transaction Management
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Record PayLater purchases against customer and merchant accounts.
          </p>
        </header>

        <Button type="button" onClick={openCreateModal}>
          Create Transaction
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
        message="The current API does not provide a transaction list endpoint. Use Create Transaction to record a new PayLater purchase."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Transaction"
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
              form="create-transaction-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        }
      >
        <form
          id="create-transaction-form"
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

          <div className="grid gap-4 sm:grid-cols-2">
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
              label="Merchant ID"
              name="merchant_id"
              inputMode="numeric"
              value={formData.merchant_id}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  merchant_id: event.target.value,
                }))
              }
              error={fieldErrors.merchant_id}
              fullWidth
              required
              disabled={createLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              label="Commission"
              name="commission"
              inputMode="decimal"
              value={formData.commission}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  commission: event.target.value,
                }))
              }
              error={fieldErrors.commission}
              fullWidth
              required
              disabled={createLoading}
            />
          </div>

          <Input
            label="Transaction Date"
            name="transaction_date"
            type="date"
            value={formData.transaction_date}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                transaction_date: event.target.value,
              }))
            }
            error={fieldErrors.transaction_date}
            fullWidth
            required
            disabled={createLoading}
          />
        </form>
      </Modal>
    </div>
  )
}
