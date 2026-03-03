import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/routes/AppRoutes'

describe('App routes', () => {
  it('renders stories route heading', () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Stories' })).toBeInTheDocument()
  })
})
