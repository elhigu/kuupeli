import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'

describe('App shell', () => {
  it('renders Kuupeli app shell heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /kuupeli/i })).toBeInTheDocument()
  })
})
