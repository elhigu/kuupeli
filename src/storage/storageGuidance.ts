const QUOTA_ERROR_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])
const UNAVAILABLE_ERROR_NAMES = new Set(['SecurityError', 'InvalidStateError'])

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown storage error'
}

export function classifyStorageError(error: unknown): 'quota' | 'unavailable' | 'unknown' {
  if (error instanceof DOMException && QUOTA_ERROR_NAMES.has(error.name)) {
    return 'quota'
  }

  if (error instanceof DOMException && UNAVAILABLE_ERROR_NAMES.has(error.name)) {
    return 'unavailable'
  }

  const normalizedMessage = asErrorMessage(error).toLowerCase()

  if (normalizedMessage.includes('quota')) {
    return 'quota'
  }

  if (normalizedMessage.includes('storage') && normalizedMessage.includes('disabled')) {
    return 'unavailable'
  }

  return 'unknown'
}

export function storageRecoveryGuidance(error: unknown): string {
  const kind = classifyStorageError(error)

  if (kind === 'quota') {
    return 'Browser storage is full. Free some storage or remove old Kuupeli data and try again.'
  }

  if (kind === 'unavailable') {
    return 'Browser storage is unavailable. Disable strict private mode or storage blocking, then retry.'
  }

  return 'Local storage operation failed. Reload and try again.'
}
