import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export function RequireAuth() {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const role = (user?.role || '').toLowerCase()
  const isAdminRole = role === 'admin' || role === 'staff'
  const isKnownSuperuser =
    user?.email === 'sahildhuri216@gmail.com' || user?.username === 'sahildhuri216'

  const isAdmin = isAdminRole || isKnownSuperuser
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
