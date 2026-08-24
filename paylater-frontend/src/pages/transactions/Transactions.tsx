import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../hooks/useAuth'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table, type TableColumn } from '../../components/ui/Table'
import {
  createTransaction,
  getTransactionErrorMessage,
  listTransactions,
} from '../../services/transactionService'
import type { Transaction } from '../../types'
import { formatMoney } from '../../utils/format'


// Form fields used when creating a transaction
interface FormState {
  customer_id: string
  merchant_id: string
  amount: string
  commission: string
  transaction_date: string
}


// Validation errors for each form field
interface FormErrors {
  customer_id?: string
  merchant_id?: string
  amount?: string
  commission?: string
  transaction_date?: string
}


// Transaction date must be YYYY-MM-DD
const datePattern = /^\d{4}-\d{2}-\d{2}$/


// Empty form when creating a new transaction
const initialFormData: FormState = {
  customer_id: '',
  merchant_id: '',
  amount: '',
  commission: '',
  transaction_date: '',
}


// Check whether a required field is empty
function validateRequired(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) {
    return `${label} is required`
  }

  return undefined
}


// Validate IDs such as Customer ID and Merchant ID
// ID must be a positive integer
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


// Validate transaction amount
// Amount must be greater than 0
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


// Validate commission
// Commission must be 0 or greater
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


// Validate transaction date
// Date must be YYYY-MM-DD
function validateTransactionDate(
  transactionDate: string,
): string | undefined {
  const required = validateRequired(
    transactionDate,
    'Transaction date',
  )

  if (required) {
    return required
  }

  if (!datePattern.test(transactionDate)) {
    return 'Transaction date must be in YYYY-MM-DD format'
  }

  return undefined
}


