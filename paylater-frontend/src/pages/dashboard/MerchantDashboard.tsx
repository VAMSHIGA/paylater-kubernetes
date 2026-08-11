import { Card } from '../../components/ui/Card'

const overviewSections = [
  {
    title: 'Transactions',
    description:
      'Merchant transaction activity will appear here when the transactions module is connected.',
  },
  {
    title: 'Sales',
    description:
      'Sales summaries will appear here when reporting data is available for your account.',
  },
  {
    title: 'Commission',
    description:
      'Commission details will appear here when merchant reporting is connected.',
  },
  {
    title: 'Paybacks',
    description:
      'Customer payback activity related to your merchant account will appear here in a future step.',
  },
]

export function MerchantDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Merchant
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Your merchant overview. Data will load from the API when modules are
          connected.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {overviewSections.map((section) => (
          <Card key={section.title} title={section.title} padding="md">
            <p className="text-sm text-text-muted">{section.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
