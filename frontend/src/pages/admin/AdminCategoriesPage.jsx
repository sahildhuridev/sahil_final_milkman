import { useEffect, useMemo, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await api.get('/api/categories/')
    const data = Array.isArray(res.data) ? res.data : res.data?.results || []
    setCategories(data)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load categories'))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q),
    )
  }, [categories, search])

  const startCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
  }

  const startEdit = (c) => {
    setEditing(c)
    setName(c.name)
    setDescription(c.description || '')
  }

  const save = async () => {
    setError('')
    setSaving(true)

    try {
      if (editing) {
        await api.put(`/api/categories/${editing.id}/`, { name, description, is_active: true })
      } else {
        await api.post('/api/categories/', { name, description, is_active: true })
      }
      await load()
      startCreate()
    } catch {
      setError('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    setError('')
    try {
      await api.delete(`/api/categories/${c.id}/`)
      await load()
      if (editing?.id === c.id) startCreate()
    } catch {
      setError('Failed to delete category')
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-black text-[var(--ink-900)]">Categories Management</h1>
            <button onClick={startCreate} className="btn-primary">
              New Category
            </button>
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories"
            className="input"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[var(--line-200)] bg-[var(--surface-0)] p-4">
                <p className="text-sm font-bold text-[var(--ink-900)]">{c.name}</p>
                <p className="mt-1 text-xs text-[var(--ink-500)]">{c.description || 'No description'}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => startEdit(c)} className="btn-secondary">
                    Edit
                  </button>
                  <button onClick={() => remove(c)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-3">
          <h2 className="text-lg font-black text-[var(--ink-900)]">{editing ? `Edit Category #${editing.id}` : 'Create Category'}</h2>

          <div className="grid grid-cols-1 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="input"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="textarea"
              rows={3}
            />
          </div>

          <button onClick={save} disabled={saving} className="btn-primary w-full md:w-auto">
            {saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  )
}
