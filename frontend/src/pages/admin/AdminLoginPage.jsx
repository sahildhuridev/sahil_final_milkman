import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../app/apiClient'
import { useAppDispatch } from '../../app/hooks'
import { setSession } from '../../features/auth/authSlice'
import PageHeader from '../../components/ui/PageHeader'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/api/auth/login/', { email, password })
      dispatch(setSession(res.data))
      navigate('/admin/products', { replace: true })
    } catch {
      setError('Admin login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pt-8">
      <PageHeader
        eyebrow="Admin"
        title="Admin Login"
        subtitle="Sign in with an admin account to access management tools."
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Email / Username</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required className="input mt-1" />
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
        </div>
      </div>
    </div>
  )
}
