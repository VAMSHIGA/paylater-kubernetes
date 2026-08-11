import { useCallback, useEffect, useState } from 'react'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Table, type TableColumn } from '../../components/ui/Table'
import {
  getCreditLimit,
  getCustomerDues,
  getMerchantFees,
  getReportErrorMessage,
  getTotalDues,
} from '../../services/reportService'
import type {
  CreditLimitCustomer,
  CustomerDue,
  MerchantFee,
} from '../../types'

const merchantFeeColumns: TableColumn<MerchantFee>[] = [
  {
    key: 'MerchantName',
    header: 'Merchant Name',
  },
  {
    key: 'Commission',
    header: 'Commission',
  },
]

const customerDueColumns: TableColumn<CustomerDue>[] = [
  {
    key: 'customer_id',
    header: 'Customer ID',
  },
  {
    key: 'name',
    header: 'Name',
  },
  {
    key: 'total_transaction',
    header: 'Total Transaction',
  },
  {
    key: 'total_repaid',
    header: 'Total Repaid',
  },
  {
    key: 'remaining_due',
    header: 'Remaining Due',
  },
]

const creditLimitColumns: TableColumn<CreditLimitCustomer>[] = [
  {
    key: 'customer_id',
    header: 'Customer ID',
  },
  {
    key: 'name',
    header: 'Name',
  },
  {
    key: 'credit_limit',
    header: 'Credit Limit',
  },
  {
    key: 'remaining_due',
    header: 'Remaining Due',
  },
]

export function Reports() {
  const [merchantFees, setMerchantFees] = useState<MerchantFee[]>([])
  const [merchantFeesLoading, setMerchantFeesLoading] = useState(true)
  const [merchantFeesError, setMerchantFeesError] = useState<string | null>(null)

  const [customerDues, setCustomerDues] = useState<CustomerDue[]>([])
  const [customerDuesLoading, setCustomerDuesLoading] = useState(true)
  const [customerDuesError, setCustomerDuesError] = useState<string | null>(null)

  const [creditLimitCustomers, setCreditLimitCustomers] = useState<
    CreditLimitCustomer[]
  >([])
  const [creditLimitLoading, setCreditLimitLoading] = useState(true)
  const [creditLimitError, setCreditLimitError] = useState<string | null>(null)

  const [totalDues, setTotalDues] = useState<string | null>(null)
  const [totalDuesLoading, setTotalDuesLoading] = useState(true)
  const [totalDuesError, setTotalDuesError] = useState<string | null>(null)

  const [refreshing, setRefreshing] = useState(false)

  const loadMerchantFees = useCallback(async () => {
    setMerchantFeesLoading(true)
    setMerchantFeesError(null)

    try {
      const data = await getMerchantFees()
      setMerchantFees(data)
    } catch (error) {
      setMerchantFees([])
      setMerchantFeesError(getReportErrorMessage(error).message)
    } finally {
      setMerchantFeesLoading(false)
    }
  }, [])

  const loadCustomerDues = useCallback(async () => {
    setCustomerDuesLoading(true)
    setCustomerDuesError(null)

    try {
      const data = await getCustomerDues()
      setCustomerDues(data)
    } catch (error) {
      setCustomerDues([])
      setCustomerDuesError(getReportErrorMessage(error).message)
    } finally {
      setCustomerDuesLoading(false)
    }
  }, [])

  const loadCreditLimit = useCallback(async () => {
    setCreditLimitLoading(true)
    setCreditLimitError(null)

    try {
      const data = await getCreditLimit()
      setCreditLimitCustomers(data)
    } catch (error) {
      setCreditLimitCustomers([])
      setCreditLimitError(getReportErrorMessage(error).message)
    } finally {
      setCreditLimitLoading(false)
    }
  }, [])

  const loadTotalDues = useCallback(async () => {
    setTotalDuesLoading(true)
    setTotalDuesError(null)

    try {
      const data = await getTotalDues()
      setTotalDues(data.total_dues)
    } catch (error) {
      setTotalDues(null)
      setTotalDuesError(getReportErrorMessage(error).message)
    } finally {
      setTotalDuesLoading(false)
    }
  }, [])

  const loadAllReports = useCallback(async () => {
    await Promise.all([
      loadMerchantFees(),
      loadCustomerDues(),
      loadCreditLimit(),
      loadTotalDues(),
    ])
  }, [loadCreditLimit, loadCustomerDues, loadMerchantFees, loadTotalDues])

  useEffect(() => {
    void loadAllReports()
  }, [loadAllReports])

  async function handleRefresh() {
    setRefreshing(true)

    try {
      await loadAllReports()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            Reports
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
            Reports
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Admin reporting data from the PayLater reporting service.
          </p>
        </header>

        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          loading={refreshing}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Reports'}
        </Button>
      </div>

      <Card title="Total Dues" padding="md">
        {totalDuesError ? (
          <Alert variant="error" title="Failed to load" message={totalDuesError} />
        ) : null}

        {totalDuesLoading ? (
          <p className="text-sm text-text-muted">Loading total dues...</p>
        ) : totalDuesError ? null : (
          <p className="text-2xl font-semibold text-text">{totalDues}</p>
        )}
      </Card>

      <Card title="Merchant Fees" padding="md">
        <Table
          columns={merchantFeeColumns}
          data={merchantFees}
          loading={merchantFeesLoading}
          error={merchantFeesError ?? undefined}
          emptyMessage="No merchant fee data available."
          rowKey={(row) => row.MerchantName}
        />
      </Card>

      <Card title="Customer Dues" padding="md">
        <Table
          columns={customerDueColumns}
          data={customerDues}
          loading={customerDuesLoading}
          error={customerDuesError ?? undefined}
          emptyMessage="No customer dues data available."
          rowKey="customer_id"
        />
      </Card>

      <Card title="Customers at Credit Limit" padding="md">
        <Table
          columns={creditLimitColumns}
          data={creditLimitCustomers}
          loading={creditLimitLoading}
          error={creditLimitError ?? undefined}
          emptyMessage="No customers at credit limit."
          rowKey="customer_id"
        />
      </Card>
    </div>
  )
}
