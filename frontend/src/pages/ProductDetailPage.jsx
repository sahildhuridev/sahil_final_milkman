import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setGuestItems } from '../features/cart/cartSlice'
import LoadingState from '../components/ui/LoadingState'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'

const planOptions = [
  { value: 'one_time', label: 'One-time', priceKey: 'one_time_price' },
  { value: 'monthly', label: 'Monthly', priceKey: 'monthly_price' },
  { value: 'quarterly', label: 'Quarterly', priceKey: 'quarterly_price' },
  { value: 'yearly', label: 'Yearly', priceKey: 'yearly_price' },
]

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const guestItems = useAppSelector((s) => s.cart.guestItems)

  const [product, setProduct] = useState(null)
  const [planType, setPlanType] = useState('one_time')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/api/products/${id}/`)
        setProduct(res.data)
      } catch {
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [id])

  const selectedPlan = useMemo(
    () => planOptions.find((p) => p.value === planType) || planOptions[0],
    [planType],
  )

  const price = useMemo(() => {
    if (!product) return 0
    const v = Number(product[selectedPlan.priceKey])
    return Number.isNaN(v) ? 0 : v
  }, [product, selectedPlan])

  const addToGuestCart = () => {
    const pid = Number(id)
    const existingIndex = guestItems.findIndex(
      (i) => String(i.product_id) === String(pid) && i.plan_type === planType,
    )

    const next = [...guestItems]
    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: next[existingIndex].quantity + 1,
      }
    } else {
      next.push({
        product_id: pid,
        plan_type: planType,
        quantity: 1,
        product_snapshot: {
          id: product?.id,
          name: product?.name,
          image_url: product?.image_url,
          category_name: product?.category_name,
          one_time_price: product?.one_time_price,
          monthly_price: product?.monthly_price,
          quarterly_price: product?.quarterly_price,
          yearly_price: product?.yearly_price,
        },
      })
    }

    dispatch(setGuestItems(next))
    navigate('/cart')
  }

  const addToServerCart = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/cart/add/', {
        product_id: Number(id),
        quantity: 1,
        plan_type: planType,
      })
      navigate('/cart')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add to cart')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState label="Loading product..." />
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product might have been removed or is not available."
        action={<Link to="/" className="btn-primary">Back to home</Link>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Product Details"
        title={product.name}
        subtitle={product.category_name}
        actions={<Link to="/" className="btn-secondary">Back to products</Link>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden p-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--surface-1)]">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-[var(--ink-500)]">No image</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body space-y-5">
            {product.description ? <p className="text-sm leading-relaxed text-[var(--ink-700)]">{product.description}</p> : null}

            <div>
              <p className="text-sm font-bold text-[var(--ink-900)]">Choose plan</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {planOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlanType(p.value)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      planType === p.value
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-[var(--line-200)] bg-white hover:bg-[var(--surface-0)]'
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-xs text-[var(--ink-500)]">Rs {Number(product[p.priceKey])}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Selected price</p>
              <p className="mt-1 text-2xl font-black text-[var(--ink-900)]">Rs {price}</p>
              <p className="mt-2 text-xs text-[var(--ink-500)]">
                Stock: {product.stock_quantity} {product.stock_quantity === 1 ? 'item' : 'items'}
              </p>
            </div>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

            <button
              type="button"
              onClick={user ? addToServerCart : addToGuestCart}
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Adding...' : user ? 'Add to Cart' : 'Add to Cart (login to checkout)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
