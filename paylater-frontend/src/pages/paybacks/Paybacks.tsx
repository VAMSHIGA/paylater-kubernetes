import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table, type TableColumn } from '../../components/ui/Table'
import {
  createPayback,
  getPaybackErrorMessage,
  listPaybacks,
} from '../../services/paybackService'
import type { Payback } from '../../types'
import { formatMoney } from '../../utils/format'

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
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useCustomerProfile()
  const [paybacks, setPaybacks] = useState<Payback[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const loadPaybacks = useCallback(async () => {
    setListLoading(true)
    setListError(null)

    try {
      const data = await listPaybacks()
      setPaybacks(data)
    } catch (error) {
      setPaybacks([])
      setListError(getPaybackErrorMessage(error).message)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPaybacks()
  }, [loadPaybacks])

  useEffect(() => {
    if (isCustomer && profile?.ID) {
      setFormData((current) => ({
        ...current,
        customer_id: String(profile.ID),
      }))
    }
  }, [isCustomer, profile?.ID])

  const columns = useMemo<Array<TableColumn<Payback>>>(() => {
    const baseColumns: Array<TableColumn<Payback>> = [
      {
        key: 'ID',
        header: 'Payback ID',
      },
    ]

    if (!isCustomer) {
      baseColumns.push({
        key: 'CustomerID',
        header: 'Customer ID',
      })
    }

    baseColumns.push(
      {
        key: 'Amount',
        header: 'Amount',
        render: (row) => formatMoney(row.Amount),
      },
      {
        key: 'PaymentDate',
        header: 'Payment Date',
      },
    )

    return baseColumns
  }, [isCustomer])

  function openCreateModal() {
    const nextForm = { ...initialFormData }

    if (isCustomer && profile?.ID) {
      nextForm.customer_id = String(profile.ID)
    }

    setFormData(nextForm)
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

    const customerId = isCustomer
      ? profile?.ID
        ? String(profile.ID)
        : ''
      : formData.customer_id

    const nextErrors: FormErrors = {
      customer_id: isCustomer
        ? profile?.ID
          ? undefined
          : 'Your PayLater profile is not available yet'
        : validatePositiveInteger(customerId, 'Customer ID'),
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
        customer_id: Number(customerId),
        amount: formData.amount.trim(),
        payment_date: formData.payment_date.trim(),
      })

      setSuccessMessage(message || 'Payback created successfully')
      setIsModalOpen(false)
      setFormData(initialFormData)
      await loadPaybacks()
      if (isCustomer) {
        await refreshProfile()
      }
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
            Record repayments and view your payback history.
          </p>
        </header>

        <Button
          type="button"
          onClick={openCreateModal}
          disabled={isCustomer && (profileLoading || !profile?.ID)}
        >
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

      {isCustomer && profileError ? (
        <Alert
          variant="error"
          title="Unable to load profile"
          message={profileError}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Payback History</h2>
        <Table
          columns={columns}
          data={paybacks}
          loading={listLoading}
          error={listError ?? undefined}
          emptyMessage="No paybacks recorded yet."
          rowKey="ID"
        />
      </section>

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

          {!isCustomer ? (
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
          ) : null}

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
