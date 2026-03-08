import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="header-footer mt-auto text-on-dark">
      <div className="container-app py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-sm font-extrabold text-white">
                M
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight text-white">Milkman</div>
                <div className="text-xs text-emerald-100">Fresh milk subscriptions</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-emerald-100">
              Milk and dairy essentials with flexible plans and a clean checkout flow.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-emerald-100 hover:text-white">Home</Link></li>
              <li><Link to="/products" className="text-emerald-100 hover:text-white">Products</Link></li>
              <li><Link to="/cart" className="text-emerald-100 hover:text-white">Cart</Link></li>
              <li><Link to="/login" className="text-emerald-100 hover:text-white">Login</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white">Customer</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard/orders" className="text-emerald-100 hover:text-white">My Orders</Link></li>
              <li><Link to="/checkout" className="text-emerald-100 hover:text-white">Checkout</Link></li>
              <li><Link to="/admin/login" className="text-emerald-100 hover:text-white">Admin Login</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white">Support</h3>
            <ul className="space-y-2 text-sm text-emerald-100">
              <li>Daily delivery support</li>
              <li>Secure checkout</li>
              <li>Flexible subscription plans</li>
              <li>Order tracking</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright {year} Milkman. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/products" className="hover:text-white">Products</Link>
              <Link to="/cart" className="hover:text-white">Cart</Link>
              <Link to="/dashboard/orders" className="hover:text-white">My Orders</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
