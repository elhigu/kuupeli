import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModelManagerPanel } from '../../../src/components/ModelManagerPanel'

describe('ModelManagerPanel', () => {
  it('renders catalog entries and manager heading', async () => {
    render(<ModelManagerPanel />)

    expect(screen.getByRole('heading', { name: /model manager/i })).toBeInTheDocument()
    expect(await screen.findByText(/finnish starter small/i)).toBeInTheDocument()
  })
})
