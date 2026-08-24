import type { UserRole } from '../types'

interface MockJwtPayload {
  user_id: number
  email: string
  role: UserRole
}

/** Builds a decodable mock JWT for tests (not a real signed token). */
export function createMockJwt(payload: MockJwtPayload): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))

  return `${header}.${body}.test-signature`
}


// fake jwt