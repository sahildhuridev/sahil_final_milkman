import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'

const VERIFIED_EMAIL_KEY = 'milkman_verified_email'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const run = async () => {
      const token = params.get('token')
      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing.')
        setLoading(false)
        return
      }

      try {
        const res = await api.get('/api/auth/verify-email/confirm/', {
          params: { token },
        })
        const email = (res.data?.email || '').toLowerCase()
        if (email) {
          localStorage.setItem(VERIFIED_EMAIL_KEY, email)
        }
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully.')
      } catch (e) {
        setStatus('error')
        setMessage(e?.response?.data?.error || 'Email verification failed.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [params])

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <PageHeader eyebrow="Account" title="Email Verification" subtitle="Complete verification to continue signup." />

      <div className="card">
        <div className="card-body">
          <p className={status === 'success' ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-semibold text-rose-600'}>
            {loading ? 'Please wait...' : message}
          </p>

          <div className="mt-4">
            <Link to="/signup" className="btn-primary w-full">
              Back to Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
