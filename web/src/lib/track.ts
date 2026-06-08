// Minimal PostHog wrapper that uses the globally-loaded `window.posthog`
// from the script tag in index.html. No npm dependency on posthog-js.
//
// Privacy contract: never send raw user content. Use `*_length`, `has_*`
// counters, or category strings — never the intention text or task title.

type PostHogGlobal = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  register: (props: Record<string, unknown>) => void
  identify?: (id: string, props?: Record<string, unknown>) => void
  people?: { set: (props: Record<string, unknown>) => void; set_once?: (props: Record<string, unknown>) => void }
}

declare global {
  interface Window {
    posthog?: PostHogGlobal
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  try {
    window.posthog?.capture(event, properties)
  } catch { /* analytics must never break the app */ }
}

export function registerContext(props: Record<string, unknown>): void {
  try {
    window.posthog?.register(props)
  } catch { /* ignore */ }
}

export function setUserProperties(props: Record<string, unknown>): void {
  try {
    window.posthog?.people?.set(props)
  } catch { /* ignore */ }
}

export function setUserPropertiesOnce(props: Record<string, unknown>): void {
  try {
    window.posthog?.people?.set_once?.(props)
  } catch { /* ignore */ }
}

export function trackPageview(path: string): void {
  try {
    window.posthog?.capture('$pageview', {
      $current_url: window.location.href,
      path,
    })
  } catch { /* ignore */ }
}
