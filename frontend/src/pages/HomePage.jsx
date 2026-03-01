import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../app/apiClient'

const planLabel = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      const [cRes, pRes] = await Promise.all([
        api.get('/api/categories/'),
        api.get('/api/products/'),
      ])

      const catData = Array.isArray(cRes.data) ? cRes.data : cRes.data?.results || []
      const prodData = Array.isArray(pRes.data) ? pRes.data : pRes.data?.results || []

      setCategories(catData)
      setProducts(prodData)
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((p) => {
      const catId = p.category
      return String(catId) === String(selectedCategory)
    })
  }, [products, selectedCategory])

  const minPrice = (p) => {
    const vals = [p.one_time_price, p.monthly_price, p.quarterly_price, p.yearly_price]
      .map((x) => Number(x))
      .filter((x) => !Number.isNaN(x))
    return vals.length ? Math.min(...vals) : 0
  }

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="card-body">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Subscription-ready
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                Fast checkout
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Fresh milk delivered.
                <span className="block text-slate-600">One-time or subscription plans.</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Pick your favorite milk, select a plan, and manage everything from your dashboard.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary" onClick={() => setSelectedCategory('')}>
                  Browse all
                </button>
                <Link to="/cart" className="btn-secondary">
                  Go to cart
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Filter by category</div>
                  <div className="text-xs text-slate-500">Select to instantly filter products</div>
                </div>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select w-56">
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={!selectedCategory ? 'btn-primary' : 'btn-secondary'}
                >
                  All
                </button>
                {categories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(String(c.id))}
                    className={String(selectedCategory) === String(c.id) ? 'btn-primary' : 'btn-secondary'}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Products</h2>
            <p className="text-sm text-slate-600">Choose a plan at product page and add to cart.</p>
          </div>
          <div className="text-sm font-semibold text-slate-700">{filtered.length} items</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No image</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold leading-tight text-slate-900">{p.name}</h3>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
                    From ₹{minPrice(p)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{p.category_name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Plans: {Object.values(planLabel).join(', ')}</p>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {loading ? <p className="mt-4 text-sm text-slate-600">Loading...</p> : null}
      </section>
    </div>
  )
}
