import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [tokenValid, setTokenValid] = useState(false)
  const [validating, setValidating] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = params.get('token') || ''

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Reset token missing.')
        setValidating(false)
        return
      }

      setValidating(true)
      setError('')
      try {
        await api.get('/api/auth/password-reset/validate/', {
          params: { token },
        })
        setTokenValid(true)
      } catch (err) {
        setTokenValid(false)
        setError(err?.response?.data?.error || 'Invalid or expired reset link.')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await api.post('/api/auth/password-reset/confirm/', {
        token,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      })
      setMessage(res.data?.message || 'Password changed successfully.')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Reset Password"
        subtitle="Enter your new password and confirm it."
      />

      <div className="card">
        <div className="card-body">
          {validating ? <p className="text-sm font-medium text-[var(--ink-700)]">Validating reset link...</p> : null}

          {!validating && !tokenValid ? (
            <p className="text-sm font-medium text-rose-600">{error || 'Invalid reset token.'}</p>
          ) : null}

          {!validating && tokenValid ? (
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-[var(--ink-700)]">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--ink-700)]">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input mt-1"
                />
              </div>

              {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          ) : null}

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
