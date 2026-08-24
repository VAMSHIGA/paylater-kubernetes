import {
  ArrowRight,
  BarChart3,
  IndianRupee,
  Percent,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { MetricCard } from '../../components/ui/MetricCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useMerchantDashboard } from '../../hooks/useMerchantDashboard'
import type { MerchantDashboard } from '../../types'
import { getDisplayName, getGreeting } from '../../utils/display'
import { formatMoney } from '../../utils/format'

function formatCommissionPercent(value: string | undefined): string {
  if (!value) {
    return '—'
  }

  return `${value}%`
}

function getAverageSale(totalSales: string, totalTransactions: number): string {
  if (totalTransactions === 0) {
    return '0.00'
  }

  return (Number(totalSales) / totalTransactions).toFixed(2)
}

function getMaxTransactionAmount(
  transactions: MerchantDashboard['RecentTransactions'],
): number {
  return transactions.reduce(
    (max, transaction) => Math.max(max, Number(transaction.Amount) || 0),
    0,
  )
}

export function MerchantDashboard() {
  const { user } = useAuth()
  const { dashboard, loading, error, refresh } = useMerchantDashboard()
  const displayName = getDisplayName(
    user?.email,
    dashboard?.MerchantName,
  )
  const hasSalesData =
    !loading && dashboard !== null && dashboard.TotalTransactions > 0
  const maxTransactionAmount = dashboard
    ? getMaxTransactionAmount(dashboard.RecentTransactions)
    : 0

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary-600">
          {getGreeting()}, {displayName} 👋
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Here&apos;s how your business is performing.
        </h1>
      </header>

      {error ? (
        <Alert
          variant="error"
          title="Unable to load your dashboard"
          message={error}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Transactions"
          value={dashboard?.TotalTransactions ?? 0}
          icon={BarChart3}
          accent="primary"
          loading={loading}
        />
        <MetricCard
          label="Total Sales"
          value={formatMoney(dashboard?.TotalSales ?? '0.00')}
          icon={IndianRupee}
          loading={loading}
        />
        <MetricCard
          label="Commission Rate"
          value={formatCommissionPercent(dashboard?.CommissionPercent)}
          icon={Percent}
          accent="warning"
          loading={loading}
        />
        <MetricCard
          label="PayLater Commission"
          value={formatMoney(dashboard?.PayLaterCommission ?? '0.00')}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="Merchant Earnings"
          value={formatMoney(dashboard?.MerchantEarnings ?? '0.00')}
          icon={Wallet}
          accent="success"
          loading={loading}
        />
        <MetricCard
          label="Total Commission"
          value={formatMoney(dashboard?.TotalCommission ?? '0.00')}
          icon={Percent}
          loading={loading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Business Performance</h2>
          <div
            className={`mt-5 flex min-h-[220px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 ${
              hasSalesData
                ? 'flex-col justify-center py-6'
                : 'items-center justify-center text-center'
            }`}
          >
            {loading ? (
              <SkeletonCard />
            ) : hasSalesData && dashboard ? (
              <div className="w-full space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-text-muted">Total Sales</p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {formatMoney(dashboard.TotalSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Transactions</p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {dashboard.TotalTransactions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Average Sale</p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {formatMoney(
                        getAverageSale(
                          dashboard.TotalSales,
                          dashboard.TotalTransactions,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {dashboard.RecentTransactions.map((transaction) => {
                    const amount = Number(transaction.Amount) || 0
                    const barWidth =
                      maxTransactionAmount > 0
                        ? Math.max((amount / maxTransactionAmount) * 100, 8)
                        : 0

                    return (
                      <div key={transaction.ID}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-text">
                            {transaction.CustomerName}
                          </span>
                          <span className="text-text-muted">
                            {formatMoney(transaction.Amount)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {transaction.TransactionDate}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="max-w-md text-sm text-text-muted">
                Sales analytics will appear here as transactions are recorded.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white shadow-[var(--shadow-premium)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Your Commission
          </p>
          <p className="mt-4 text-5xl font-bold tracking-tight">
            {loading
              ? '—'
              : formatCommissionPercent(dashboard?.CommissionPercent)}
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/70">PayLater Commission</p>
              <p className="mt-1 text-2xl font-bold">
                {loading
                  ? '—'
                  : formatMoney(dashboard?.PayLaterCommission ?? '0.00')}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/70">Your Earnings</p>
              <p className="mt-1 text-2xl font-bold">
                {loading
                  ? '—'
                  : formatMoney(dashboard?.MerchantEarnings ?? '0.00')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Recent Transactions</h2>
        </div>

        {loading ? (
          <SkeletonCard />
        ) : dashboard && dashboard.RecentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-text-muted">
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Commission</th>
                  <th className="px-3 py-3 font-medium">Merchant Earnings</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.RecentTransactions.map((transaction) => (
                  <tr
                    key={transaction.ID}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-3 py-3 text-text">
                      {transaction.CustomerName}
                    </td>
                    <td className="px-3 py-3 font-medium text-text">
                      {formatMoney(transaction.Amount)}
                    </td>
                    <td className="px-3 py-3 text-text">
                      {formatCommissionPercent(transaction.CommissionPercent)} (
                      {formatMoney(transaction.CommissionAmount)})
                    </td>
                    <td className="px-3 py-3 text-text">
                      {formatMoney(transaction.MerchantNetAmount)}
                    </td>
                    <td className="px-3 py-3 text-text-muted">
                      {transaction.TransactionDate}
                    </td>
                    <td className="px-3 py-3">
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
            icon={Store}
            title="No transactions yet"
            description="Customer purchases will appear here."
          />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: 'Merchant Profile',
            description: 'View your merchant profile and commission rate.',
            to: '/merchants',
          },
          {
            title: 'Settings',
            description: 'View account details and your Merchant ID.',
            to: '/settings',
          },
        ].map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold text-text">{action.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{action.description}</p>
            </div>
            <ArrowRight
              size={18}
              className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
            />
          </Link>
        ))}
      </section>

      {error ? (
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Try Again
        </Button>
      ) : null}
    </div>
  )
}
