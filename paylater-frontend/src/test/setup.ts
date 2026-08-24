import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// After every test case
afterEach(() => {
  cleanup()
})

// Before every test case
beforeEach(() => {
  // Remove old login/user data
  localStorage.clear()

  // Reset all mocked functions
  vi.restoreAllMocks()
})