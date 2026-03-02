import { afterEach, describe, expect, it, vi } from 'vitest'
import { logError, logEvent, setDevLoggingEnabled } from '../../src/observability/devLogger'

describe('Dev logger', () => {
  afterEach(() => {
    setDevLoggingEnabled(true)
    vi.restoreAllMocks()
  })

  it('logs events when dev logging is enabled', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    setDevLoggingEnabled(true)

    logEvent('app', 'started', { version: '0.1.0' })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy).toHaveBeenCalledWith('[Kuupeli][app] started', { version: '0.1.0' })
  })

  it('skips event logs when dev logging is disabled', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    setDevLoggingEnabled(false)

    logEvent('app', 'started', { version: '0.1.0' })

    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('logs error details when dev logging is enabled', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    setDevLoggingEnabled(true)

    logError('audio', 'failed', new Error('No voices'))

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('[Kuupeli][audio] failed', {
      error: 'No voices'
    })
  })
})
