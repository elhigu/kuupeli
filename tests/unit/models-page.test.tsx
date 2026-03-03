import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/routes/AppRoutes'

describe('Models page', () => {
  it('shows model manager only on /models', () => {
    const modelsView = render(
      <MemoryRouter initialEntries={['/models']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /models/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /model manager/i })).toBeInTheDocument()

    modelsView.unmount()

    render(
      <MemoryRouter initialEntries={['/play']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.queryByRole('heading', { name: /model manager/i })).not.toBeInTheDocument()
  })
})
