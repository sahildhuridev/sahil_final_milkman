import { useEffect, useMemo, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = async () => {
    const res = await api.get('/api/auth/users/')
    const data = Array.isArray(res.data) ? res.data : res.data?.results || []
    setCustomers(data)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load customers'))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_number?.toLowerCase().includes(q),
    )
  }, [customers, search])

  const banUser = async (id) => {
    setError('')
    setUpdatingId(id)
    try {
      await api.patch(`/api/auth/users/${id}/deactivate/`)
      await load()
    } catch {
      setError('Failed to ban customer')
    } finally {
      setUpdatingId(null)
    }
  }

  const unbanUser = async (id) => {
    setError('')
    setUpdatingId(id)
    try {
      await api.patch(`/api/auth/users/${id}/activate/`)
      await load()
    } catch {
      setError('Failed to unban customer')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <h1 className="text-xl font-black text-[var(--ink-900)]">Customers Management</h1>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name/email/phone"
          className="input"
        />

        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--ink-900)]">{c.username || 'Customer'}</p>
                  <p className="text-xs text-[var(--ink-500)]">{c.email}</p>
                  <p className="text-xs text-[var(--ink-500)]">{c.phone_number || 'No contact number'}</p>
                  <p className="text-xs text-[var(--ink-500)]">Joined: {c.date_joined}</p>
                </div>

                <div className="text-right">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Banned'}
                  </span>

                  <div className="mt-3">
                    {c.is_active ? (
                      <button className="btn-danger" disabled={updatingId === c.id} onClick={() => banUser(c.id)}>
                        {updatingId === c.id ? 'Updating...' : 'Ban'}
                      </button>
                    ) : (
                      <button className="btn-primary" disabled={updatingId === c.id} onClick={() => unbanUser(c.id)}>
                        {updatingId === c.id ? 'Updating...' : 'Unban'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!filtered.length ? <p className="text-sm text-[var(--ink-500)]">No customers found.</p> : null}
        </div>
      </div>
    </div>
  )
}
