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


// Form data
interface FormState {
  customer_id: string
  amount: string
  payment_date: string
}


// Form validation errors
interface FormErrors {
  customer_id?: string
  amount?: string
  payment_date?: string
}


// Payment date format
const datePattern = /^\d{4}-\d{2}-\d{2}$/


// Initial empty form
const initialFormData: FormState = {
  customer_id: '',
  amount: '',
  payment_date: '',
}


// Validate required fields
function validateRequired(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) {
    return `${label} is required`
  }

  return undefined
}


// Validate Customer ID
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


// Validate Amount
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


// Validate Payment Date
function validatePaymentDate(
  paymentDate: string,
): string | undefined {

  const required = validateRequired(
    paymentDate,
    'Payment date',
  )

  if (required) {
    return required
  }

  if (!datePattern.test(paymentDate)) {
    return 'Payment date must be in YYYY-MM-DD format'
  }

  return undefined
}


export function Paybacks() {

  // Get logged-in user
  const { user } = useAuth()

  // Check whether logged-in user is a customer
  const isCustomer = user?.role === 'customer'


  // Get customer profile
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useCustomerProfile()


  // Payback list
  const [paybacks, setPaybacks] = useState<Payback[]>([])

  // Payback list loading state
  const [listLoading, setListLoading] = useState(true)

  // Payback list error
  const [listError, setListError] = useState<string | null>(null)

  // Success message
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  // Create Payback modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Create Payback loading state
  const [createLoading, setCreateLoading] = useState(false)

  // Create Payback API error
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)

  // Create Payback form data
  const [formData, setFormData] =
    useState(initialFormData)

  // Form validation errors
  const [fieldErrors, setFieldErrors] =
    useState<FormErrors>({})


  // ======================================================
  // LOAD PAYBACKS
  // ======================================================

  const loadPaybacks = useCallback(async () => {

    // Start loading
    setListLoading(true)

    // Clear previous error
    setListError(null)

    try {

      // Get paybacks from backend
      const data = await listPaybacks()

      // Store paybacks
      setPaybacks(data)

    } catch (error) {

      // Backend failure while loading paybacks
      setPaybacks([])

      // Show API error
      setListError(
        getPaybackErrorMessage(error).message,
      )

    } finally {

      // Stop loading
      setListLoading(false)
    }

  }, [])


  // Load paybacks when page opens
  useEffect(() => {
    void loadPaybacks()
  }, [loadPaybacks])


  // Set customer ID automatically for customer users
  useEffect(() => {
    if (isCustomer && profile?.ID) {

      setFormData((current) => ({
        ...current,
        customer_id: String(profile.ID),
      }))
    }
  }, [isCustomer, profile?.ID])


  // ======================================================
  // PAYBACK TABLE COLUMNS
  // ======================================================

  const columns = useMemo<Array<TableColumn<Payback>>>(() => {

    const baseColumns: Array<TableColumn<Payback>> = [
      {
        key: 'ID',
        header: 'Payback ID',
      },
    ]


    // Admin can see Customer ID
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

        // Format amount as money
        render: (row) => formatMoney(row.Amount),
      },
      {
        key: 'PaymentDate',
        header: 'Payment Date',
      },
    )

    return baseColumns

  }, [isCustomer])


  // ======================================================
  // OPEN CREATE PAYBACK MODAL
  // ======================================================

  function openCreateModal() {

    const nextForm = {
      ...initialFormData,
    }


    // Automatically set Customer ID for customer
    if (isCustomer && profile?.ID) {
      nextForm.customer_id = String(profile.ID)
    }


    setFormData(nextForm)
    setFieldErrors({})
    setCreateError(null)

    // Open modal
    setIsModalOpen(true)
  }


  // ======================================================
  // CLOSE CREATE PAYBACK MODAL
  // ======================================================

  function closeCreateModal() {

    // Don't close while creating
    if (createLoading) {
      return
    }

    setIsModalOpen(false)
    setCreateError(null)
    setFieldErrors({})
  }


  // ======================================================
  // CREATE PAYBACK
  // ======================================================

  async function handleCreateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {

    // Prevent page refresh
    event.preventDefault()


    // Get Customer ID
    const customerId = isCustomer
      ? profile?.ID
        ? String(profile.ID)
        : ''
      : formData.customer_id


    // ==================================================
    // VALIDATE FORM
    // ==================================================

    const nextErrors: FormErrors = {

      // Customer ID validation
      customer_id: isCustomer
        ? profile?.ID
          ? undefined
          : 'Your PayLater profile is not available yet'
        : validatePositiveInteger(
            customerId,
            'Customer ID',
          ),

      // Amount validation
      amount: validateAmount(formData.amount),

      // Payment date validation
      payment_date: validatePaymentDate(
        formData.payment_date,
      ),
    }


    // Store validation errors
    setFieldErrors(nextErrors)

    // Clear previous API error
    setCreateError(null)


    // Stop if validation fails
    if (
      nextErrors.customer_id ||
      nextErrors.amount ||
      nextErrors.payment_date
    ) {
      return
    }


    // Start creating
    setCreateLoading(true)


    try {

      // Create payback in backend
      const message = await createPayback({
        customer_id: Number(customerId),
        amount: formData.amount.trim(),
        payment_date: formData.payment_date.trim(),
      })


      // Show success message
      setSuccessMessage(
        message || 'Payback created successfully',
      )

      // Close modal
      setIsModalOpen(false)

      // Clear form
      setFormData(initialFormData)

      // Refresh payback list
      await loadPaybacks()

      // Refresh customer profile
      if (isCustomer) {
        await refreshProfile()
      }

    } catch (error) {

      // Backend failure while creating payback
      setCreateError(
        getPaybackErrorMessage(error),
      )

    } finally {

      // Stop creating
      setCreateLoading(false)
    }
  }


  // ======================================================
  // PAGE UI
  // ======================================================

  return (
    <div className="space-y-6">

      {/* Page header */}
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


        {/* Create Payback button */}
        <Button
          type="button"
          onClick={openCreateModal}
          disabled={
            isCustomer &&
            (profileLoading || !profile?.ID)
          }
        >
          Create Payback
        </Button>

      </div>


      {/* Success message */}
      {successMessage ? (
        <Alert
          variant="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() =>
            setSuccessMessage(null)
          }
        />
      ) : null}


      {/* Customer profile error */}
      {isCustomer && profileError ? (
        <Alert
          variant="error"
          title="Unable to load profile"
          message={profileError}
        />
      ) : null}


      {/* ==================================================
          PAYBACK HISTORY
          ================================================== */}

      <section className="space-y-3">

        <h2 className="text-lg font-semibold text-text">
          Payback History
        </h2>

        <Table
          columns={columns}
          data={paybacks}
          loading={listLoading}
          error={listError ?? undefined}
          emptyMessage="No paybacks recorded yet."
          rowKey="ID"
        />

      </section>


      {/* ==================================================
          CREATE PAYBACK MODAL
          ================================================== */}

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Payback"
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


            {/* Create Payback button */}
            <Button
              type="submit"
              form="create-payback-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading
                ? 'Creating...'
                : 'Create Payback'}
            </Button>

          </div>
        }
      >

        {/* Create Payback form */}
        <form
          id="create-payback-form"
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


          {/* Customer ID field - shown for admin */}
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


          {/* Amount field */}
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


          {/* Payment Date field */}
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