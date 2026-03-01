import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="content-wrapper min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container-app py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
