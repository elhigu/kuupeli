import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/routes/AppRoutes'

describe('Route view separation', () => {
  it('keeps play route focused on gameplay only', () => {
    render(
      <MemoryRouter initialEntries={['/play']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/import file/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /model manager/i })).not.toBeInTheDocument()
  })

  it('shows story import controls on stories route', () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Stories' })).toBeInTheDocument()
    expect(screen.getByLabelText(/import file/i)).toBeInTheDocument()
  })

  it('shows model management on models route', () => {
    render(
      <MemoryRouter initialEntries={['/models']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /models/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /model manager/i })).toBeInTheDocument()
  })
})
