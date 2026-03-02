import { logEvent } from '../observability/devLogger'

export interface ServiceWorkerRegisterTarget {
  register: (scriptUrl: string) => Promise<unknown>
}

export interface RegisterServiceWorkerOptions {
  isProduction: boolean
  serviceWorker?: ServiceWorkerRegisterTarget
  addLoadListener: (listener: () => void) => void
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
    logEvent('pwa', 'service_worker_registering', { script: '/sw.js' })
    void options.serviceWorker?.register('/sw.js')
  })

  logEvent('pwa', 'service_worker_listener_attached')
  return true
}
