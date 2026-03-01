import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'

export default function CheckoutPage() {
  const navigate = useNavigate()

  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [cartRes, addrRes] = await Promise.all([api.get('/api/cart/'), api.get('/api/addresses/')])
      setCart(cartRes.data)
      const addrData = Array.isArray(addrRes.data) ? addrRes.data : addrRes.data?.results || []
      setAddresses(addrData)
      if (addrData.length) setSelectedAddressId(String(addrData[0].id))
    } catch (e) {
      setError('Failed to load checkout')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const createAddress = async () => {
    const res = await api.post('/api/addresses/create/', {
      address_line: `${form.address_line1}${form.address_line2 ? `, ${form.address_line2}` : ''}`,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      is_default: true,
    })
    const created = res.data
    const next = [created, ...addresses]
    setAddresses(next)
    setSelectedAddressId(String(created.id))
    return created
  }

  const formatAddress = (a) => {
    if (!a) return ''
    const line = a.address_line || ''
    const city = a.city || ''
    const state = a.state || ''
    const pin = a.pincode || ''
    return `${line}, ${city}, ${state} - ${pin}`.trim()
  }

  const startPayment = async () => {
    setError('')
    try {
      const cartRes = await api.get('/api/cart/')
      setCart(cartRes.data)
      if (!cartRes.data?.items?.length) {
        setError('Cart is empty')
        return
      }
    } catch (e) {
      setError('Failed to load cart')
      return
    }

    if (!selectedAddressId && (!form.address_line1 || !form.city || !form.pincode)) {
      setError('Select an address or add a new one')
      return
    }

    setShowPaymentModal(true)
  }

  const doPayment = async (success) => {
    setPaying(true)
    setError('')

    try {
      let addrId = selectedAddressId
      if (!addrId) {
        const created = await createAddress()
        addrId = String(created.id)
      }

      const selectedAddress = addresses.find((a) => String(a.id) === String(addrId))
      const shippingAddressText = selectedAddress
        ? formatAddress(selectedAddress)
        : `${form.address_line1}${form.address_line2 ? `, ${form.address_line2}` : ''}, ${form.city}, ${form.state} - ${form.pincode}`

      const orderRes = await api.post('/api/orders/create/', {
        shipping_address: shippingAddressText,
      })
      const order = orderRes.data

      const paymentRes = await api.post('/api/payments/create/', {
        order_id: order?.id,
        payment_method: 'cash_on_delivery',
      })

      await api.post('/api/payments/verify/', {
        payment_id: paymentRes.data?.id,
        transaction_id: paymentRes.data?.transaction_id,
        status: success ? 'completed' : 'failed',
      })

      setShowPaymentModal(false)
      navigate('/dashboard/orders')
    } catch (e) {
      setError('Payment flow failed (backend may require different payload).')
    } finally {
      setShowPaymentModal(false)
      setPaying(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-600">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Checkout</h1>
          <p className="mt-0.5 text-sm text-slate-600">Select a delivery address and confirm payment.</p>
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="card-body">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Address</h2>

            {addresses.length ? (
              <div className="mt-2 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer gap-2 rounded-2xl border border-slate-200/70 p-4 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="addr"
                      value={a.id}
                      checked={String(selectedAddressId) === String(a.id)}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    />
                    <div>
                      <div className="font-bold text-slate-900">{a.full_name || 'Address'}</div>
                      <div className="text-slate-600">
                        {a.address_line1} {a.address_line2}
                      </div>
                      <div className="text-slate-600">
                        {a.city}, {a.state} - {a.pincode}
                      </div>
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedAddressId('')}
                  className="btn-secondary"
                >
                  Add a new address
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No addresses yet. Add one below.</p>
            )}

            {!selectedAddressId ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <input
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input"
                />
                <input
                  placeholder="Phone number"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className="input"
                />
                <input
                  placeholder="Address line 1"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  className="input"
                />
                <input
                  placeholder="Address line 2"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  className="input"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="input"
                  />
                  <input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="input"
                  />
                </div>
                <input
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="input"
                />
              </div>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Order summary</h2>
            <div className="mt-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span>Total items</span>
                <span className="font-medium">{cart?.total_items || 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Total price</span>
                <span className="text-base font-extrabold text-slate-900">₹{cart?.total_price || 0}</span>
              </div>

              <button
                type="button"
                onClick={startPayment}
                className="btn-primary mt-4 w-full"
              >
                Pay now
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Confirm payment</h3>
            <p className="mt-2 text-sm text-slate-600">
              This is a demo popup. Confirm to mark payment successful or cancel to mark payment failed.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={paying}
                onClick={() => doPayment(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={() => doPayment(true)}
                className="btn-primary flex-1"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
