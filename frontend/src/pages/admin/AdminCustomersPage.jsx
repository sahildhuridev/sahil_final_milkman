import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    const res = await api.get('/api/auth/users/')
    const data = Array.isArray(res.data) ? res.data : res.data?.results || []
    setCustomers(data)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load customers'))
  }, [])

  const deactivate = async (id) => {
    setError('')
    try {
      await api.patch(`/api/auth/users/${id}/deactivate/`)
      await load()
    } catch (e) {
      setError('Failed to deactivate')
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">Customers</h1>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {customers.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md border p-4">
            <div>
              <div className="text-sm font-semibold">{c.username || c.email}</div>
              <div className="text-xs text-gray-600">{c.email}</div>
            </div>
            <button onClick={() => deactivate(c.id)} className="text-sm font-medium text-red-600">
              Deactivate
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
