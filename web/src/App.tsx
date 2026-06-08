import { useEffect, useState } from 'react'
import { Landing } from './pages/Landing'
import { TimerApp } from './pages/TimerApp'
import { trackPageview, track } from './lib/track'

type Route = 'landing' | 'app'

function routeFromPath(path: string): Route {
  return path.startsWith('/app') ? 'app' : 'landing'
}

export function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    trackPageview(window.location.pathname)
  }, [])

  useEffect(() => {
    const onPop = () => {
      const next = routeFromPath(window.location.pathname)
      setRoute(next)
      trackPageview(window.location.pathname)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: Route, source?: string) => {
    const path = to === 'app' ? '/app' : '/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      trackPageview(path)
    }
    if (to === 'app') {
      track('launch_app_clicked', { source: source ?? 'unknown' })
    }
    setRoute(to)
  }

  return route === 'app'
    ? <TimerApp onExit={() => navigate('landing')} />
    : <Landing onLaunch={(source?: string) => navigate('app', source)} />
}
