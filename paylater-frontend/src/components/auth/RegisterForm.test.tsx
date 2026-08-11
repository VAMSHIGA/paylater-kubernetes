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

    const options = screen.getAllByRole('option').map((option) => option.textContent)

    expect(options).toEqual(['Customer', 'Merchant'])
    expect(screen.queryByRole('option', { name: 'Admin' })).toBeNull()
  })
})
