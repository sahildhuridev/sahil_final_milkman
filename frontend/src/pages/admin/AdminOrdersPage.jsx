import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

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
    setUpdatingId(id)
    try {
      await api.patch(`/api/orders/${id}/update-status/`, { status })
      await load()
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <h1 className="text-xl font-black text-[var(--ink-900)]">All Orders</h1>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[var(--line-200)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[var(--ink-900)]">Order #{o.id}</div>
                  <div className="text-xs text-[var(--ink-500)]">{o.created_at}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--ink-900)]">Rs {o.total_amount}</div>
                  <div className="text-xs text-[var(--ink-500)]">Status: {o.status}</div>
                  <div className="text-xs text-[var(--ink-500)]">Payment: {o.payment_status}</div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Customer</p>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">{o.user_username || 'N/A'}</p>
                  <p className="text-xs text-[var(--ink-500)]">{o.user_email || 'No email'}</p>
                  <p className="text-xs text-[var(--ink-500)]">{o.user_phone_number || 'No contact'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Shipping Address</p>
                  <p className="text-sm text-[var(--ink-700)]">{o.shipping_address}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Products bought</p>
                <div className="mt-2 space-y-2">
                  {o.items?.map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink-900)]">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-[var(--ink-500)]">
                            Plan: {item.plan_type} | Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--ink-900)]">Rs {item.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="btn-secondary"
                  disabled={updatingId === o.id}
                  onClick={() => updateStatus(o.id, 'confirmed')}
                >
                  Confirmed
                </button>
                <button
                  className="btn-secondary"
                  disabled={updatingId === o.id}
                  onClick={() => updateStatus(o.id, 'shipped')}
                >
                  Shipped
                </button>
                <button
                  className="btn-secondary"
                  disabled={updatingId === o.id}
                  onClick={() => updateStatus(o.id, 'delivered')}
                >
                  Delivered
                </button>
                <button
                  className="btn-danger"
                  disabled={updatingId === o.id}
                  onClick={() => updateStatus(o.id, 'cancelled')}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
