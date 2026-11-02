import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Container from './components/Container'
import Home from './pages/Home'
import Redirect from './pages/Redirect'

// Only the home page ships in the first bundle; every other route (and the PDF / admin tooling) loads on demand.
const Auth = lazy(() => import('./pages/Auth'))
const Events = lazy(() => import('./pages/Events'))
const Archive = lazy(() => import('./pages/Archive'))
const Team = lazy(() => import('./pages/Team'))
const Members = lazy(() => import('./pages/Members'))
const Member = lazy(() => import('./pages/Member'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Projects = lazy(() => import('./pages/Projects'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))
const VerifyCertificate = lazy(() => import('./pages/Certificate/VerifyCertificate'))
const Admin = lazy(() => import('./pages/Admin/Admin'))
const Telemetry = lazy(() => import('./components/Telemetry'))
const PageFallback = () => <div className='wrap page-top'><div className='card h-64 skeleton' /></div>
import { useLoginStore } from './store/useAuthStore'

function App () {
  const location = useLocation()
  const { loadUser } = useLoginStore()
  const [idle, setIdle] = useState(false) // analytics load only after the page has settled

  useEffect(() => {
    const go = () => setIdle(true)
    if ('requestIdleCallback' in window) { const id = requestIdleCallback(go, { timeout: 4000 }); return () => cancelIdleCallback(id) }
    const t = setTimeout(go, 2500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/auth') loadUser()
  }, [location.pathname])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Container>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path='/auth' element={<Auth />} />
        <Route path='/' element={<Home />} />
        <Route path='/events' element={<Events />} />
        <Route path='/archive' element={<Archive />} />
        <Route path='/gallery' element={<Gallery />} />
        <Route path='/team' element={<Team />} />
        <Route path='/members' element={<Members />} />
        <Route path='/members/:id' element={<Member />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/events/pokeprompt' element={<Redirect route='game' />} />
        <Route path='/events/latest' element={<Redirect route='latest' />} />
        <Route path='/cert/verify/:certificateID' element={<VerifyCertificate />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      </Suspense>
      {idle && <Suspense fallback={null}><Telemetry /></Suspense>}
    </Container>
  )
}

export default App
