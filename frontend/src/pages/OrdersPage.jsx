import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../app/apiClient'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/orders/')
        const data = Array.isArray(res.data) ? res.data : res.data?.results || []
        setOrders(data)
      } catch (e) {
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) return <p className="text-sm text-gray-600">Loading...</p>

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">My Orders</h1>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {orders.length === 0 ? <p className="text-sm text-gray-700">No orders yet.</p> : null}
        {orders.map((o) => (
          <Link key={o.id} to={`/dashboard/orders/${o.id}`} className="block rounded-md border p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Order #{o.id}</p>
                <p className="text-xs text-gray-600">{o.created_at}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">₹{o.total_amount}</p>
                <p className="text-xs text-gray-600">Status: {o.status}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
