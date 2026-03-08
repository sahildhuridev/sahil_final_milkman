import { useEffect, useMemo, useState } from 'react'
import { api } from '../../app/apiClient'

function currency(value) {
  const amount = Number(value || 0)
  return `Rs ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function LineChart({ labels = [], values = [] }) {
  if (!labels.length || !values.length) {
    return <p className="text-sm text-[var(--ink-500)]">Not enough data yet.</p>
  }

  const width = 680
  const height = 260
  const padding = 28
  const maxVal = Math.max(...values, 1)

  const points = values.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(values.length - 1, 1)
    const y = height - padding - (Number(v) / maxVal) * (height - padding * 2)
    return `${x},${y}`
  })

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full rounded-2xl bg-[var(--surface-0)] p-2">
        <polyline
          fill="none"
          stroke="var(--brand-500)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
        {values.map((v, i) => {
          const [x, y] = points[i].split(',').map(Number)
          return <circle key={`${labels[i]}-${i}`} cx={x} cy={y} r="4.5" fill="var(--accent-500)" />
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--ink-500)] sm:grid-cols-6 lg:grid-cols-12">
        {labels.map((label, idx) => (
          <span key={`${label}-${idx}`} className="truncate">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function TopProductsTable({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--ink-500)]">No paid product sales yet.</p>
  }

  const maxQty = Math.max(...items.map((x) => Number(x.total_quantity || 0)), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const qty = Number(item.total_quantity || 0)
        const widthPct = Math.max(6, Math.round((qty / maxQty) * 100))
        return (
          <div key={item.product_id} className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--ink-900)]">{item.product_name}</p>
              <p className="text-xs font-semibold text-[var(--ink-700)]">{currency(item.total_revenue)}</p>
            </div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-white">
              <div
                className="h-full rounded-full"
                style={{ width: `${widthPct}%`, background: 'linear-gradient(90deg, var(--brand-500), var(--accent-500))' }}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-[var(--ink-600)]">
              <span>Qty Sold: {item.total_quantity}</span>
              <span>Times Bought: {item.total_times_bought}</span>
              <span>Orders: {item.distinct_orders}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [sales, setSales] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, salesRes, topRes] = await Promise.all([
          api.get('/api/admin/dashboard/stats/'),
          api.get('/api/admin/dashboard/sales/?days=7'),
          api.get('/api/admin/dashboard/top-products/?limit=8'),
        ])
        setStats(statsRes.data)
        setSales(salesRes.data)
        setTopProducts(topRes.data?.results || [])
      } catch {
        setError('Failed to load dashboard analytics')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const kpis = stats?.kpis || {}
  const paymentBreakdown = stats?.payment_status_breakdown || {}
  const orderBreakdown = stats?.order_status_breakdown || {}

  const summaryCards = useMemo(
    () => [
      { label: 'Total Revenue', value: currency(kpis.total_revenue) },
      { label: 'Total Orders', value: kpis.total_orders || 0 },
      { label: 'Total Customers', value: kpis.total_customers || 0 },
      { label: 'Completed Payments', value: kpis.completed_payments || 0 },
    ],
    [kpis],
  )

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body">
          <h1 className="text-2xl font-black tracking-tight text-[var(--ink-900)]">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--ink-500)]">Revenue, orders, payment health, and top products in one place.</p>
        </div>
      </div>

      {error ? (
        <div className="card">
          <div className="card-body">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="card">
            <div className="card-body">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink-900)]">{loading ? '--' : item.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card">
          <div className="card-body space-y-3">
            <h2 className="text-lg font-black text-[var(--ink-900)]">Sales Trend (Last 7 Days)</h2>
            {loading ? (
              <p className="text-sm text-[var(--ink-500)]">Loading chart...</p>
            ) : (
              <LineChart labels={sales?.labels || []} values={sales?.revenue || []} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-black text-[var(--ink-900)]">Status Overview</h2>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[var(--ink-700)]">Payments</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Pending: {paymentBreakdown.pending || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Completed: {paymentBreakdown.completed || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Failed: {paymentBreakdown.failed || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Refunded: {paymentBreakdown.refunded || 0}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[var(--ink-700)]">Orders</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Pending: {orderBreakdown.pending || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Confirmed: {orderBreakdown.confirmed || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Shipped: {orderBreakdown.shipped || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2">Delivered: {orderBreakdown.delivered || 0}</div>
                <div className="rounded-xl border border-[var(--line-200)] bg-[var(--surface-0)] px-3 py-2 col-span-2">Cancelled: {orderBreakdown.cancelled || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-3">
          <h2 className="text-lg font-black text-[var(--ink-900)]">Top Products Sold</h2>
          <p className="text-xs text-[var(--ink-500)]">Includes total quantity sold and total times bought.</p>
          {loading ? <p className="text-sm text-[var(--ink-500)]">Loading product analytics...</p> : <TopProductsTable items={topProducts} />}
        </div>
      </section>
    </div>
  )
}
