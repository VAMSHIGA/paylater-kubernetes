import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'

const overviewSections: Array<{
  title: string
  description: string
  to?: string
}> = [
  {
    title: 'PayLater Limit',
    description:
      'Your credit limit will appear here when customer account data is connected.',
  },
  {
    title: 'Used Limit',
    description:
      'Amount used from your PayLater limit will appear here when account data is available.',
  },
  {
    title: 'Available Limit',
    description:
      'Remaining available credit will appear here when account data is available.',
  },
  {
    title: 'Transactions',
    description: 'Record a new PayLater purchase.',
    to: '/transactions',
  },
  {
    title: 'Paybacks',
    description: 'Record a new customer repayment.',
    to: '/paybacks',
  },
]

export function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Customer
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Your PayLater account overview. Data will load from the API when
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
