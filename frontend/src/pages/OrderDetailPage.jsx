import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import StatBadge from '../components/ui/StatBadge'

const statusTone = {
  pending: 'warning',
  confirmed: 'neutral',
  shipped: 'neutral',
  delivered: 'success',
  cancelled: 'danger',
}

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

  if (loading) return <LoadingState label="Loading order details..." />

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order does not exist or is not accessible."
        action={<Link to="/dashboard/orders" className="btn-primary">Back to orders</Link>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Order Details"
            title={`Order #${order.id}`}
            subtitle={order.created_at}
            actions={<Link to="/dashboard/orders" className="btn-secondary">Back to Orders</Link>}
          />

          <div className="flex flex-wrap gap-2">
            <StatBadge label="Amount" value={`Rs ${order.total_amount}`} />
            <StatBadge label="Status" value={order.status} tone={statusTone[order.status] || 'neutral'} />
            <StatBadge label="Payment" value={order.payment_status || 'unknown'} />
          </div>

          <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4 text-sm text-[var(--ink-700)]">
            <p className="font-semibold text-[var(--ink-900)]">Shipping address</p>
            <p className="mt-1">{order.shipping_address || 'Not available'}</p>
          </div>

          {payment ? (
            <div className="rounded-2xl border border-[var(--line-200)] p-4 text-sm text-[var(--ink-700)]">
              <p className="font-semibold text-[var(--ink-900)]">Payment details</p>
              <p className="mt-1">Method: {payment.payment_method || 'N/A'}</p>
              <p>Status: {payment.status || 'unknown'}</p>
              {payment.transaction_id ? <p>Transaction: {payment.transaction_id}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
