import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAuthStore,
  useRegisterStore,
  useLoginStore,
  useForgotStore
} from '../store/useAuthStore'
import { FaGithub } from 'react-icons/fa6'
import useSocialAuth from '../utils/useSocialAuth'
import ThemeToggle from '../components/ThemeToggle'
import { Arrow, BraceTag, Dots, Globe, Logo, Slashes } from '../components/Brand'

const COPY = {
  'sign-in': ['Welcome back', 'Sign in to your GDG on Campus BIT account.'],
  'sign-up': ['Create your account', 'We will email you a one-time code to verify it.'],
  'otp-verify': ['Check your inbox', 'Enter the 5-digit code we just emailed you.'],
  'new-user': ['Tell us about you', 'Almost done. Set up your profile and a password.'],
  'forgot-password-email': ['Forgot password?', 'Enter your account email and we will send a code.'],
  'forgot-password-otp': ['Enter the code', 'We emailed a 5-digit code to reset your password.'],
  'forgot-password-reset': ['Choose a new password', 'Make it something you have not used here before.']
}

const Auth = () => {
  const { authType, setAuthType, user } = useAuthStore()
  // Start fresh on every visit unless we are coming back from a social login redirect.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('type')) setAuthType('sign-in')
  }, [setAuthType])
  useSocialAuth()
  const [title, sub] = COPY[authType] || COPY['sign-in']
  const fromSocial = new URLSearchParams(window.location.search).get('type')
  if (user && localStorage.getItem('login_token') && !fromSocial && authType === 'sign-in') return <Navigate to='/' replace />

  return (
    <div className='min-h-[100svh] grid lg:grid-cols-2'>
      {/* Brand panel */}
      <aside className='hidden lg:flex band band-blue !rounded-none !border-0 !border-r-2 relative overflow-hidden p-12 flex-col justify-between'
        style={{ borderRight: '2px solid var(--black)' }}>
        <BraceTag>On Campus</BraceTag>
        <div className='relative z-10 flex flex-col gap-6'>
          <h1 className='title-display'>Join our<br /><b>community</b></h1>
          <div className='flex items-center gap-4'>
            <Arrow width={64} />
            <Dots color='var(--blue)' size={28} />
          </div>
          <p className='max-w-sm text-[var(--muted)]'>
            One account for events, certificates and everything GDG on Campus Bengal Institute of Technology.
          </p>
        </div>
        <div className='flex items-end justify-between'>
          <img src='/brand/gdg-horizontal-light.png' alt='Google Developer Groups on Campus, Bengal Institute of Technology' className='h-12 w-auto' />
          <Globe size={160} />
        </div>
        <Slashes size={90} color='var(--blue-ht)' className='absolute top-24 right-16' />
      </aside>

      {/* Form */}
      <div className='flex flex-col'>
        <div className='flex items-center justify-between p-4 sm:p-6'>
          <Logo compact className='lg:hidden' />
          <span className='max-lg:hidden' />
          <ThemeToggle />
        </div>
        <div className='flex-1 flex items-center justify-center px-4 pb-10'>
          <div className='w-full max-w-md flex flex-col gap-6'>
            <div>
              <h2 className='title-2'>{title}</h2>
              <p className='text-[var(--muted)] mt-1'>{sub}</p>
            </div>

            {authType === 'sign-in' || authType === 'sign-up' ? (
              <>
                <SocialAuth />
                <div className='flex items-center gap-3 text-sm text-[var(--muted)]'>
                  <div className='flex-1 h-px bg-[var(--hairline)]' /> or with email <div className='flex-1 h-px bg-[var(--hairline)]' />
                </div>
                <ManualAuth />
                <div className='flex flex-wrap justify-between gap-2 text-sm'>
                  <p className='text-[var(--muted)]'>
                    {authType === 'sign-in' ? 'New here?' : 'Already have an account?'}{' '}
                    <button type='button' className='font-medium underline underline-offset-4 text-[var(--ink)]'
                      onClick={() => setAuthType(authType === 'sign-in' ? 'sign-up' : 'sign-in')}>
                      {authType === 'sign-in' ? 'Create an account' : 'Sign in'}
                    </button>
                  </p>
                  {authType === 'sign-in' && (
                    <button type='button' className='font-medium underline underline-offset-4'
                      onClick={() => setAuthType('forgot-password-email')}>
                      Forgot password?
                    </button>
                  )}
                </div>
              </>
            ) : authType === 'otp-verify' ? (
              <OTPVerify />
            ) : authType === 'new-user' ? (
              <NewUser />
            ) : authType === 'forgot-password-email' ? (
              <ForgotPasswordEmail />
            ) : authType === 'forgot-password-otp' ? (
              <ForgotPasswordOTP />
            ) : (
              <ForgotPasswordReset />
            )}

            <Link to='/' className='text-sm text-[var(--muted)] hover:underline self-center'>← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const socialUrl = provider =>
  import.meta.env.MODE === 'production'
    ? `/api/auth/${provider}`
    : import.meta.env[`VITE_DEV_${provider.toUpperCase()}_AUTH_URL`] || `http://localhost:5000/api/auth/${provider}`

const SocialAuth = () => {
  const go = provider => {
    localStorage.removeItem('login_token')
    window.location.href = socialUrl(provider)
  }
  const providers = [
    ['google', 'Google', <img key='g' src='/google-small.svg' alt='' className='w-4 h-4' />],
    ['github', 'GitHub', <FaGithub key='gh' className='w-4 h-4 text-[#181717]' aria-hidden='true' />]
  ]
  return (
    <div className='flex flex-col gap-2.5'>
      {providers.map(([id, label, icon]) => (
        <button key={id} type='button' onClick={() => go(id)} className='btn btn-light w-full !justify-start'>
          <span className='w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0'>
            {icon}
          </span>
          Continue with {label}
        </button>
      ))}
    </div>
  )
}

const Field = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className='label'>{label}</label>
    <input id={id} className='field' {...props} />
  </div>
)

