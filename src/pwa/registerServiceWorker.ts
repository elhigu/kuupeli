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
    return false
  }

  options.addLoadListener(() => {
    void options.serviceWorker?.register('/sw.js')
  })

  return true
}
