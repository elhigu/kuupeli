type LogDetails = Record<string, unknown>

const DEFAULT_ENABLED =
  typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV) && import.meta.env?.MODE !== 'test'
let devLoggingEnabled = DEFAULT_ENABLED

export function setDevLoggingEnabled(enabled: boolean) {
  devLoggingEnabled = enabled
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown error'
}

export function logEvent(scope: string, action: string, details: LogDetails = {}) {
  if (!devLoggingEnabled) {
    return
  }

  console.info(`[Kuupeli][${scope}] ${action}`, details)
}

export function logError(scope: string, action: string, error: unknown, details: LogDetails = {}) {
  if (!devLoggingEnabled) {
    return
  }

  console.error(`[Kuupeli][${scope}] ${action}`, {
    ...details,
    error: normalizeError(error)
  })
}
