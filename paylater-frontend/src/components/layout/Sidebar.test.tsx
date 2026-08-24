import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from './Sidebar'

// Helper used to render Sidebar with authentication context
import {
  createMockAuthValue,
  renderWithAuthContext,
} from '../../test/render'

import type { UserRole } from '../../types'


// --------------------------------------------------
// Render Sidebar for a particular user role
// --------------------------------------------------
function renderSidebarForRole(role: UserRole) {
  return renderWithAuthContext(
    // Render Sidebar
    // onLogout is mocked because we don't want to
    // actually perform logout during the test
    <Sidebar onLogout={vi.fn()} />,

    // Create fake authentication information
    createMockAuthValue({
      isAuthenticated: true,

      // Fake logged-in user
      user: {
        userId: 1,
        email: `${role}@test.example`,
        role,
      },

      // Fake authentication token
      token: 'token',
    }),
  )
}


// --------------------------------------------------
// Check that required navigation links exist
// --------------------------------------------------
function expectNavLinks(labels: string[]) {
  for (const label of labels) {
    expect(
      screen.getByRole('link', { name: label }),
    ).toBeInTheDocument()
  }
}


// --------------------------------------------------
// Check that a navigation link does NOT exist
// --------------------------------------------------
function expectNoNavLink(label: string) {
  expect(
    screen.queryByRole('link', { name: label }),
  ).not.toBeInTheDocument()
}


// ==================================================
// Sidebar Tests
// ==================================================
describe('Sidebar', () => {


  // ------------------------------------------------
  // ADMIN USER
  // ------------------------------------------------
  it('renders admin navigation links', () => {

    // Render Sidebar as an admin user
    renderSidebarForRole('admin')

    // Admin should see all these navigation links
    expectNavLinks([
      'Dashboard',
      'Customers',
      'Merchants',
      'Transactions',
      'Paybacks',
      'Reports',
      'Settings',
    ])

    // Admin should also see Logout
    expect(
      screen.getByRole('button', { name: 'Logout' }),
    ).toBeInTheDocument()
  })


  // ------------------------------------------------
  // CUSTOMER USER
  // ------------------------------------------------
  it('renders customer navigation links including Admin Dashboard', () => {

    // Render Sidebar as a customer
    renderSidebarForRole('customer')

    // Customer can see these links
    //
    // IMPORTANT:
    // "Dashboard" is included here.
    // If your Dashboard route is the admin dashboard,
    // then the customer can see that Dashboard link.
    expectNavLinks([
      'Dashboard',
      'Transactions',
      'Paybacks',
      'Settings',
    ])

    // Customer should NOT see customer-management links
    expectNoNavLink('Customers')

    // Customer should NOT see merchant-management links
    expectNoNavLink('Merchants')

    // Customer should NOT see Reports
    expectNoNavLink('Reports')
  })


  // ------------------------------------------------
  // MERCHANT USER
  // ------------------------------------------------
  it('renders merchant navigation links', () => {

    // Render Sidebar as a merchant
    renderSidebarForRole('merchant')

    // Merchant navigation
    expectNavLinks([
      'Dashboard',
      'Merchant Profile',
      'Settings',
    ])

    // Merchant should not see customer management
    expectNoNavLink('Customers')

    // Merchant should not see transactions management
    expectNoNavLink('Transactions')

    // Merchant should not see paybacks
    expectNoNavLink('Paybacks')

    // Merchant should not see reports
    expectNoNavLink('Reports')
  })
})