import { logError, logEvent } from '../observability/devLogger'

export interface ServiceWorkerRegisterTarget {
  register: (scriptUrl: string) => Promise<unknown>
}

export interface RegisterServiceWorkerOptions {
  isProduction: boolean
  serviceWorker?: ServiceWorkerRegisterTarget
  addLoadListener: (listener: () => void) => void
  baseUrl?: string
}

function normalizeBaseUrl(rawBaseUrl: string): string {
  if (!rawBaseUrl) {
    return '/'
  }

  return rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`
}

function serviceWorkerScriptFor(baseUrl?: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl ?? '/')
  return `${normalizedBase}sw.js`
}

export function registerServiceWorker(options: RegisterServiceWorkerOptions): boolean {
  if (!options.isProduction || !options.serviceWorker) {
    logEvent('pwa', 'service_worker_skipped', {
      isProduction: options.isProduction,
      hasServiceWorker: Boolean(options.serviceWorker)
    })
    return false
  }

  options.addLoadListener(() => {
    const scriptUrl = serviceWorkerScriptFor(options.baseUrl)
    logEvent('pwa', 'service_worker_registering', { script: scriptUrl })
    void options.serviceWorker
      ?.register(scriptUrl)
      .then(() => {
        logEvent('pwa', 'service_worker_registered', { script: scriptUrl })
      })
      .catch((error) => {
        logError('pwa', 'service_worker_registration_failed', error, { script: scriptUrl })
      })
  })

  logEvent('pwa', 'service_worker_listener_attached')
  return true
}