const Submit = ({ busy, children, busyText = 'Please wait…' }) => (
  <button type='submit' disabled={busy} className='btn btn-ink w-full'>
    {busy ? busyText : children}
  </button>
)

const ManualAuth = () => {
  const navigate = useNavigate()
  const { authType, verifyLoading, registerLoading } = useAuthStore()
  const { userRegisterCredential } = useRegisterStore()
  const { userLogin } = useLoginStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuth = e => {
    e.preventDefault()
    localStorage.removeItem('login_token')
    if (!email) return toast.error('Enter your email to continue')
    if (authType === 'sign-up') userRegisterCredential(email)
    else {
      if (!password) return toast.error('Enter your password to continue')
      userLogin(email, password, navigate)
    }
  }

  return (
    <form className='flex flex-col gap-4' onSubmit={handleAuth}>
      <Field id='email' label='Email address' type='email' autoComplete='email' value={email}
        onChange={e => setEmail(e.target.value)} placeholder='you@example.com' />
      {authType === 'sign-in' && (
        <Field id='password' label='Password' type='password' autoComplete='current-password' value={password}
          onChange={e => setPassword(e.target.value)} />
      )}
      <Submit busy={registerLoading || verifyLoading}>{authType === 'sign-in' ? 'Sign in' : 'Send verification code'}</Submit>
    </form>
  )
}

