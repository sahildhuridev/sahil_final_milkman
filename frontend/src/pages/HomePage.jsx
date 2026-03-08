import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../app/apiClient'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'

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
      setLoading(true)
      const [cRes, pRes] = await Promise.all([api.get('/api/categories/'), api.get('/api/products/')])

      const catData = Array.isArray(cRes.data) ? cRes.data : cRes.data?.results || []
      const prodData = Array.isArray(pRes.data) ? pRes.data : pRes.data?.results || []

      setCategories(catData)
      setProducts(prodData)
      setLoading(false)
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((p) => String(p.category) === String(selectedCategory))
  }, [products, selectedCategory])

  const minPrice = (p) => {
    const vals = [p.one_time_price, p.monthly_price, p.quarterly_price, p.yearly_price]
      .map((x) => Number(x))
      .filter((x) => !Number.isNaN(x))
    return vals.length ? Math.min(...vals) : 0
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="card overflow-hidden">
        <div className="card-body space-y-6">
          <PageHeader
            eyebrow="Milk Plans"
            title="Fresh dairy products with flexible subscriptions"
            subtitle="Browse by category, compare plan pricing, and add products in one click."
            actions={
              <>
                <Link to="/" className="btn-secondary">
                  Back to Landing
                </Link>
                <button type="button" className="btn-secondary" onClick={() => setSelectedCategory('')}>
                  Reset Filter
                </button>
                <Link to="/cart" className="btn-primary">
                  View Cart
                </Link>
              </>
            }
          />

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={!selectedCategory ? 'btn-primary' : 'btn-secondary'}
              >
                All
              </button>
              {categories.map((c) => (
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

            <div className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] px-4 py-2 text-sm font-semibold text-[var(--ink-700)]">
              Showing {filtered.length} products
            </div>
          </div>
        </div>
      </section>

      {loading ? <LoadingState label="Loading products..." /> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.id}`}
            className="group card overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--surface-1)]">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-[var(--ink-500)]">No image</div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-[var(--ink-900)]">{p.name}</h3>
                <span className="rounded-full bg-[var(--ink-900)] px-3 py-1 text-xs font-extrabold text-white">Rs {minPrice(p)}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-500)]">{p.category_name}</p>
              <p className="mt-3 text-xs font-medium text-[var(--ink-500)]">Plans: {Object.values(planLabel).join(', ')}</p>
            </div>
          </Link>
        ))}
      </section>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try clearing your filters to view all available products."
          action={
            <button type="button" className="btn-primary" onClick={() => setSelectedCategory('')}>
              Show All Products
            </button>
          }
        />
      ) : null}
    </div>
  )
}
