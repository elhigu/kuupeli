import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportControls } from '../../../src/components/ImportControls'

describe('ImportControls', () => {
  it('forwards selected file via callback', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<ImportControls onSelect={onSelect} />)

    const file = new File(['Hello world'], 'story.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/import file/i)
    await user.upload(input, file)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(file)
  })
})
