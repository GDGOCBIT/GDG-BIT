import { useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Navbar } from './Navbar'
import Footer from './Footer'
import { useThemeStore } from '../store/useThemeStore'
import GlitchBackground from './GlitchBackground'

// Page shell: navbar + content + footer (the auth page is full-screen on its own).
const Container = ({ children }) => {
  const { pathname } = useLocation()
  const theme = useThemeStore(s => s.theme)
  const bare = pathname === '/auth'

  return (
    <>
      <Toaster theme={theme} richColors closeButton duration={5000} position='top-center' />
      <a href='#main' className='sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn btn-ink btn-sm'>
        Skip to content
      </a>
      {!bare && <GlitchBackground />}
      {!bare && <Navbar />}
      <main id='main' className='min-h-[70vh] overflow-x-clip'>{children}</main>
      {!bare && <Footer />}
    </>
  )
}

export default Container
