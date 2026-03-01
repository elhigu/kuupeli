import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'

describe('Story skip control', () => {
  it('allows advancing to next sentence without first solving the current sentence', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Starter Pack: 1/50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /skip sentence/i }))

    expect(screen.getByText('Starter Pack: 2/50')).toBeInTheDocument()
  })
})
