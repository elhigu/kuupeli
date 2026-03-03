import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/routes/AppRoutes'

describe('Stories page', () => {
  it('shows story management controls on /stories and not on /play', () => {
    const storiesView = render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /stories/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/import file/i)).toBeInTheDocument()

    storiesView.unmount()

    render(
      <MemoryRouter initialEntries={['/play']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.queryByLabelText(/import file/i)).not.toBeInTheDocument()
  })
})
