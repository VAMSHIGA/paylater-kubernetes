import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'

const overviewSections: Array<{
  title: string
  description: string
  to?: string
}> = [
  {
    title: 'Customers',
    description: 'Manage customer accounts and credit limits.',
    to: '/customers',
  },
  {
    title: 'Merchants',
    description: 'Onboard merchants and manage commission settings.',
    to: '/merchants',
  },
  {
    title: 'Transactions',
    description: 'Record PayLater purchases for customers and merchants.',
    to: '/transactions',
  },
  {
    title: 'Paybacks',
    description: 'Record customer repayments against PayLater balances.',
    to: '/paybacks',
  },
  {
    title: 'Reports',
    description: 'View merchant fees, customer dues, credit limits, and total dues.',
    to: '/reports',
  },
  {
    title: 'Commission',
    description:
      'Merchant commission summaries will appear here when reporting is connected.',
  },
]

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          PayLater administration overview. Metrics will load from the API when
          modules are connected.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overviewSections.map((section) => (
          <Card key={section.title} title={section.title} padding="md">
            <p className="text-sm text-text-muted">{section.description}</p>
            {section.to ? (
              <Link
                to={section.to}
                className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
              >
                View {section.title.toLowerCase()}
              </Link>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}
