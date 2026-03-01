import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const res = await api.get('/api/payments/admin/all/')
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setPayments(data)
    }

    run().catch(() => setError('Failed to load payments'))
  }, [])

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">All Payments</h1>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Payment #{p.id}</div>
                <div className="text-xs text-gray-600">Order: {p.order}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">₹{p.amount}</div>
                <div className="text-xs text-gray-600">{p.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
