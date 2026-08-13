export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 17) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

export function getDisplayName(email?: string, name?: string): string {
  if (name?.trim()) {
    return name.trim()
  }

  if (!email) {
    return 'there'
  }

  const localPart = email.split('@')[0] ?? ''
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim()

  if (!cleaned) {
    return 'there'
  }

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getCreditUsagePercent(used: string, limit: string): number {
  const usedValue = Number(used)
  const limitValue = Number(limit)

  if (!limitValue || limitValue <= 0 || Number.isNaN(usedValue)) {
    return 0
  }

  return Math.min(100, Math.round((usedValue / limitValue) * 100))
}

export function formatRoleLabel(role?: string): string {
  if (!role) {
    return 'User'
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}
