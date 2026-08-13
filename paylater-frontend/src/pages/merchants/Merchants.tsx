import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { useMerchantProfile } from '../../hooks/useMerchantProfile'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import {
  createMerchant,
  getMerchantErrorMessage,
  updateMerchantCommission,
} from '../../services/merchantService'
import type { CreateMerchantRequest } from '../../types'

interface CreateFormErrors {
  merchant_name?: string
  phone_number?: string
  onboarding?: string
  commission?: string
}

interface UpdateFormErrors {
  merchant_id?: string
  commission?: string
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) {
    return `${label} is required`
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

function validateOnboarding(onboarding: string): string | undefined {
  const required = validateRequired(onboarding, 'Onboarding date')

  if (required) {
    return required
  }

  if (!datePattern.test(onboarding)) {
    return 'Onboarding must be in YYYY-MM-DD format'
  }

  return undefined
}

function validateMerchantId(merchantId: string): string | undefined {
  const required = validateRequired(merchantId, 'Merchant ID')

  if (required) {
    return required
  }

  const value = Number(merchantId)

  if (!Number.isInteger(value) || value <= 0) {
    return 'Enter a valid merchant ID'
  }

  return undefined
}

function MerchantProfileView() {
  const { profile, loading, error } = useMerchantProfile()

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Merchants
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
          Merchant Profile
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          View your linked merchant profile and commission rate.
        </p>
      </header>

      {error ? (
        <Alert variant="error" title="Unable to load profile" message={error} />
      ) : null}

      <Card title="Your Merchant Profile" padding="md">
        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-text-muted">Merchant ID</dt>
              <dd className="mt-1 text-sm text-text">{profile?.ID ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">
                Merchant Name
              </dt>
              <dd className="mt-1 text-sm text-text">
                {profile?.MerchantName ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">
                Phone Number
              </dt>
              <dd className="mt-1 text-sm text-text">
                {profile?.PhoneNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">
                Onboarding Date
              </dt>
              <dd className="mt-1 text-sm text-text">
                {profile?.Onboarding ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">
                Commission Rate
              </dt>
              <dd className="mt-1 text-sm text-text">
                {profile?.Commission ? `${profile.Commission}%` : '—'}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      <Card title="Dashboard" padding="md">
        <p className="text-sm text-text-muted">
          View transaction totals, sales, commission, and recent customer
          purchases on your merchant dashboard.
        </p>
        <Link
          to="/merchant"
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
        >
          Go to merchant dashboard
        </Link>
      </Card>
    </div>
  )
}

function AdminMerchantManagement() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [createFormData, setCreateFormData] = useState<CreateMerchantRequest>({
    merchant_name: '',
    phone_number: '',
    onboarding: '',
    commission: '',
  })
  const [createFieldErrors, setCreateFieldErrors] = useState<CreateFormErrors>(
    {},
  )

  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [updateMerchantId, setUpdateMerchantId] = useState('')
  const [updateCommission, setUpdateCommission] = useState('')
  const [updateFieldErrors, setUpdateFieldErrors] = useState<UpdateFormErrors>(
    {},
  )

  function openCreateModal() {
    setCreateFormData({
      merchant_name: '',
      phone_number: '',
      onboarding: '',
      commission: '',
    })
    setCreateFieldErrors({})
    setCreateError(null)
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (createLoading) {
      return
    }

    setIsCreateModalOpen(false)
    setCreateError(null)
    setCreateFieldErrors({})
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: CreateFormErrors = {
      merchant_name: validateRequired(
        createFormData.merchant_name,
        'Merchant name',
      ),
      phone_number: validateRequired(
        createFormData.phone_number,
        'Phone number',
      ),
      onboarding: validateOnboarding(createFormData.onboarding),
      commission: validateCommission(createFormData.commission),
    }

    setCreateFieldErrors(nextErrors)
    setCreateError(null)

    if (
      nextErrors.merchant_name ||
      nextErrors.phone_number ||
      nextErrors.onboarding ||
      nextErrors.commission
    ) {
      return
    }

    setCreateLoading(true)

    try {
      const message = await createMerchant({
        merchant_name: createFormData.merchant_name.trim(),
        phone_number: createFormData.phone_number.trim(),
        onboarding: createFormData.onboarding.trim(),
        commission: createFormData.commission.trim(),
      })

      setSuccessMessage(message || 'Merchant created successfully')
      setIsCreateModalOpen(false)
      setCreateFormData({
        merchant_name: '',
        phone_number: '',
        onboarding: '',
        commission: '',
      })
    } catch (error) {
      setCreateError(getMerchantErrorMessage(error))
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: UpdateFormErrors = {
      merchant_id: validateMerchantId(updateMerchantId),
      commission: validateCommission(updateCommission),
    }

    setUpdateFieldErrors(nextErrors)
    setUpdateError(null)

    if (nextErrors.merchant_id || nextErrors.commission) {
      return
    }

    setUpdateLoading(true)

    try {
      const message = await updateMerchantCommission(Number(updateMerchantId), {
        commission: updateCommission.trim(),
      })

      setSuccessMessage(
        message || 'Merchant commission updated successfully',
      )
      setUpdateMerchantId('')
      setUpdateCommission('')
    } catch (error) {
      setUpdateError(getMerchantErrorMessage(error))
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Merchants
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Merchant Management
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Onboard merchants and manage commission settings.
          </p>
        </header>

        <Button type="button" onClick={openCreateModal}>
          Create Merchant
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

      <Card title="Update Merchant Commission" padding="md">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleUpdateSubmit}
          noValidate
        >
          {updateError ? (
            <Alert
              variant="error"
              title={updateError.title}
              message={updateError.message}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Merchant ID"
              name="merchant_id"
              inputMode="numeric"
              value={updateMerchantId}
              onChange={(event) => setUpdateMerchantId(event.target.value)}
              error={updateFieldErrors.merchant_id}
              fullWidth
              required
              disabled={updateLoading}
            />

            <Input
              label="Commission"
              name="commission"
              inputMode="decimal"
              value={updateCommission}
              onChange={(event) => setUpdateCommission(event.target.value)}
              error={updateFieldErrors.commission}
              fullWidth
              required
              disabled={updateLoading}
            />
          </div>

          <div>
            <Button type="submit" loading={updateLoading} disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Commission'}
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Merchant"
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
              form="create-merchant-form"
              loading={createLoading}
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create Merchant'}
            </Button>
          </div>
        }
      >
        <form
          id="create-merchant-form"
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
            label="Merchant Name"
            name="merchant_name"
            value={createFormData.merchant_name}
            onChange={(event) =>
              setCreateFormData((current) => ({
                ...current,
                merchant_name: event.target.value,
              }))
            }
            error={createFieldErrors.merchant_name}
            fullWidth
            required
            disabled={createLoading}
          />

          <Input
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={createFormData.phone_number}
            onChange={(event) =>
              setCreateFormData((current) => ({
                ...current,
                phone_number: event.target.value,
              }))
            }
            error={createFieldErrors.phone_number}
            fullWidth
            required
            disabled={createLoading}
          />

          <Input
            label="Onboarding Date"
            name="onboarding"
            type="date"
            value={createFormData.onboarding}
            onChange={(event) =>
              setCreateFormData((current) => ({
                ...current,
                onboarding: event.target.value,
              }))
            }
            error={createFieldErrors.onboarding}
            fullWidth
            required
            disabled={createLoading}
          />

          <Input
            label="Commission"
            name="commission"
            inputMode="decimal"
            value={createFormData.commission}
            onChange={(event) =>
              setCreateFormData((current) => ({
                ...current,
                commission: event.target.value,
              }))
            }
            error={createFieldErrors.commission}
            fullWidth
            required
            disabled={createLoading}
          />
        </form>
      </Modal>
    </div>
  )
}

export function Merchants() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  if (!isAdmin) {
    return <MerchantProfileView />
  }

  return <AdminMerchantManagement />
}
