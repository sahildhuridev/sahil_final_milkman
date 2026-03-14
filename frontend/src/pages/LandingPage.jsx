import { Link } from 'react-router-dom'
import MilkPourSlider from '../components/landing/MilkPourSlider'

export default function LandingPage() {
  return (
    <div className="relative isolate space-y-12 overflow-hidden pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--line-200)] bg-[var(--surface-2)] px-6 py-10 shadow-sm sm:px-10 sm:py-12">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-100/70 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-amber-100/80 blur-2xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="pill">Daily Freshness Delivered</span>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[var(--ink-900)] sm:text-4xl lg:text-5xl">
              Milk subscriptions built for modern households
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-700)] sm:text-base">
              Milkman helps you discover quality dairy products, pick one-time or recurring plans, and manage orders from a single dashboard.
              Designed for speed, convenience, and reliable doorstep delivery.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/products" className="btn-primary">Browse Products</Link>
              <Link to="/signup" className="btn-secondary">Create Account</Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Plans</p>
                <p className="mt-1 text-xl font-black text-[var(--ink-900)]">4 Types</p>
              </div>
              <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Checkout</p>
                <p className="mt-1 text-xl font-black text-[var(--ink-900)]">Fast</p>
              </div>
              <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">Dashboard</p>
                <p className="mt-1 text-xl font-black text-[var(--ink-900)]">Live Orders</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <MilkPourSlider
              framesPath="/milk-pour-frames-webp"
              frameCount={106}
              startFrame={16}
              framePrefix="frame_"
              extension="webp"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <h2 className="text-base font-black text-[var(--ink-900)]">Curated Products</h2>
            <p className="mt-2 text-sm text-[var(--ink-700)]">Explore categories and compare plan pricing with a clean product catalog.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="text-base font-black text-[var(--ink-900)]">Smooth Checkout</h2>
            <p className="mt-2 text-sm text-[var(--ink-700)]">Saved addresses, payment simulation, and quick order creation flow.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="text-base font-black text-[var(--ink-900)]">Order Tracking</h2>
            <p className="mt-2 text-sm text-[var(--ink-700)]">Keep track of statuses, payment state, and order details from your dashboard.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--line-200)] bg-[var(--ink-900)] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Ready to get started?</h2>
            <p className="mt-1 text-sm text-emerald-100">Browse products and set up your first milk delivery plan today.</p>
          </div>
          <Link to="/products" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
            Go to Products
          </Link>
        </div>
      </section>
    </div>
  )
}