/** 5 boxes, numeric keypad on mobile, supports pasting the whole code. */
const OtpInput = ({ value, onChange }) => {
  const refs = useRef([])
  const set = (idx, ch) => {
    const next = [...value]
    next[idx] = ch
    onChange(next)
  }
  return (
    <div className='flex justify-between gap-2' onPaste={e => {
      const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5).split('')
      if (!digits.length) return
      e.preventDefault()
      onChange([...digits, ...Array(5 - digits.length).fill('')])
      refs.current[Math.min(digits.length, 4)]?.focus()
    }}>
      {value.map((d, i) => (
        <input key={i} ref={el => (refs.current[i] = el)} className='field otp' inputMode='numeric'
          autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1}`} maxLength={1} value={d}
          onChange={e => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1)
            set(i, ch)
            if (ch) refs.current[i + 1]?.focus()
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !value[i]) refs.current[i - 1]?.focus()
          }} />
      ))}
    </div>
  )
}

const OTPVerify = () => {
  const { registerSuccess, verifyOTP, setAuthType } = useAuthStore()
  const { userRegisterResendOTP, userRegisterVerifyOTP } = useRegisterStore()
  const [otp, setOtp] = useState(Array(5).fill(''))

  const submit = e => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 5) return toast.error('Enter the 5-digit code')
    userRegisterVerifyOTP(code)
  }

  return (
    <form className='flex flex-col gap-5' onSubmit={submit}>
      <OtpInput value={otp} onChange={setOtp} />
      <Submit busy={verifyOTP} busyText='Verifying…'>Verify</Submit>
      <div className='flex justify-between text-sm'>
        <button type='button' className='underline underline-offset-4' onClick={() => setAuthType('sign-up')}>Use another email</button>
        <button type='button' className='underline underline-offset-4'
          onClick={() => (registerSuccess ? userRegisterResendOTP() : toast.error('Session expired. Start again.'))}>
          Resend code
        </button>
      </div>
    </form>
  )
}

const NewUser = () => {
  const navigate = useNavigate()
  const { user, registerDetail } = useAuthStore()
  const { userRegisterDetails } = useRegisterStore()
  const fileRef = useRef()
  const [image, setImage] = useState(user?.avatar?.url || '')
  const [imageFile, setImageFile] = useState(null)
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const submit = e => {
    e.preventDefault()
    if (!firstName) return toast.error('First name is required')
    if (!lastName) return toast.error('Last name is required')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirmPassword) return toast.error("Passwords don't match")
    userRegisterDetails({ firstName, lastName, password, imageFile: imageFile || '', shallRedirect: true, navigate })
  }

  return (
    <form className='flex flex-col gap-4' onSubmit={submit}>
      <div className='flex items-center gap-4'>
        <img src={image || '/user.svg'} alt='' className='w-20 h-20 rounded-full object-cover border-2 border-[var(--outline)] bg-[var(--sunken)]' />
        <input type='file' hidden accept='image/*' ref={fileRef} disabled={registerDetail}
          onChange={e => {
            const f = e.target.files[0]
            if (f) {
              setImage(URL.createObjectURL(f))
              setImageFile(f)
            }
            e.target.value = ''
          }} />
        <button type='button' className='btn btn-ghost btn-sm' onClick={() => fileRef.current.click()}>
          {image ? 'Change photo' : 'Upload photo'}
        </button>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <Field id='first-name' label='First name' autoComplete='given-name' value={firstName} onChange={e => setFirstName(e.target.value)} />
        <Field id='last-name' label='Last name' autoComplete='family-name' value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>
      <Field id='set-password' label='Password' type='password' autoComplete='new-password' value={password} onChange={e => setPassword(e.target.value)} />
      <Field id='confirm-password' label='Confirm password' type='password' autoComplete='new-password' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      <Submit busy={registerDetail} busyText='Creating account…'>Create account</Submit>
    </form>
  )
}

const ForgotPasswordEmail = () => {
  const { setAuthType, emailVerifyLoading } = useAuthStore()
  const { emailVerify } = useForgotStore()
  const [email, setEmail] = useState('')
  return (
    <form className='flex flex-col gap-4' onSubmit={e => {
      e.preventDefault()
      if (!email) return toast.error('Enter your account email')
      emailVerify(email)
    }}>
      <Field id='email' label='Email address' type='email' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} />
      <Submit busy={emailVerifyLoading} busyText='Sending…'>Send code</Submit>
      <button type='button' className='text-sm underline underline-offset-4 self-center' onClick={() => setAuthType('sign-in')}>Back to sign in</button>
    </form>
  )
}

const ForgotPasswordOTP = () => {
  const { verifyOTP, resendOTP, otpVerify } = useForgotStore()
  const [otp, setOtp] = useState(Array(5).fill(''))
  return (
    <form className='flex flex-col gap-5' onSubmit={e => {
      e.preventDefault()
      const code = otp.join('')
      if (code.length < 5) return toast.error('Enter the 5-digit code')
      otpVerify(code)
    }}>
      <OtpInput value={otp} onChange={setOtp} />
      <Submit busy={verifyOTP} busyText='Verifying…'>Verify</Submit>
      <button type='button' className='text-sm underline underline-offset-4 self-center' onClick={resendOTP}>Resend code</button>
    </form>
  )
}

const ForgotPasswordReset = () => {
  const { resetPasswordLoading, resetPassword } = useForgotStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  return (
    <form className='flex flex-col gap-4' onSubmit={e => {
      e.preventDefault()
      if (password.length < 6) return toast.error('Password must be at least 6 characters')
      if (password !== confirmPassword) return toast.error("Passwords don't match")
      resetPassword(password)
    }}>
      <Field id='new-password' label='New password' type='password' autoComplete='new-password' value={password} onChange={e => setPassword(e.target.value)} />
      <Field id='confirm-password' label='Confirm password' type='password' autoComplete='new-password' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      <Submit busy={resetPasswordLoading} busyText='Saving…'>Update password</Submit>
    </form>
  )
}

export default Auth
