import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-white/20 text-white shadow-lg backdrop-blur-md' 
        : 'text-cyan-100 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
    }`

  return (
    <div className="content-wrapper min-h-screen flex flex-col">
      <header className="header-footer backdrop-blur-xl shadow-lg">
        <div className="container-app flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-sm font-extrabold text-white backdrop-blur-md">
              A
            </div>
            <div className="text-lg font-extrabold text-white">Admin Panel</div>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/admin/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/admin/categories" className={linkClass}>
              Categories
            </NavLink>
            <NavLink to="/admin/orders" className={linkClass}>
              Orders
            </NavLink>
            <NavLink to="/admin/payments" className={linkClass}>
              Payments
            </NavLink>
            <NavLink to="/admin/customers" className={linkClass}>
              Customers
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-grow container-app py-6">
        <Outlet />
      </main>
    </div>
  )
}
