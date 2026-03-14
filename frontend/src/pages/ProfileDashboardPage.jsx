import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'
import LoadingState from '../components/ui/LoadingState'
import EmptyState from '../components/ui/EmptyState'

function OrderItems({ items }) {
  if (!items?.length) return <p className="text-sm text-[var(--ink-500)]">No items found.</p>

  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-[var(--line-200)] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[var(--ink-900)]">{item.product?.name || 'Product'}</p>
              <p className="text-xs text-[var(--ink-500)]">
                Plan: {item.plan_type} | Qty: {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--ink-900)]">Rs {item.total_price || item.price_at_purchase}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfileDashboardPage() {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ username: '', phone_number: '' })
  const [photoFile, setPhotoFile] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get('/api/auth/profile/'),
        api.get('/api/orders/'),
      ])

      const profileData = profileRes.data
      const orderData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.results || []

      setProfile(profileData)
      setOrders(orderData)
      setForm({
        username: profileData?.username || '',
        phone_number: profileData?.phone_number || '',
      })
    } catch {
      setError('Failed to load dashboard information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  }, [orders])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const body = new FormData()
      body.append('username', form.username)
      body.append('phone_number', form.phone_number)
      if (photoFile) {
        body.append('profile_photo', photoFile)
      }

      const res = await api.put('/api/auth/profile/update/', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setProfile(res.data)
      setPhotoFile(null)
      setSuccess('Profile updated successfully.')
    } catch {
      setError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading dashboard..." />

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-5">
          <PageHeader
            eyebrow="Customer Dashboard"
            title="Manage profile and view your order history"
            subtitle="You can update your name, phone and photo. Email address is locked."
            actions={<Link to="/dashboard/orders" className="btn-secondary">Open Orders Page</Link>}
          />

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-[var(--line-200)] bg-white">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="Profile" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-bold text-[var(--ink-500)]">No Photo</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--ink-900)]">{profile?.username}</p>
                  <p className="text-xs text-[var(--ink-500)]">Joined: {profile?.date_joined}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-[var(--ink-700)]">Email (cannot be changed)</label>
                  <input value={profile?.email || ''} disabled className="input mt-1 cursor-not-allowed bg-slate-100" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--ink-700)]">Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="input mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--ink-700)]">Phone number</label>
                  <input
                    value={form.phone_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--ink-700)]">Profile photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="input mt-1"
                  />
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-[var(--line-200)] bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Total Orders</p>
                  <p className="mt-1 text-2xl font-black text-[var(--ink-900)]">{orders.length}</p>
                </div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Total Spent</p>
                  <p className="mt-1 text-2xl font-black text-[var(--ink-900)]">Rs {totalSpent.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-bold text-[var(--ink-900)]">Previous Orders</p>
                {!orders.length ? (
                  <div className="mt-3">
                    <EmptyState title="No orders yet" description="Place an order to see details here." />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 max-h-[28rem] overflow-auto pr-1">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[var(--ink-900)]">Order #{order.id}</p>
                            <p className="text-xs text-[var(--ink-500)]">{order.created_at}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[var(--ink-900)]">Rs {order.total_amount}</p>
                            <p className="text-xs text-[var(--ink-500)]">{order.status}</p>
                          </div>
                        </div>

                        <OrderItems items={order.items} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
