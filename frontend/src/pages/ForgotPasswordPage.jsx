import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await api.post('/api/auth/password-reset/request/', { email })
      setMessage(res.data?.message || 'Password reset email sent.')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Forgot Password"
        subtitle="Enter your registered email to receive password reset link."
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[var(--ink-700)]">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
                required
              />
            </div>

            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>

          <p className="mt-4 text-sm text-[var(--ink-500)]">
            Back to{' '}
            <Link to="/login" className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-500)]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
