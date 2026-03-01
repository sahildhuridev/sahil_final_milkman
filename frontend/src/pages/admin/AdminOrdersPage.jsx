import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    const res = await api.get('/api/orders/admin/all/')
    const data = Array.isArray(res.data) ? res.data : res.data?.results || []
    setOrders(data)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load orders'))
  }, [])

  const updateStatus = async (id, status) => {
    setError('')
    try {
      await api.patch(`/api/orders/${id}/update-status/`, { status })
      await load()
    } catch (e) {
      setError('Failed to update status')
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">All Orders</h1>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Order #{o.id}</div>
                <div className="text-xs text-gray-600">{o.created_at}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">₹{o.total_amount}</div>
                <div className="text-xs text-gray-600">{o.status}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-1 text-sm"
                onClick={() => updateStatus(o.id, 'processing')}
              >
                Processing
              </button>
              <button className="rounded-md border px-3 py-1 text-sm" onClick={() => updateStatus(o.id, 'delivered')}>
                Delivered
              </button>
              <button className="rounded-md border px-3 py-1 text-sm" onClick={() => updateStatus(o.id, 'cancelled')}>
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
