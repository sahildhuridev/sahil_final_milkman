import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'
import LoadingState from '../components/ui/LoadingState'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()

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

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [cartRes, addrRes] = await Promise.all([api.get('/api/cart/'), api.get('/api/addresses/')])
      setCart(cartRes.data)
      const addrData = Array.isArray(addrRes.data) ? addrRes.data : addrRes.data?.results || []
      setAddresses(addrData)
      if (addrData.length) setSelectedAddressId(String(addrData[0].id))
    } catch {
      setError('Failed to load checkout')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const formatAddress = (a) => {
    if (!a) return ''
    return `${a.address_line || ''}, ${a.city || ''}, ${a.state || ''} - ${a.pincode || ''}`.trim()
  }

  const createAddress = async () => {
    const res = await api.post('/api/addresses/create/', {
      address_line: `${form.address_line1}${form.address_line2 ? `, ${form.address_line2}` : ''}`,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      is_default: true,
    })
    const created = res.data
    setAddresses((prev) => [created, ...prev])
    setSelectedAddressId(String(created.id))
    return created
  }

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search)
      const paypalStatus = params.get('paypal')
      const token = params.get('token')
      const paymentId = params.get('payment_id')

      if (!paypalStatus) return

      setPaying(true)
      setError('')
      setNotice('')

      try {
        if (paypalStatus === 'success') {
          if (!token) {
            setError('Missing PayPal token in callback.')
            return
          }

          await api.post('/api/payments/paypal/capture/', {
            paypal_order_id: token,
            payment_id: paymentId ? Number(paymentId) : undefined,
          })

          navigate('/dashboard/orders', { replace: true })
          return
        }

        if (paypalStatus === 'cancel') {
          if (paymentId) {
            await api.post('/api/payments/paypal/cancel/', {
              payment_id: Number(paymentId),
            })
          }
          setNotice('PayPal payment was cancelled. The payment is marked as failed.')
          navigate('/checkout', { replace: true })
          return
        }
      } catch (e) {
        setError(e?.response?.data?.error || 'PayPal callback processing failed.')
      } finally {
        setPaying(false)
      }
    }

    run()
  }, [location.search, navigate])

  const startPaypalPayment = async () => {
    setPaying(true)
    setError('')
    setNotice('')

    try {
      const cartRes = await api.get('/api/cart/')
      setCart(cartRes.data)
      if (!cartRes.data?.items?.length) {
        setError('Cart is empty')
        return
      }

      if (!selectedAddressId && (!form.address_line1 || !form.city || !form.pincode)) {
        setError('Select an address or add a new one')
        return
      }

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

      const paymentRes = await api.post('/api/payments/create/', {
        order_id: orderRes.data?.id,
        payment_method: 'paypal',
      })

      const approvalUrl = paymentRes.data?.approval_url
      if (!approvalUrl) {
        setError('Failed to initialize PayPal approval URL.')
        return
      }

      window.location.href = approvalUrl
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to start PayPal payment flow.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <LoadingState label="Loading checkout..." />

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Checkout"
            title="Confirm address and complete payment"
            subtitle="Pay with PayPal. Payment session expires in 5 minutes if not completed."
          />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {notice ? <p className="text-sm font-medium text-amber-700">{notice}</p> : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-[var(--ink-900)]">Address</h2>

              {addresses.length ? (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer gap-2 rounded-2xl border border-[var(--line-200)] p-4 text-sm hover:bg-[var(--surface-0)]"
                    >
                      <input
                        type="radio"
                        name="addr"
                        value={a.id}
                        checked={String(selectedAddressId) === String(a.id)}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                      />
                      <div className="text-[var(--ink-700)]">
                        <div className="font-bold text-[var(--ink-900)]">Address #{a.id}</div>
                        <div>{formatAddress(a)}</div>
                      </div>
                    </label>
                  ))}

                  <button type="button" onClick={() => setSelectedAddressId('')} className="btn-secondary">
                    Add a New Address
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-500)]">No saved addresses. Add one below.</p>
              )}

              {!selectedAddressId ? (
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
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

            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-[var(--ink-900)]">Order summary</h2>
              <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-700)]">Total items</span>
                  <span className="font-semibold text-[var(--ink-900)]">{cart?.total_items || 0}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[var(--ink-700)]">Total price</span>
                  <span className="text-xl font-black text-[var(--ink-900)]">Rs {cart?.total_price || 0}</span>
                </div>

                <button
                  type="button"
                  onClick={startPaypalPayment}
                  disabled={paying}
                  className="btn-primary mt-4 w-full disabled:opacity-60"
                >
                  {paying ? 'Redirecting to PayPal...' : 'Pay with PayPal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
