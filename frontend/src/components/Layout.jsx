import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import GlobalCursorFX from './ui/GlobalCursorFX'

export default function Layout() {
  return (
    <div className="content-wrapper min-h-screen flex flex-col">
      <GlobalCursorFX />
      <Navbar />
      <main className="flex-grow container-app py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
