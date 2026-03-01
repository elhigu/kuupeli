import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import './styles.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container not found')
}

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
