import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { clearSession } from '../features/auth/authSlice'

export default function Navbar() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const serverTotal = useAppSelector((s) => s.cart.serverCart?.total_items)
  const guestTotal = useAppSelector((s) => s.cart.guestItems?.reduce((a, i) => a + (i.quantity || 0), 0))

  const cartCount = user ? (serverTotal || 0) : (guestTotal || 0)

  const onLogout = () => {
    dispatch(clearSession())
    setMobileOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMobileOpen(false)

  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-emerald-200/25 text-white shadow-sm' 
        : 'text-emerald-50 hover:bg-white/10 hover:text-white'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive ? 'bg-white text-[var(--ink-900)]' : 'text-emerald-50 hover:bg-white/10'
    }`

  return (
    <header className="header-footer sticky top-0 z-50 shadow-md">
      <div className="container-app py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group" onClick={closeMenu}>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-sm font-extrabold text-white transition-all duration-200 group-hover:bg-white/30">
              M
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight text-white">Milkman</div>
              <div className="text-xs text-emerald-100">Fresh milk subscriptions</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              <span className="flex items-center gap-2">
                Cart
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--ink-900)]">
                  {cartCount}
                </span>
              </span>
            </NavLink>

            {user ? (
              <>
                <NavLink to="/dashboard/profile" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/orders" className={linkClass}>
                  Orders
                </NavLink>
                <button type="button" onClick={onLogout} className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
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

          <button
            type="button"
            className="btn-secondary border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 md:hidden"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {mobileOpen ? (
          <nav className="mt-3 grid gap-2 rounded-2xl border border-white/20 bg-white/5 p-3 md:hidden">
            <NavLink to="/" className={mobileLinkClass} end onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/products" className={mobileLinkClass} onClick={closeMenu}>
              Products
            </NavLink>
            <NavLink to="/cart" className={mobileLinkClass} onClick={closeMenu}>
              <span className="flex items-center justify-between">
                <span>Cart</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--ink-900)]">{cartCount}</span>
              </span>
            </NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard/profile" className={mobileLinkClass} onClick={closeMenu}>
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/orders" className={mobileLinkClass} onClick={closeMenu}>
                  Orders
                </NavLink>
                <button type="button" onClick={onLogout} className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={mobileLinkClass} onClick={closeMenu}>
                  Login
                </NavLink>
                <NavLink to="/signup" className="btn-primary" onClick={closeMenu}>
                  Signup
                </NavLink>
              </>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  )
}
