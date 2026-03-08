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
  const [downloadingId, setDownloadingId] = useState(null)

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

  const onDownloadBill = async (orderId) => {
    setError('')
    setDownloadingId(orderId)
    try {
      const res = await api.get(`/api/orders/${orderId}/invoice/`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill-order-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to download bill')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <LoadingState label="Loading orders..." />

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Dashboard"
            title="My Orders"
            subtitle="Track order and payment status with product-level details."
            actions={<Link to="/products" className="btn-secondary">Shop More</Link>}
          />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Place your first order from the product catalog." />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-[var(--line-200)] bg-white p-4 transition hover:shadow-sm"
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

                  <div className="mt-3 space-y-2">
                    {o.items?.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink-900)]">{item.product?.name}</p>
                            <p className="text-xs text-[var(--ink-500)]">
                              Plan: {item.plan_type} | Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink-900)]">Rs {item.total_price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onDownloadBill(o.id)}
                      disabled={downloadingId === o.id}
                    >
                      {downloadingId === o.id ? 'Generating PDF...' : 'Download Bill'}
                    </button>
                    <Link to={`/dashboard/orders/${o.id}`} className="btn-secondary">
                      View Full Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