export function Transactions() {

  // Get logged-in user information
  const { user } = useAuth()

  // Check whether the logged-in user is a customer
  const isCustomer = user?.role === 'customer'


  // Get customer profile
  // Customer ID can come automatically from this profile
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useCustomerProfile()


  // Transaction list data and loading/error states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)


  // Success message after creating a transaction
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)


  // Create transaction modal state
  const [isModalOpen, setIsModalOpen] = useState(false)


  // Create transaction loading state
  const [createLoading, setCreateLoading] = useState(false)


  // Create transaction API error
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)


  // Form values
  const [formData, setFormData] =
    useState(initialFormData)


  // Form validation errors
  const [fieldErrors, setFieldErrors] =
    useState<FormErrors>({})


  // Load transaction history from backend
  const loadTransactions = useCallback(async () => {
    setListLoading(true)
    setListError(null)

    try {
      // Call backend API
      const data = await listTransactions()

      // Store transactions in state
      setTransactions(data)
    } catch (error) {

      // Backend failed → clear transactions and show error
      setTransactions([])
      setListError(
        getTransactionErrorMessage(error).message,
      )
    } finally {

      // Loading finished
      setListLoading(false)
    }
  }, [])


  // Load transaction history when page opens
  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])


  // Automatically set Customer ID for customer users
  useEffect(() => {
    if (isCustomer && profile?.ID) {
      setFormData((current) => ({
        ...current,
        customer_id: String(profile.ID),
      }))
    }
  }, [isCustomer, profile?.ID])


  // Create table columns
  // Customer ID column is hidden for customer users
  const columns = useMemo<Array<TableColumn<Transaction>>>(() => {
    const baseColumns: Array<TableColumn<Transaction>> = [
      {
        key: 'ID',
        header: 'Transaction ID',
      },
    ]


    // Admin/merchant can see Customer ID
    if (!isCustomer) {
      baseColumns.push({
        key: 'CustomerID',
        header: 'Customer ID',
      })
    }


    baseColumns.push(
      {
        key: 'MerchantID',
        header: 'Merchant ID',
      },
      {
        key: 'Amount',
        header: 'Amount',
        render: (row) => formatMoney(row.Amount),
      },
      {
        key: 'Commission',
        header: 'Commission',
        render: (row) => formatMoney(row.Commission),
      },
      {
        key: 'TransactionDate',
        header: 'Transaction Date',
      },
    )


    return baseColumns
  }, [isCustomer])


  // Open Create Transaction modal
  function openCreateModal() {
    const nextForm = { ...initialFormData }


    // For customer, automatically use their profile ID
    if (isCustomer && profile?.ID) {
      nextForm.customer_id = String(profile.ID)
    }


    setFormData(nextForm)
    setFieldErrors({})
    setCreateError(null)
    setIsModalOpen(true)
  }


  // Close Create Transaction modal
  function closeCreateModal() {

    // Do not close while transaction is being created
    if (createLoading) {
      return
    }


    setIsModalOpen(false)
    setCreateError(null)
    setFieldErrors({})
  }


  // Submit Create Transaction form
  async function handleCreateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()


    // Get Customer ID
    // Customer users get it from their profile
    // Admin/merchant users enter it manually
    const customerId = isCustomer
      ? profile?.ID
        ? String(profile.ID)
        : ''
      : formData.customer_id


    // Validate all form fields
    const nextErrors: FormErrors = {
      customer_id: isCustomer
        ? profile?.ID
          ? undefined
          : 'Your PayLater profile is not available yet'
        : validatePositiveInteger(
            customerId,
            'Customer ID',
          ),

      merchant_id: validatePositiveInteger(
        formData.merchant_id,
        'Merchant ID',
      ),

      amount: validateAmount(formData.amount),

      commission: validateCommission(
        formData.commission,
      ),

      transaction_date: validateTransactionDate(
        formData.transaction_date,
      ),
    }


    // Save validation errors
    setFieldErrors(nextErrors)

    // Clear previous API error
    setCreateError(null)


    // If validation fails, stop here
    if (
      nextErrors.customer_id ||
      nextErrors.merchant_id ||
      nextErrors.amount ||
      nextErrors.commission ||
      nextErrors.transaction_date
    ) {
      return
    }


    // Start creating transaction
    setCreateLoading(true)


    try {

      // Send transaction data to backend
      const message = await createTransaction({
        customer_id: Number(customerId),
        merchant_id: Number(formData.merchant_id),
        amount: formData.amount.trim(),
        commission: formData.commission.trim(),
        transaction_date:
          formData.transaction_date.trim(),
      })


      // Show success message
      setSuccessMessage(
        message || 'Transaction created successfully',
      )


      // Close modal
      setIsModalOpen(false)


      // Clear form
      setFormData(initialFormData)


      // Reload transaction history
      await loadTransactions()


      // If customer, refresh customer profile also
      if (isCustomer) {
        await refreshProfile()
      }

    } catch (error) {

      // Backend failure → show error message
      setCreateError(
        getTransactionErrorMessage(error),
      )

    } finally {

      // Stop creating/loading state
      setCreateLoading(false)
    }
  }


  return (
    <div className="space-y-6">

      {/* Page header and Create Transaction button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Transactions
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Transaction Management
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Record PayLater purchases and view your transaction history.
          </p>
        </header>


        {/* Customer cannot create until profile is loaded */}
        <Button
          type="button"
          onClick={openCreateModal}
          disabled={
            isCustomer &&
            (profileLoading || !profile?.ID)
          }
        >
          Create Transaction
        </Button>
      </div>


      {/* Show successful transaction message */}
      {successMessage ? (
        <Alert
          variant="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}


      {/* Show customer profile error */}
      {isCustomer && profileError ? (
        <Alert
          variant="error"
          title="Unable to load profile"
          message={profileError}
        />
      ) : null}


      {/* Transaction history table */}
      <section className="space-y-3">

        <h2 className="text-lg font-semibold text-text">
          Transaction History
        </h2>

        <Table
          columns={columns}
          data={transactions}
          loading={listLoading}
          error={listError ?? undefined}
          emptyMessage="No transactions recorded yet."
          rowKey="ID"
        />

      </section>


      {/* Create Transaction modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Create Transaction"
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


            {/* Submit transaction button */}
            <Button
              type="submit"
              form="create-transaction-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading
                ? 'Creating...'
                : 'Create Transaction'}
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

          {/* Backend error while creating transaction */}
          {createError ? (
            <Alert
              variant="error"
              title={createError.title}
              message={createError.message}
            />
          ) : null}


          {/* Customer ID and Merchant ID */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Customer ID is entered manually for admin/merchant */}
            {!isCustomer ? (
              <Input
                label="Customer ID"
                name="customer_id"
                inputMode="numeric"
                value={formData.customer_id}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    customer_id:
                      event.target.value,
                  }))
                }
                error={fieldErrors.customer_id}
                fullWidth
                required
                disabled={createLoading}
              />
            ) : null}


            {/* Merchant ID */}
            <Input
              label="Merchant ID"
              name="merchant_id"
              inputMode="numeric"
              value={formData.merchant_id}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  merchant_id:
                    event.target.value,
                }))
              }
              error={fieldErrors.merchant_id}
              fullWidth
              required
              disabled={createLoading}
            />

          </div>


          {/* Amount and Commission */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Transaction amount */}
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


            {/* Commission */}
            <Input
              label="Commission"
              name="commission"
              inputMode="decimal"
              value={formData.commission}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  commission:
                    event.target.value,
                }))
              }
              error={fieldErrors.commission}
              fullWidth
              required
              disabled={createLoading}
            />

          </div>


          {/* Transaction date */}
          <Input
            label="Transaction Date"
            name="transaction_date"
            type="date"
            value={formData.transaction_date}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                transaction_date:
                  event.target.value,
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