import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { logError, logEvent } from './observability/devLogger'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import './styles.css'

const container = document.getElementById('root')

if (!container) {
  logError('app_boot', 'root_container_missing', new Error('Root container not found'))
  throw new Error('Root container not found')
}

logEvent('app_boot', 'starting_render')

registerServiceWorker({
  isProduction: import.meta.env.PROD,
  serviceWorker: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
  addLoadListener: (listener) => window.addEventListener('load', listener)
})

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

logEvent('app_boot', 'rendered')
