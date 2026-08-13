const PROFILE_KEY = 'paylater_domain_profile'

export interface DomainProfile {
  customerId?: number
  merchantId?: number
}

type ProfileStore = Record<string, DomainProfile>

function readStore(): ProfileStore {
  const raw = localStorage.getItem(PROFILE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as ProfileStore
  } catch {
    return {}
  }
}

function writeStore(store: ProfileStore): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(store))
}

export function getDomainProfile(email: string): DomainProfile {
  return readStore()[email] ?? {}
}

export const PROFILE_UPDATED_EVENT = 'paylater-profile-updated'

function notifyProfileUpdated(): void {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

export function saveDomainProfile(
  email: string,
  profile: DomainProfile,
): DomainProfile {
  const store = readStore()
  const current = store[email] ?? {}
  const next: DomainProfile = { ...current, ...profile }

  if (next.customerId === undefined) {
    delete next.customerId
  }

  if (next.merchantId === undefined) {
    delete next.merchantId
  }

  store[email] = next
  writeStore(store)
  notifyProfileUpdated()

  return next
}

export function clearDomainProfile(email: string): void {
  const store = readStore()

  delete store[email]
  writeStore(store)
}
