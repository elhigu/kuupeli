import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModelManagerPanel } from '../../../src/components/ModelManagerPanel'

vi.mock('../../../src/tts/playback', () => ({
  playSentenceAudioWithModel: vi.fn().mockResolvedValue(undefined)
}))

describe('ModelManagerPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders heading and supported speech model entries', async () => {
    render(<ModelManagerPanel />)

    expect(screen.getByRole('heading', { name: /model manager/i })).toBeInTheDocument()
    expect(screen.getByText(/manage local speech models used by kuupeli/i)).toBeInTheDocument()
    expect(await screen.findByText(/finnish starter small/i)).toBeInTheDocument()
    expect(screen.getByText(/finnish harri low \(piper\)/i)).toBeInTheDocument()
    expect(screen.getByText(/finnish harri medium \(piper\)/i)).toBeInTheDocument()
  })

  it('allows selecting voice type for installed bundled model', async () => {
    const user = userEvent.setup()
    render(<ModelManagerPanel />)

    const selector = await screen.findByRole('combobox', { name: /finnish starter small voice type/i })
    await user.selectOptions(selector, 'fi-female-3')

    expect(localStorage.getItem('kuupeli-model-voice-types')).toContain('fi-female-3')
  })

  it('shows recoverable guidance when storage read fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })

    render(<ModelManagerPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/browser storage is full/i)
  })
})
