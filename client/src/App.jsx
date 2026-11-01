import { lazy, Suspense, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Container from './components/Container'
import Home from './pages/Home'
import Redirect from './pages/Redirect'
import Auth from './pages/Auth'
import Events from './pages/Events'
import Archive from './pages/Archive'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

// Heavy pages (PDF renderer, admin tooling) load on demand.
const VerifyCertificate = lazy(() => import('./pages/Certificate/VerifyCertificate'))
const Admin = lazy(() => import('./pages/Admin/Admin'))
const PageFallback = () => <div className='wrap page-top'><div className='card h-64 skeleton' /></div>
import { useLoginStore } from './store/useAuthStore'
import { SpeedInsights } from '@vercel/speed-insights/react'

function App () {
  const location = useLocation()
  const { loadUser } = useLoginStore()

  useEffect(() => {
    if (location.pathname !== '/auth') loadUser()
  }, [location.pathname])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Container>
      <Routes>
        <Route path='/auth' element={<Auth />} />
        <Route path='/' element={<Home />} />
        <Route path='/events' element={<Events />} />
        <Route path='/archive' element={<Archive />} />
        <Route path='/gallery' element={<Gallery />} />
        <Route path='/team' element={<Team />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/admin' element={<Suspense fallback={<PageFallback />}><Admin /></Suspense>} />
        <Route path='/events/pokeprompt' element={<Redirect route='game' />} />
        <Route path='/events/latest' element={<Redirect route='latest' />} />
        <Route path='/cert/verify/:certificateID' element={<Suspense fallback={<PageFallback />}><VerifyCertificate /></Suspense>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Container>
  )
}

export default App
