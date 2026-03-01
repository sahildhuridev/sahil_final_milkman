import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../app/apiClient'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [oRes, pRes] = await Promise.all([
          api.get(`/api/orders/${id}/`),
          api.get(`/api/payments/${id}/`).catch(() => ({ data: null })),
        ])
        setOrder(oRes.data)
        setPayment(pRes.data)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) return <p className="text-sm text-gray-600">Loading...</p>

  if (!order) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm">Order not found.</p>
        <Link to="/dashboard/orders" className="mt-3 inline-block text-sm font-medium text-blue-600">
          Back
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Order #{order.id}</h1>
            <p className="text-sm text-gray-600">{order.created_at}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">₹{order.total_amount}</p>
            <p className="text-sm text-gray-600">Status: {order.status}</p>
          </div>
        </div>

        {payment ? (
          <div className="mt-4 rounded-md border p-4 text-sm">
            <p className="font-medium">Payment</p>
            <p className="text-gray-600">Status: {payment.status || 'unknown'}</p>
          </div>
        ) : null}

        <Link to="/dashboard/orders" className="mt-4 inline-block text-sm font-medium text-blue-600">
          Back to orders
        </Link>
      </div>
    </div>
  )
}
