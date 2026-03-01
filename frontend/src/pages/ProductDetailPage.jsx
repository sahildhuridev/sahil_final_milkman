import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setGuestItems } from '../features/cart/cartSlice'

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
      } catch (e) {
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
    const q = 1

    const existingIndex = guestItems.findIndex(
      (i) => String(i.product_id) === String(pid) && i.plan_type === planType,
    )

    const next = [...guestItems]
    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: next[existingIndex].quantity + q,
      }
    } else {
      next.push({
        product_id: pid,
        plan_type: planType,
        quantity: q,
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
    return <p className="text-sm text-gray-600">Loading...</p>
  }

  if (!product) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-gray-700">Product not found.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-blue-600">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
              No image
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-600">{product.category_name}</p>
        {product.description ? <p className="mt-4 text-sm text-gray-700">{product.description}</p> : null}

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Plan</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {planOptions.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlanType(p.value)}
                  className={
                    `rounded-md border px-3 py-2 text-left text-sm ` +
                    (planType === p.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50')
                  }
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-gray-600">₹{Number(product[p.priceKey])}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Price</p>
              <p className="mt-1 text-xl font-semibold">₹{price}</p>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={user ? addToServerCart : addToGuestCart}
            disabled={saving}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Adding...' : user ? 'Add to cart' : 'Add to cart (login to checkout)'}
          </button>

          <p className="text-xs text-gray-500">
            Stock: {product.stock_quantity} {product.stock_quantity === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </div>
  )
}
