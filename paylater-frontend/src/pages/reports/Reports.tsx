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
import { formatMoney } from '../../utils/format'


// Merchant fees table columns
const merchantFeeColumns: TableColumn<MerchantFee>[] = [
  {
    key: 'MerchantName',
    header: 'Merchant Name',
  },
  {
    key: 'Commission',
    header: 'Commission',
    render: (row) => formatMoney(row.Commission),
  },
]


// Customer dues table columns
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
    render: (row) => formatMoney(row.total_transaction),
  },
  {
    key: 'total_repaid',
    header: 'Total Repaid',
    render: (row) => formatMoney(row.total_repaid),
  },
  {
    key: 'remaining_due',
    header: 'Remaining Due',
    render: (row) => formatMoney(row.remaining_due),
  },
]


// Customers at credit limit table columns
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
    render: (row) => formatMoney(row.credit_limit),
  },
  {
    key: 'remaining_due',
    header: 'Remaining Due',
    render: (row) => formatMoney(row.remaining_due),
  },
]


export function Reports() {

  // Merchant fees data, loading and error states
  const [merchantFees, setMerchantFees] = useState<MerchantFee[]>([])
  const [merchantFeesLoading, setMerchantFeesLoading] = useState(true)
  const [merchantFeesError, setMerchantFeesError] = useState<string | null>(null)


  // Customer dues data, loading and error states
  const [customerDues, setCustomerDues] = useState<CustomerDue[]>([])
  const [customerDuesLoading, setCustomerDuesLoading] = useState(true)
  const [customerDuesError, setCustomerDuesError] = useState<string | null>(null)


  // Credit limit customer data, loading and error states
  const [creditLimitCustomers, setCreditLimitCustomers] = useState<
    CreditLimitCustomer[]
  >([])
  const [creditLimitLoading, setCreditLimitLoading] = useState(true)
  const [creditLimitError, setCreditLimitError] = useState<string | null>(null)


  // Total dues data, loading and error states
  const [totalDues, setTotalDues] = useState<string | null>(null)
  const [totalDuesLoading, setTotalDuesLoading] = useState(true)
  const [totalDuesError, setTotalDuesError] = useState<string | null>(null)


  // Refresh button loading state
  const [refreshing, setRefreshing] = useState(false)


  // Load merchant fees from backend
  const loadMerchantFees = useCallback(async () => {
    setMerchantFeesLoading(true)
    setMerchantFeesError(null)

    try {
      const data = await getMerchantFees()
      setMerchantFees(data)
    } catch (error) {
      // Backend failure → clear data and show error
      setMerchantFees([])
      setMerchantFeesError(getReportErrorMessage(error).message)
    } finally {
      setMerchantFeesLoading(false)
    }
  }, [])


  // Load customer dues from backend
  const loadCustomerDues = useCallback(async () => {
    setCustomerDuesLoading(true)
    setCustomerDuesError(null)

    try {
      const data = await getCustomerDues()
      setCustomerDues(data)
    } catch (error) {
      // Backend failure → clear data and show error
      setCustomerDues([])
      setCustomerDuesError(getReportErrorMessage(error).message)
    } finally {
      setCustomerDuesLoading(false)
    }
  }, [])


  // Load customers who reached their credit limit
  const loadCreditLimit = useCallback(async () => {
    setCreditLimitLoading(true)
    setCreditLimitError(null)

    try {
      const data = await getCreditLimit()
      setCreditLimitCustomers(data)
    } catch (error) {
      // Backend failure → clear data and show error
      setCreditLimitCustomers([])
      setCreditLimitError(getReportErrorMessage(error).message)
    } finally {
      setCreditLimitLoading(false)
    }
  }, [])


  // Load total dues from backend
  const loadTotalDues = useCallback(async () => {
    setTotalDuesLoading(true)
    setTotalDuesError(null)

    try {
      const data = await getTotalDues()
      setTotalDues(data.total_dues)
    } catch (error) {
      // Backend failure → clear value and show error
      setTotalDues(null)
      setTotalDuesError(getReportErrorMessage(error).message)
    } finally {
      setTotalDuesLoading(false)
    }
  }, [])


  // Main function: load all four report sections
  const loadAllReports = useCallback(async () => {
    await Promise.all([
      loadMerchantFees(),
      loadCustomerDues(),
      loadCreditLimit(),
      loadTotalDues(),
    ])
  }, [loadCreditLimit, loadCustomerDues, loadMerchantFees, loadTotalDues])


  // Load all report data when the page opens
  useEffect(() => {
    void loadAllReports()
  }, [loadAllReports])


  // Refresh button: load all report data again
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

      {/* Reports page header and refresh button */}
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


        {/* Refresh all reports */}
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


      {/* Total dues section */}
      <Card title="Total Dues" padding="md">

        {/* Show error if total dues API fails */}
        {totalDuesError ? (
          <Alert
            variant="error"
            title="Failed to load"
            message={totalDuesError}
          />
        ) : null}


        {/* Show loading while getting total dues */}
        {totalDuesLoading ? (
          <p className="text-sm text-text-muted">
            Loading total dues...
          </p>

        ) : totalDuesError ? null : (

          // Show total dues after successful API response
          <p className="text-2xl font-semibold text-text">
            {formatMoney(totalDues)}
          </p>
        )}

      </Card>


      {/* Merchant fees section */}
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


      {/* Customer dues section */}
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


      {/* Customers who reached their credit limit */}
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