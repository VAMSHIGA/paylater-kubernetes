import {
  ArrowRight,
  CreditCard,
  Receipt,
  Settings,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { MetricCard } from '../../components/ui/MetricCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import {
  getPaybackErrorMessage,
  listPaybacks,
} from '../../services/paybackService'
import {
  getTransactionErrorMessage,
  listTransactions,
} from '../../services/transactionService'
import type { Payback, Transaction } from '../../types'
import { getCreditUsagePercent, getDisplayName, getGreeting } from '../../utils/display'
import { formatMoney } from '../../utils/format'

export function CustomerDashboard() {
  const { user } = useAuth()
  const { profile, loading, error, refresh } = useCustomerProfile()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paybacks, setPaybacks] = useState<Payback[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)

  const outstandingDue = profile?.OutstandingDue ?? '0.00'
  const availableCredit =
    profile?.AvailableCredit ??
    (profile?.CreditLimit ? profile.CreditLimit : '0.00')
  const creditLimit = profile?.CreditLimit ?? '0.00'
  const usagePercent = getCreditUsagePercent(outstandingDue, creditLimit)
  const displayName = getDisplayName(user?.email, profile?.Name)

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    setActivityError(null)

    try {
      const [transactionData, paybackData] = await Promise.all([
        listTransactions(),
        listPaybacks(),
      ])

      setTransactions(transactionData)
      setPaybacks(paybackData)
    } catch (nextError) {
      setTransactions([])
      setPaybacks([])
      setActivityError(
        getTransactionErrorMessage(nextError).message ||
          getPaybackErrorMessage(nextError).message,
      )
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary-600">
          {getGreeting()}, {displayName} 👋
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Here&apos;s your PayLater overview.
        </h1>
      </header>

      {error ? (
        <Alert
          variant="error"
          title="Unable to load your dashboard"
          message={error}
        />
      ) : null}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-primary-800 to-primary-700 p-6 text-white shadow-[var(--shadow-premium)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              PayLater Limit
            </p>
            {loading ? (
              <div className="mt-4 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
            ) : (
              <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {formatMoney(creditLimit)}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/70">Available Limit</p>
              <p className="mt-1 text-2xl font-bold">
                {loading ? '—' : formatMoney(availableCredit)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/70">Used</p>
              <p className="mt-1 text-2xl font-bold">
                {loading ? '—' : formatMoney(outstandingDue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm text-white/80">
            <span>Used Credit / Credit Limit</span>
            <span>{loading ? '—' : `${usagePercent}%`}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-primary-200 transition-all duration-500"
              style={{ width: loading ? '0%' : `${usagePercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Available Limit"
          value={formatMoney(availableCredit)}
          hint="Ready to spend"
          icon={Wallet}
          accent="success"
          loading={loading}
        />
        <MetricCard
          label="Outstanding Due"
          value={formatMoney(outstandingDue)}
          hint="Amount to repay"
          icon={CreditCard}
          accent="warning"
          loading={loading}
        />
        <MetricCard
          label="Total Transactions"
          value={activityLoading ? '—' : transactions.length}
          hint="PayLater purchases"
          icon={Receipt}
          accent="primary"
          loading={activityLoading}
        />
        <MetricCard
          label="Total Paybacks"
          value={activityLoading ? '—' : paybacks.length}
          hint="Repayments made"
          icon={ShoppingBag}
          loading={activityLoading}
        />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text">Your PayLater Overview</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Credit Limit', formatMoney(creditLimit)],
            ['Used Credit', formatMoney(outstandingDue)],
            ['Available Credit', formatMoney(availableCredit)],
            ['Outstanding Due', formatMoney(outstandingDue)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <p className="text-sm text-text-muted">{label}</p>
              <p className="mt-2 text-xl font-bold text-text">
                {loading ? 'Loading...' : value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>

          {activityLoading ? (
            <SkeletonCard />
          ) : activityError ? (
            <Alert variant="error" message={activityError} />
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-text-muted">
                    <th className="px-2 py-3 font-medium">Merchant</th>
                    <th className="px-2 py-3 font-medium">Amount</th>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr
                      key={transaction.ID}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-2 py-3 text-text">
                        Merchant #{transaction.MerchantID}
                      </td>
                      <td className="px-2 py-3 font-medium text-text">
                        {formatMoney(transaction.Amount)}
                      </td>
                      <td className="px-2 py-3 text-text-muted">
                        {transaction.TransactionDate}
                      </td>
                      <td className="px-2 py-3">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Your PayLater purchases will appear here."
              action={
                <Link to="/transactions">
                  <Button type="button">Make Purchase</Button>
                </Link>
              }
            />
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">Recent Paybacks</h2>
            <Link
              to="/paybacks"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>

          {activityLoading ? (
            <SkeletonCard />
          ) : activityError ? (
            <Alert variant="error" message={activityError} />
          ) : paybacks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-text-muted">
                    <th className="px-2 py-3 font-medium">Amount</th>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paybacks.slice(0, 5).map((payback) => (
                    <tr
                      key={payback.ID}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-2 py-3 font-medium text-text">
                        {formatMoney(payback.Amount)}
                      </td>
                      <td className="px-2 py-3 text-text-muted">
                        {payback.PaymentDate}
                      </td>
                      <td className="px-2 py-3">
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No paybacks yet"
              description="Your repayments will appear here."
              action={
                <Link to="/paybacks">
                  <Button type="button">Make Payback</Button>
                </Link>
              }
            />
          )}
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Make Purchase', to: '/transactions', icon: ShoppingBag },
          { title: 'Make Payback', to: '/paybacks', icon: CreditCard },
          { title: 'Transactions', to: '/transactions', icon: Receipt },
          { title: 'Settings', to: '/settings', icon: Settings },
        ].map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.title}
              to={action.to}
              className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="font-semibold text-text">{action.title}</span>
              </div>
              <ArrowRight
                size={18}
                className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
              />
            </Link>
          )
        })}
      </section>

      {error ? (
        <div>
          <Button type="button" variant="outline" onClick={() => void refresh()}>
            Try Again
          </Button>
        </div>
      ) : null}
    </div>
  )
}
