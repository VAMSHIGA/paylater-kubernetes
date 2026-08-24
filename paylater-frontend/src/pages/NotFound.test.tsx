import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { NotFound } from './NotFound'

describe('NotFound', () => {

  // Test Case 1:
  // Check that the 404 page is displayed correctly.
  //
  // Example:
  // User enters a wrong URL
  //        ↓
  // NotFound page opens
  //        ↓
  // Shows "404"
  // Shows "Page Not Found"
  it('renders 404 UI', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('404'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Page Not Found',
      }),
    ).toBeInTheDocument()
  })


  // Test Case 2:
  // Check that the "Back to Dashboard" button works.
  //
  // Example:
  // User is on the wrong/missing page
  //        ↓
  // Click "Back to Dashboard"
  //        ↓
  // Dashboard Home is displayed
  it('navigates back to dashboard when button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/missing']}>
        <Routes>

          {/* 404 / missing page */}
          <Route
            path="/missing"
            element={<NotFound />}
          />

          {/* Dashboard page */}
          <Route
            path="/"
            element={<div>Dashboard Home</div>}
          />

        </Routes>
      </MemoryRouter>,
    )

    // User clicks the "Back to Dashboard" button
    await user.click(
      screen.getByRole('button', {
        name: 'Back to Dashboard',
      }),
    )

    // Check that the Dashboard page is displayed
    expect(
      screen.getByText('Dashboard Home'),
    ).toBeInTheDocument()
  })
})