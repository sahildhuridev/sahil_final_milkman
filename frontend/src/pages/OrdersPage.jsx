import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
      } catch {
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) return <LoadingState label="Loading orders..." />

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Dashboard"
            title="My Orders"
            subtitle="Track order and payment status for every purchase."
            actions={<Link to="/" className="btn-secondary">Shop More</Link>}
          />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Place your first order from the product catalog." />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/dashboard/orders/${o.id}`}
                  className="block rounded-2xl border border-[var(--line-200)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--ink-900)]">Order #{o.id}</p>
                      <p className="text-xs text-[var(--ink-500)]">{o.created_at}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatBadge label="Amount" value={`Rs ${o.total_amount}`} />
                      <StatBadge label="Status" value={o.status} tone={statusTone[o.status] || 'neutral'} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
