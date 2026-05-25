import { useEffect, useState } from 'react'
import { Landing } from './pages/Landing'
import { TimerApp } from './pages/TimerApp'

type Route = 'landing' | 'app'

function routeFromPath(path: string): Route {
  return path.startsWith('/app') ? 'app' : 'landing'
}

export function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: Route) => {
    const path = to === 'app' ? '/app' : '/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setRoute(to)
  }

  return route === 'app' ? <TimerApp onExit={() => navigate('landing')} /> : <Landing onLaunch={() => navigate('app')} />
}
