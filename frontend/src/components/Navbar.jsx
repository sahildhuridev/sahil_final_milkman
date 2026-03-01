import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { clearSession } from '../features/auth/authSlice'

export default function Navbar() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const serverTotal = useAppSelector((s) => s.cart.serverCart?.total_items)
  const guestTotal = useAppSelector((s) => s.cart.guestItems?.reduce((a, i) => a + (i.quantity || 0), 0))

  const cartCount = user ? (serverTotal || 0) : (guestTotal || 0)

  const onLogout = () => {
    dispatch(clearSession())
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-white/20 text-white shadow-lg backdrop-blur-md' 
        : 'text-cyan-100 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
    }`

  return (
    <header className="header-footer sticky top-0 z-50 backdrop-blur-xl shadow-lg">
      <div className="container-app flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-sm font-extrabold text-white backdrop-blur-md transition-all duration-200 group-hover:bg-white/30 group-hover:scale-105">
            M
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-white">Milkman</div>
            <div className="text-xs text-cyan-100">Fresh subscription milk</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>

          <NavLink to="/cart" className={linkClass}>
            <span className="flex items-center gap-2">
              Cart
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-cyan-600 shadow-lg">{cartCount}</span>
            </span>
          </NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard/orders" className={linkClass}>
                Orders
              </NavLink>
              <button type="button" onClick={onLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/signup" className="btn-primary">
                Signup
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
