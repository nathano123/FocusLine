import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { setUserPropertiesOnce, setUserProperties, track } from './lib/track'
import './index.css'

const APP_VERSION = '1.0.0'

setUserPropertiesOnce({
  first_seen_at: new Date().toISOString(),
  first_seen_referrer: document.referrer || '(direct)',
  first_seen_path: window.location.pathname,
  first_seen_app_version: APP_VERSION,
})
setUserProperties({
  last_seen_at: new Date().toISOString(),
  app_version: APP_VERSION,
  display_mode: window.matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'browser',
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

track('app_loaded', {
  path: window.location.pathname,
  display_mode: window.matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'browser',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
