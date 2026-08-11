import type { User, UserRole } from '../types'
import { createMockJwt } from './mock-jwt'

export function createTestUser(
  role: UserRole,
  overrides: Partial<User> = {},
): User {
  return {
    userId: overrides.userId ?? 1,
    email: overrides.email ?? `${role}@test.example`,
    role,
    ...overrides,
  }
}

export function seedAuthStorage(user: User, token?: string): string {
  const jwt =
    token ??
    createMockJwt({
      user_id: user.userId,
      email: user.email,
      role: user.role,
    })

  localStorage.setItem('paylater_token', jwt)
  localStorage.setItem('paylater_user', JSON.stringify(user))

  return jwt
}
