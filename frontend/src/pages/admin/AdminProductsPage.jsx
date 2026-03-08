import { useEffect, useMemo, useState } from 'react'
import { api } from '../../app/apiClient'

const empty = {
  name: '',
  category: '',
  description: '',
  one_time_price: 0,
  monthly_price: 0,
  quarterly_price: 0,
  yearly_price: 0,
  stock_quantity: 300,
  is_active: true,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAllPages = async (url) => {
    let nextUrl = url
    const items = []

    while (nextUrl) {
      const response = await api.get(nextUrl)
      const data = response.data

      if (Array.isArray(data)) {
        items.push(...data)
        break
      }

      items.push(...(data?.results || []))
      nextUrl = data?.next || null
    }

    return items
  }

  const load = async () => {
    const [prodData, catData] = await Promise.all([
      fetchAllPages('/api/products/'),
      fetchAllPages('/api/categories/'),
    ])
    setProducts(prodData)
    setCategories(catData)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load products and categories'))
  }, [])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    )
  }, [products, search])

  const startCreate = () => {
    setSelected(null)
    setForm(empty)
    setImage(null)
  }

  const startEdit = (p) => {
    setSelected(p)
    setForm({
      name: p.name,
      category: p.category,
      description: p.description || '',
      one_time_price: p.one_time_price,
      monthly_price: p.monthly_price,
      quarterly_price: p.quarterly_price,
      yearly_price: p.yearly_price,
      stock_quantity: p.stock_quantity,
      is_active: p.is_active,
    })
    setImage(null)
  }

  const handleOneTimePriceChange = (value) => {
    const oneTime = Number(value)
    const base = Number.isFinite(oneTime) ? oneTime : 0
    setForm((prev) => ({
      ...prev,
      one_time_price: value,
      monthly_price: base * 20,
      quarterly_price: base * 80,
      yearly_price: base * 300,
    }))
  }

  const save = async () => {
    setError('')
    setSaving(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)

      if (selected) {
        await api.put(`/api/products/${selected.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/api/products/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      await load()
      startCreate()
    } catch {
      setError('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p) => {
    setError('')
    try {
      await api.delete(`/api/products/${p.id}/`)
      await load()
      if (selected?.id === p.id) startCreate()
    } catch {
      setError('Failed to delete product')
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-3">
          <h2 className="text-lg font-black text-[var(--ink-900)]">{selected ? `Edit Product #${selected.id}` : 'Create Product'}</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="input"
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="select"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="textarea md:col-span-2"
              rows={3}
            />

            <input
              type="number"
              value={form.one_time_price}
              onChange={(e) => handleOneTimePriceChange(e.target.value)}
              placeholder="One-time price"
              className="input"
            />
            <input
              type="number"
              value={form.monthly_price}
              onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
              placeholder="Monthly price"
              className="input"
            />
            <input
              type="number"
              value={form.quarterly_price}
              onChange={(e) => setForm({ ...form, quarterly_price: e.target.value })}
              placeholder="Quarterly price"
              className="input"
            />
            <input
              type="number"
              value={form.yearly_price}
              onChange={(e) => setForm({ ...form, yearly_price: e.target.value })}
              placeholder="Yearly price"
              className="input"
            />

            <input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              placeholder="Stock quantity"
              className="input"
            />

            <label className="flex items-center gap-2 rounded-xl border border-[var(--line-200)] px-3 py-2 text-sm text-[var(--ink-700)]">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>

            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="input md:col-span-2" />
          </div>

          <button type="button" onClick={save} disabled={saving} className="btn-primary w-full md:w-auto">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-black text-[var(--ink-900)]">Products Management</h1>
            <button onClick={startCreate} className="btn-primary">
              New Product
            </button>
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product/category/description"
            className="input"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredProducts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink-900)]">{p.name}</p>
                    <p className="text-xs text-[var(--ink-500)]">{p.category_name}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--ink-700)]">
                  <p>One-time: Rs {p.one_time_price}</p>
                  <p>Monthly: Rs {p.monthly_price}</p>
                  <p>Quarterly: Rs {p.quarterly_price}</p>
                  <p>Yearly: Rs {p.yearly_price}</p>
                </div>

                <p className="mt-2 text-xs text-[var(--ink-500)]">Stock: {p.stock_quantity}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => startEdit(p)} className="btn-secondary">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
