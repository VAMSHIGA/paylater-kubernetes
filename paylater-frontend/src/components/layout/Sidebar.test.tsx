import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from './Sidebar'
import { createMockAuthValue, renderWithAuthContext } from '../../test/render'
import type { UserRole } from '../../types'

function renderSidebarForRole(role: UserRole) {
  return renderWithAuthContext(
    <Sidebar onLogout={vi.fn()} />,
    createMockAuthValue({
      isAuthenticated: true,
      user: { userId: 1, email: `${role}@test.example`, role },
      token: 'token',
    }),
  )
}

function expectNavLinks(labels: string[]) {
  for (const label of labels) {
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
  }
}

function expectNoNavLink(label: string) {
  expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument()
}

describe('Sidebar', () => {
  it('renders admin navigation links', () => {
    renderSidebarForRole('admin')

    expectNavLinks([
      'Dashboard',
      'Customers',
      'Merchants',
      'Transactions',
      'Paybacks',
      'Reports',
      'Settings',
    ])
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  it('renders customer navigation links', () => {
    renderSidebarForRole('customer')

    expectNavLinks(['Dashboard', 'Transactions', 'Paybacks', 'Settings'])
    expectNoNavLink('Customers')
    expectNoNavLink('Merchants')
    expectNoNavLink('Reports')
  })

  it('renders merchant navigation links', () => {
    renderSidebarForRole('merchant')

    expectNavLinks(['Dashboard', 'Merchant Profile', 'Settings'])
    expectNoNavLink('Customers')
    expectNoNavLink('Transactions')
    expectNoNavLink('Paybacks')
    expectNoNavLink('Reports')
  })
})
