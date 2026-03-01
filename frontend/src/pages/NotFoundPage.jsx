import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">The page you requested does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600">
        Go home
      </Link>
    </div>
  )
}
