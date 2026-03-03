import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { logError, logEvent } from './observability/devLogger'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { AppRoutes } from './routes/AppRoutes'
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
  addLoadListener: (listener) => window.addEventListener('load', listener),
  baseUrl: import.meta.env.BASE_URL
})

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
)

logEvent('app_boot', 'rendered')
