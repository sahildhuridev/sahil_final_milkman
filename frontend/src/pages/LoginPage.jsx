import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setSession } from '../features/auth/authSlice'
import { clearGuestCart } from '../features/cart/cartSlice'
import PageHeader from '../components/ui/PageHeader'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const guestItems = useAppSelector((s) => s.cart.guestItems)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      const res = await api.post('/api/auth/login/', { email, password })
      dispatch(setSession(res.data))

      if (guestItems?.length) {
        await syncGuestCart()
      }

      const from = location.state?.from?.pathname
      navigate(from || '/cart', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader eyebrow="Account" title="Login" subtitle="Access your cart, checkout, and order dashboard." />

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="input mt-1"
              />
            </div>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-sm text-[var(--ink-500)]">
            Do not have an account?{' '}
            <Link to="/signup" className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-500)]">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
