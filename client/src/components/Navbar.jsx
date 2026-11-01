import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LuLayoutDashboard, LuLogIn, LuLogOut, LuMenu, LuUser, LuX } from 'react-icons/lu'
import { navData } from '../utils/navbar'
import { useAuthStore } from '../store/useAuthStore'
import ThemeToggle from './ThemeToggle'
import { Logo } from './Brand'

export const Navbar = () => {
  const { verifyLoading, user, setUser, setVerifySuccess } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const avatarRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    setAvatarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onDown = e => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    const onKey = e => {
      if (e.key === 'Escape') {
        setAvatarOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  const signOut = () => {
    localStorage.removeItem('login_token')
    setUser(null)
    setVerifySuccess(false)
    toast.success('Signed out')
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-full text-[0.95rem] font-medium transition-colors ${
      isActive ? 'bg-[var(--ink)] text-[var(--bg)]' : 'hover:bg-[var(--sunken)]'
    }`

  return (
    <header className='fixed top-0 inset-x-0 z-50 glass-bar'>
      <div className='wrap'>
        <nav className='h-16 flex items-center justify-between gap-2'>
          <Logo compact />

          <div className='hidden lg:flex items-center gap-1'>
            {navData.map(item => (
              <NavLink key={item.id} to={item.link} className={linkClass}>
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className='flex items-center gap-1.5'>
            <ThemeToggle />
            {verifyLoading && !user ? (
              <div className='w-11 h-11 rounded-full skeleton' />
            ) : !user ? (
              <Link to='/auth' className='btn btn-ink btn-sm max-sm:hidden'>
                <LuLogIn size={16} aria-hidden='true' /> Sign in
              </Link>
            ) : (
              <div className='relative' ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  aria-label='Account menu'
                  aria-expanded={avatarOpen}
                  className='w-11 h-11 rounded-full border-2 border-[var(--outline)] overflow-hidden bg-[var(--sunken)] block'
                >
                  <img src={user?.avatar?.url || '/user.svg'} alt='' className='w-full h-full object-cover' />
                </button>
                {avatarOpen && (
                  <div className='absolute right-0 mt-3 w-64 card p-2 flex flex-col shadow-[4px_4px_0_var(--outline)]'>
                    <div className='px-3 py-2.5 mb-1 border-b border-[var(--hairline)]'>
                      <p className='font-medium truncate'>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className='text-xs text-[var(--muted)] truncate'>{user.email}</p>
                    </div>
                    <Link to='/profile' className='px-3 py-2 rounded-xl hover:bg-[var(--sunken)] flex items-center gap-2.5'>
                      <LuUser size={18} aria-hidden='true' /> Your profile
                    </Link>
                    {user.isAdmin && (
                      <Link to='/admin' className='px-3 py-2 rounded-xl hover:bg-[var(--sunken)] flex items-center gap-2.5'>
                        <LuLayoutDashboard size={18} aria-hidden='true' /> Admin dashboard
                      </Link>
                    )}
                    <button onClick={signOut} className='px-3 py-2 rounded-xl hover:bg-[var(--sunken)] text-left flex items-center gap-2.5' style={{ color: 'var(--red)' }}>
                      <LuLogOut size={18} aria-hidden='true' /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              className='lg:hidden btn btn-ghost btn-icon'
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <LuX size={22} aria-hidden='true' /> : <LuMenu size={22} aria-hidden='true' />}
            </button>
          </div>
        </nav>
      </div>

      {menuOpen && (
        <div className='lg:hidden fixed inset-x-0 top-16 bottom-0 bg-[var(--bg)] overflow-y-auto'>
          <div className='wrap py-6 flex flex-col gap-2'>
            {[{ id: 'home', name: 'Home', link: '/' }, ...navData].map((item, i) => (
              <NavLink
                key={item.id}
                to={item.link}
                end={item.link === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between text-3xl py-3 border-b-2 border-[var(--hairline)] ${isActive ? 'font-bold' : ''}`
                }
              >
                {item.name}
                <span className='w-4 h-4 rounded-full border-2 border-[var(--outline)]'
                  style={{ background: ['var(--blue)', 'var(--red)', 'var(--yellow)', 'var(--green)', 'var(--blue)'][i] }} />
              </NavLink>
            ))}
            {!user ? (
              <Link to='/auth' className='btn btn-ink mt-6'>
                Sign in
              </Link>
            ) : (
              <div className='flex flex-col gap-2 mt-6'>
                <Link to='/profile' className='btn btn-ghost'>Your profile</Link>
                {user.isAdmin && <Link to='/admin' className='btn btn-ghost'>Admin dashboard</Link>}
                <button onClick={signOut} className='btn btn-danger'>Sign out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
