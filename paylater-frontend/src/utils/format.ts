/**
 * Format monetary values from API strings for display.
 * Backend returns decimal amounts as strings (e.g. "4265.00").
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const parsed = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(parsed)) {
    return String(value)
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)
}
