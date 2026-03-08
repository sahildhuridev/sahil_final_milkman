import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../app/hooks'
import { clearSession } from '../../features/auth/authSlice'

export default function AdminLayout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive ? 'bg-emerald-200/25 text-white shadow-sm' : 'text-emerald-50 hover:bg-white/10 hover:text-white'
    }`

  const onLogout = () => {
    dispatch(clearSession())
    navigate('/', { replace: true })
  }

  return (
    <div className="content-wrapper min-h-screen flex flex-col">
      <header className="header-footer shadow-md">
        <div className="container-app py-3 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-sm font-extrabold text-white">A</div>
              <div>
                <div className="text-base font-black tracking-tight text-white">Admin Panel</div>
                <div className="text-xs text-emerald-100">Manage products, orders, and customers</div>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/admin/products" className={linkClass}>Products</NavLink>
              <NavLink to="/admin/categories" className={linkClass}>Categories</NavLink>
              <NavLink to="/admin/orders" className={linkClass}>Orders</NavLink>
              <NavLink to="/admin/payments" className={linkClass}>Payments</NavLink>
              <NavLink to="/admin/customers" className={linkClass}>Customers</NavLink>
              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container-app flex-grow py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
