import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setSession } from '../features/auth/authSlice'
import { clearGuestCart } from '../features/cart/cartSlice'
import PageHeader from '../components/ui/PageHeader'

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
  const [error, setError] = useState('')

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

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

      navigate('/cart', { replace: true })
    } catch {
      setError('Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader eyebrow="Account" title="Create account" subtitle="Register once and manage all your recurring orders." />

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="input mt-1" />
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

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

            <button disabled={loading} className="btn-primary w-full">
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
