import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setServerCart, setGuestItems } from '../features/cart/cartSlice'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'

const planLabel = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

function CartRow({ title, subtitle, unitPrice, totalPrice, quantity, onQtyChange, onRemove, imageUrl }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line-200)] bg-white p-4 sm:flex-row">
      <div className="h-24 w-full overflow-hidden rounded-xl bg-[var(--surface-1)] sm:w-28">
        {imageUrl ? <img src={imageUrl} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex-1">
        <p className="font-bold text-[var(--ink-900)]">{title}</p>
        <p className="text-sm text-[var(--ink-500)]">{subtitle}</p>
        <p className="mt-1 text-sm text-[var(--ink-700)]">Unit: Rs {unitPrice}</p>
        <p className="text-sm font-semibold text-[var(--ink-900)]">Line total: Rs {totalPrice}</p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm font-semibold text-[var(--ink-700)]">Qty</label>
          <input type="number" min={1} value={quantity} onChange={onQtyChange} className="input w-24" />
          <button type="button" onClick={onRemove} className="ml-auto text-sm font-semibold text-rose-600 hover:text-rose-700">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const guestItems = useAppSelector((s) => s.cart.guestItems)
  const serverCart = useAppSelector((s) => s.cart.serverCart)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadServerCart = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/cart/')
      dispatch(setServerCart(res.data))
    } catch {
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadServerCart()
    }
  }, [user])

  const guestTotal = useMemo(() => {
    return guestItems.reduce((sum, i) => {
      const snap = i.product_snapshot
      const unit = Number(
        i.plan_type === 'one_time'
          ? snap?.one_time_price
          : i.plan_type === 'monthly'
            ? snap?.monthly_price
            : i.plan_type === 'quarterly'
              ? snap?.quarterly_price
              : snap?.yearly_price,
      )
      return sum + (Number.isNaN(unit) ? 0 : unit) * (i.quantity || 0)
    }, 0)
  }, [guestItems])

  const updateGuestQty = (idx, qty) => {
    const q = Math.max(1, Number(qty) || 1)
    const next = guestItems.map((it, i) => (i === idx ? { ...it, quantity: q } : it))
    dispatch(setGuestItems(next))
  }

  const removeGuest = (idx) => {
    const next = guestItems.filter((_, i) => i !== idx)
    dispatch(setGuestItems(next))
  }

  const updateServerQty = async (itemId, qty) => {
    setError('')
    try {
      await api.patch(`/api/cart/update/${itemId}/`, { quantity: Math.max(1, Number(qty) || 1) })
      await loadServerCart()
    } catch {
      setError('Failed to update quantity')
    }
  }

  const removeServerItem = async (itemId) => {
    setError('')
    try {
      await api.delete(`/api/cart/remove/${itemId}/`)
      await loadServerCart()
    } catch {
      setError('Failed to remove item')
    }
  }

  if (loading) {
    return <LoadingState label="Loading cart..." />
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Cart"
            title="Review items and proceed to checkout"
            subtitle={user ? 'Your account cart is synced with the backend.' : 'Login is required before checkout.'}
            actions={<Link to="/" className="btn-secondary">Continue Shopping</Link>}
          />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          {!user ? (
            <div className="space-y-4">
              {guestItems.length === 0 ? (
                <EmptyState title="Your cart is empty" description="Add products from the home page to get started." />
              ) : (
                <>
                  {guestItems.map((it, idx) => {
                    const snap = it.product_snapshot
                    const unit = Number(
                      it.plan_type === 'one_time'
                        ? snap?.one_time_price
                        : it.plan_type === 'monthly'
                          ? snap?.monthly_price
                          : it.plan_type === 'quarterly'
                            ? snap?.quarterly_price
                            : snap?.yearly_price,
                    )
                    const cleanUnit = Number.isNaN(unit) ? 0 : unit

                    return (
                      <CartRow
                        key={`${it.product_id}-${it.plan_type}`}
                        title={snap?.name || `Product #${it.product_id}`}
                        subtitle={`Plan: ${planLabel[it.plan_type]}`}
                        unitPrice={cleanUnit}
                        totalPrice={cleanUnit * (it.quantity || 0)}
                        quantity={it.quantity}
                        imageUrl={snap?.image_url}
                        onQtyChange={(e) => updateGuestQty(idx, e.target.value)}
                        onRemove={() => removeGuest(idx)}
                      />
                    )
                  })}

                  <div className="flex items-center justify-between rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--ink-700)]">Total</p>
                    <p className="text-xl font-black text-[var(--ink-900)]">Rs {guestTotal}</p>
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--ink-500)]">Login required to checkout.</p>
                <Link to="/login" className="btn-primary">Login</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {serverCart?.items?.length ? (
                <>
                  {serverCart.items.map((it) => (
                    <CartRow
                      key={it.id}
                      title={it.product?.name}
                      subtitle={`Plan: ${planLabel[it.plan_type]}`}
                      unitPrice={it.price_at_time}
                      totalPrice={it.total_price}
                      quantity={it.quantity}
                      imageUrl={it.product?.image_url || it.product?.image}
                      onQtyChange={(e) => updateServerQty(it.id, e.target.value)}
                      onRemove={() => removeServerItem(it.id)}
                    />
                  ))}

                  <div className="flex items-center justify-between rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--ink-700)]">Total</p>
                    <p className="text-xl font-black text-[var(--ink-900)]">Rs {serverCart.total_price}</p>
                  </div>
                </>
              ) : (
                <EmptyState title="Your cart is empty" description="Add items from products and they will appear here." />
              )}

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                disabled={!serverCart?.items?.length}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
