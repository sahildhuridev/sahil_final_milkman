import { useEffect, useState } from 'react'
import { api } from '../../app/apiClient'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await api.get('/api/categories/')
    const data = Array.isArray(res.data) ? res.data : res.data?.results || []
    setCategories(data)
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load'))
  }, [])

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
    try {
      if (editing) {
        await api.put(`/api/categories/${editing.id}/`, { name, description, is_active: true })
      } else {
        await api.post('/api/categories/', { name, description, is_active: true })
      }
      await load()
      startCreate()
    } catch (e) {
      setError('Failed to save category')
    }
  }

  const remove = async (c) => {
    setError('')
    try {
      await api.delete(`/api/categories/${c.id}/`)
      await load()
    } catch (e) {
      setError('Failed to delete category')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Categories</h1>
          <button onClick={startCreate} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
            New
          </button>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-gray-600">{c.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(c)} className="text-sm font-medium text-blue-600">
                  Edit
                </button>
                <button onClick={() => remove(c)} className="text-sm font-medium text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">{editing ? `Edit #${editing.id}` : 'Create category'}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="rounded-md border px-3 py-2 text-sm"
            rows={3}
          />
          <button onClick={save} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
