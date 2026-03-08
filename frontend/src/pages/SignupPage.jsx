import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setSession } from '../features/auth/authSlice'
import { clearGuestCart } from '../features/cart/cartSlice'
import PageHeader from '../components/ui/PageHeader'

const VERIFIED_EMAIL_KEY = 'milkman_verified_email'

export default function SignupPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const guestItems = useAppSelector((s) => s.cart.guestItems)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone_number, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [password_confirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [error, setError] = useState('')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  useEffect(() => {
    const verifiedEmail = (localStorage.getItem(VERIFIED_EMAIL_KEY) || '').toLowerCase()
    setIsEmailVerified(Boolean(email && verifiedEmail === email.toLowerCase()))
  }, [email])

  const syncGuestCart = async () => {
    for (const item of guestItems) {
      await api.post('/api/cart/add/', {
        product_id: item.product_id,
        quantity: item.quantity,
        plan_type: item.plan_type,
      })
    }
    dispatch(clearGuestCart())
  }

  const requestVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email before requesting verification.')
      return
    }

    setVerifying(true)
    setError('')
    setVerifyMessage('')

    try {
      const res = await api.post('/api/auth/verify-email/request/', { email })
      setVerifyMessage(res.data?.message || 'Verification mail sent. Check your inbox.')
      setIsEmailVerified(false)
      localStorage.removeItem(VERIFIED_EMAIL_KEY)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send verification email.')
    } finally {
      setVerifying(false)
    }
  }

  const checkVerificationStatus = async () => {
    if (!email) return

    setCheckingStatus(true)
    setError('')
    setVerifyMessage('')

    try {
      const res = await api.get('/api/auth/verify-email/status/', {
        params: { email },
      })

      if (res.data?.is_verified) {
        setIsEmailVerified(true)
        localStorage.setItem(VERIFIED_EMAIL_KEY, email.toLowerCase())
        setVerifyMessage('Email verified successfully. You can create your account now.')
      } else {
        setIsEmailVerified(false)
        setVerifyMessage('Email is not verified yet. Please click the link in your email first.')
      }
    } catch {
      setError('Failed to check verification status.')
    } finally {
      setCheckingStatus(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isEmailVerified) {
      setError('Please verify your email before creating your account.')
      setLoading(false)
      return
    }

    try {
      const res = await api.post('/api/auth/register/', {
        username,
        email,
        phone_number,
        password,
        password_confirm,
      })
      dispatch(setSession(res.data))

      if (guestItems?.length) {
        await syncGuestCart()
      }

      localStorage.removeItem(VERIFIED_EMAIL_KEY)
      navigate('/cart', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader eyebrow="Account" title="Create account" subtitle="Verify your email first, then complete signup." />

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input mt-1" />
            </div>

            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Email</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setVerifyMessage('')
                }}
                type="email"
                required
                className="input mt-1"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={requestVerificationEmail} className="btn-secondary" disabled={verifying || !email}>
                  {verifying ? 'Sending...' : 'Verify Email Address'}
                </button>
                <button type="button" onClick={checkVerificationStatus} className="btn-secondary" disabled={checkingStatus || !email}>
                  {checkingStatus ? 'Checking...' : 'I have verified'}
                </button>
              </div>
              {isEmailVerified ? <p className="mt-1 text-xs font-semibold text-emerald-700">Email verified.</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Phone number</label>
              <input value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Confirm password</label>
              <input value={password_confirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" required className="input mt-1" />
            </div>

            {verifyMessage ? <p className="text-sm font-medium text-emerald-700">{verifyMessage}</p> : null}
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

            <button disabled={loading || !isEmailVerified} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-sm text-[var(--ink-500)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-500)]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
