import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setServerCart, setGuestItems } from '../features/cart/cartSlice'

const planLabel = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
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
    } catch (e) {
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
      const plan = i.plan_type
      const price = Number(
        plan === 'one_time'
          ? snap?.one_time_price
          : plan === 'monthly'
            ? snap?.monthly_price
            : plan === 'quarterly'
              ? snap?.quarterly_price
              : snap?.yearly_price,
      )
      return sum + (Number.isNaN(price) ? 0 : price) * (i.quantity || 0)
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
    } catch (e) {
      setError('Failed to update quantity')
    }
  }

  const removeServerItem = async (itemId) => {
    setError('')
    try {
      await api.delete(`/api/cart/remove/${itemId}/`)
      await loadServerCart()
    } catch (e) {
      setError('Failed to remove item')
    }
  }

  const onCheckout = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Cart</h1>
              <p className="mt-0.5 text-sm text-slate-600">Review items and proceed to checkout.</p>
            </div>
          </div>
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          {loading ? <p className="mt-2 text-sm text-slate-600">Loading...</p> : null}
        </div>

        <div className="card-body">

        {!user ? (
          <div className="space-y-4">
            {guestItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-3">
                {guestItems.map((it, idx) => (
                  <div key={`${it.product_id}-${it.plan_type}`} className="flex gap-4 rounded-2xl border border-slate-200/70 p-4">
                    <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-100">
                      {it.product_snapshot?.image_url ? (
                        <img
                          src={it.product_snapshot.image_url}
                          alt={it.product_snapshot?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{it.product_snapshot?.name || `Product #${it.product_id}`}</p>
                      <p className="text-sm text-slate-600">Plan: {planLabel[it.plan_type]}</p>
                      <p className="text-sm text-slate-600">
                        Line total: ₹
                        {(() => {
                          const snap = it.product_snapshot
                          const plan = it.plan_type
                          const unit = Number(
                            plan === 'one_time'
                              ? snap?.one_time_price
                              : plan === 'monthly'
                                ? snap?.monthly_price
                                : plan === 'quarterly'
                                  ? snap?.quarterly_price
                                  : snap?.yearly_price,
                          )
                          const u = Number.isNaN(unit) ? 0 : unit
                          return u * (it.quantity || 0)
                        })()}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-700">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateGuestQty(idx, e.target.value)}
                          className="input w-24"
                        />
                        <button
                          type="button"
                          onClick={() => removeGuest(idx)}
                          className="ml-auto text-sm font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">Total</p>
                  <p className="text-lg font-extrabold text-slate-900">₹{guestTotal}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Login required to checkout.</p>
              <Link to="/login" className="btn-primary">
                Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {serverCart?.items?.length ? (
              <div className="space-y-3">
                {serverCart.items.map((it) => (
                  <div key={it.id} className="flex gap-4 rounded-2xl border border-slate-200/70 p-4">
                    <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-100">
                      {it.product?.image_url || it.product?.image ? (
                        <img
                          src={it.product.image_url || it.product.image}
                          alt={it.product?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{it.product?.name}</p>
                      <p className="text-sm text-slate-600">Plan: {planLabel[it.plan_type]}</p>
                      <p className="text-sm text-slate-600">Unit price: ₹{it.price_at_time}</p>
                      <p className="text-sm text-slate-600">Line total: ₹{it.total_price}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-700">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateServerQty(it.id, e.target.value)}
                          className="input w-24"
                        />
                        <button
                          type="button"
                          onClick={() => removeServerItem(it.id)}
                          className="ml-auto text-sm font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">Total</p>
                  <p className="text-lg font-extrabold text-slate-900">₹{serverCart.total_price}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                Your cart is empty.
              </div>
            )}

            <button
              type="button"
              onClick={onCheckout}
              disabled={!serverCart?.items?.length}
              className="btn-primary w-full disabled:opacity-60"
            >
              Proceed to checkout
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
