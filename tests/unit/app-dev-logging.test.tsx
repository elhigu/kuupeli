import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { STARTER_SENTENCES } from '../../src/data/starterSentences'
import { setDevLoggingEnabled } from '../../src/observability/devLogger'

describe('App development logging', () => {
  beforeEach(() => {
    setDevLoggingEnabled(true)
  })

  afterEach(() => {
    setDevLoggingEnabled(false)
    vi.restoreAllMocks()
  })

  it('includes current sentence text in round loaded logs', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    render(<App />)

    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith(
        '[Kuupeli][round] loaded',
        expect.objectContaining({
          sentenceIndex: 0,
          sentence: STARTER_SENTENCES[0]
        })
      )
    })
  })
})
