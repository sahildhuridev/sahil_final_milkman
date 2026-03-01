import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

const empty = {
  name: '',
  category: '',
  description: '',
  one_time_price: 0,
  monthly_price: 0,
  quarterly_price: 0,
  yearly_price: 0,
  stock_quantity: 0,
  is_active: true,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const [pRes, cRes] = await Promise.all([api.get('/api/products/'), api.get('/api/categories/')])
    const prodData = Array.isArray(pRes.data) ? pRes.data : pRes.data?.results || []
    const catData = Array.isArray(cRes.data) ? cRes.data : cRes.data?.results || []
    setProducts(prodData)
    setCategories(catData)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load'))
  }, [])

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

  const save = async () => {
    setError('')
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
    } catch (e) {
      setError('Failed to save product')
    }
  }

  const remove = async (p) => {
    setError('')
    try {
      await api.delete(`/api/products/${p.id}/`)
      await load()
    } catch (e) {
      setError('Failed to delete product')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Products</h1>
          <button onClick={startCreate} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
            New
          </button>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-gray-600">{p.category_name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(p)} className="text-sm font-medium text-blue-600">
                  Edit
                </button>
                <button onClick={() => remove(p)} className="text-sm font-medium text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">{selected ? `Edit #${selected.id}` : 'Create product'}</h2>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="rounded-md border px-3 py-2 text-sm"
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-md border bg-white px-3 py-2 text-sm"
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
            className="rounded-md border px-3 py-2 text-sm"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.one_time_price}
              onChange={(e) => setForm({ ...form, one_time_price: e.target.value })}
              placeholder="One-time price"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.monthly_price}
              onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
              placeholder="Monthly price"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.quarterly_price}
              onChange={(e) => setForm({ ...form, quarterly_price: e.target.value })}
              placeholder="Quarterly price"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.yearly_price}
              onChange={(e) => setForm({ ...form, yearly_price: e.target.value })}
              placeholder="Yearly price"
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              placeholder="Stock quantity"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />

          <button
            type="button"
            onClick={save}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
