import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { NotFound } from './NotFound'

describe('NotFound', () => {
  it('renders 404 UI', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Page Not Found' }),
    ).toBeInTheDocument()
  })

  it('navigates back to dashboard when button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/missing']}>
        <Routes>
          <Route path="/missing" element={<NotFound />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }))

    expect(screen.getByText('Dashboard Home')).toBeInTheDocument()
  })
})
