import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { RegisterForm } from './RegisterForm'

vi.mock('../../services/authService', () => ({
  register: vi.fn(),
  getRegisterErrorMessage: vi.fn(),
}))

describe('RegisterForm', () => {
  it('does not offer admin as a public registration role', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Customer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Merchant/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Admin/i })).toBeNull()
  })
})
