import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Receipt,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { MetricCard } from '../../components/ui/MetricCard'
import { getCustomers } from '../../services/customerService'
import {
  getCreditLimit,
  getMerchantFees,
  getReportErrorMessage,
  getTotalDues,
} from '../../services/reportService'
import { getGreeting } from '../../utils/display'
import { formatMoney } from '../../utils/format'

const quickLinks: Array<{
  title: string
  description: string
  to: string
  icon: typeof Users
}> = [
  {
    title: 'Customers',
    description: 'Manage customer accounts and credit limits.',
    to: '/customers',
    icon: Users,
  },
  {
    title: 'Merchants',
    description: 'Onboard merchants and manage commission settings.',
    to: '/merchants',
    icon: Store,
  },
  {
    title: 'Transactions',
    description: 'Record PayLater purchases for customers and merchants.',
    to: '/transactions',
    icon: Receipt,
  },
  {
    title: 'Paybacks',
    description: 'Record customer repayments against PayLater balances.',
    to: '/paybacks',
    icon: CreditCard,
  },
  {
    title: 'Reports',
    description: 'View merchant fees, customer dues, and credit limits.',
    to: '/reports',
    icon: BarChart3,
  },
]

export function AdminDashboard() {
  const [totalDues, setTotalDues] = useState<string | null>(null)
  const [customerCount, setCustomerCount] = useState<number | null>(null)
  const [merchantCount, setMerchantCount] = useState<number | null>(null)
  const [customersAtLimit, setCustomersAtLimit] = useState<number | null>(null)
  const [totalCommission, setTotalCommission] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setError(null)

    try {
      const [totalDuesData, customers, merchantFees, creditLimitCustomers] =
        await Promise.all([
          getTotalDues(),
          getCustomers(),
          getMerchantFees(),
          getCreditLimit(),
        ])

      setTotalDues(totalDuesData.total_dues)
      setCustomerCount(customers.length)
      setMerchantCount(merchantFees.length)
      setCustomersAtLimit(creditLimitCustomers.length)
      setTotalCommission(
        merchantFees
          .reduce((sum, fee) => sum + Number(fee.Commission || 0), 0)
          .toFixed(2),
      )
    } catch (loadError) {
      setTotalDues(null)
      setCustomerCount(null)
      setMerchantCount(null)
      setCustomersAtLimit(null)
      setTotalCommission(null)
      setError(getReportErrorMessage(loadError).message)
    }
  }, [])

// Load dashboard data from the backend when the page opens
useEffect(() => {
  async function initialLoad() {
    // Show loading state
    setLoading(true)

    try {
      // Get dashboard data from the backend
      await loadDashboard()
    } finally {
      // Stop loading after API request finishes
      setLoading(false)
    }
  }

  void initialLoad()
}, [loadDashboard])


// Refresh button: load the latest dashboard data again
async function handleRefresh() {
  // Show refreshing state
  setRefreshing(true)

  try {
    // Get updated data from the backend
    await loadDashboard()
  } finally {
    // Stop refreshing after API request finishes
    setRefreshing(false)
  }
}
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary-600">
            {getGreeting()}, Admin 👋
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Here&apos;s your PayLater platform overview.
          </h1>
        </header>

        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          loading={refreshing}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <Alert variant="error" title="Unable to load dashboard" message={error} />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Customers"
          value={customerCount ?? '—'}
          hint="Registered PayLater customer accounts"
          icon={Users}
          accent="primary"
          loading={loading}
        />
        <MetricCard
          label="Total Merchants"
          value={merchantCount ?? '—'}
          hint="Merchants with fee reporting data"
          icon={Store}
          loading={loading}
        />
        <MetricCard
          label="Customers at Credit Limit"
          value={customersAtLimit ?? '—'}
          hint="Customers at or over their credit limit"
          icon={BarChart3}
          accent="warning"
          loading={loading}
        />
        <MetricCard
          label="Total Dues"
          value={formatMoney(totalDues)}
          hint="Outstanding platform dues"
          icon={Wallet}
          accent="warning"
          loading={loading}
        />
        <MetricCard
          label="PayLater Commission"
          value={formatMoney(totalCommission)}
          hint="Aggregated merchant commission totals"
          icon={CreditCard}
          accent="success"
          loading={loading}
        />
        <MetricCard
          label="Platform Health"
          value={error ? 'Attention' : 'Healthy'}
          hint="Live reporting status"
          icon={BarChart3}
          loading={loading}
        />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text">Platform Overview</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((section) => {
            const Icon = section.icon

            return (
              <Link
                key={section.title}
                to={section.to}
                className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-text">{section.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {section.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
        <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
        <p className="mt-2 text-sm text-text-muted">
          No recent activity. Platform events will appear here when available.
        </p>
      </section>
    </div>
  )
}
