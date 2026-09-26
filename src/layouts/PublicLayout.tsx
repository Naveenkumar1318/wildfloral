import { Outlet, useLocation } from 'react-router-dom'

import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function PublicLayout() {
  const location = useLocation()

  const isHomePage = location.pathname === '/'

  return (
    <>
      <Navbar />

      <main
        className={`public-main ${
          isHomePage ? 'public-main-home' : ''
        }`}
      >
        <Outlet />
      </main>

      <Footer />
    </>
  )
}

export default PublicLayout