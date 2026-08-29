import { Route, Routes } from 'react-router'

import PublicLayout from './layouts/PublicLayout'

/* =========================================================
   PUBLIC PAGES
========================================================= */

import Home from './pages/Home/Home'
import About from './pages/About/About'
import Services from './pages/Services/Services'
import Fashion from './pages/Fashion/Fashion'
import Portfolio from './pages/Portfolio/Portfolio'
import Contact from './pages/Contact/Contact'
import Booking from './pages/Booking/Booking'
import Enquiry from './pages/Enquiry/Enquiry'

/* =========================================================
   CUSTOMER AUTHENTICATION
========================================================= */

import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AuthCallback from './pages/Auth/AuthCallback'

/* =========================================================
   CUSTOMER ACCOUNT
========================================================= */

import Account from './pages/Account/Account'
import Bookings from './pages/Account/Bookings'
import BookingDetails from './pages/Account/BookingDetails'

/* =========================================================
   ADMIN
========================================================= */

import AdminLogin from './pages/Admin/Login/AdminLogin'
import AdminDashboard from './pages/Admin/Dashboard/Dashboard'
import AdminBookings from './pages/Admin/Bookings/Bookings'
import AdminServices from './pages/Admin/Services/Services'
import AdminPortfolio from './pages/Admin/Portfolio/Portfolio'
import AdminCustomers from './pages/Admin/Customers/Customers'

import AdminLayout from './components/admin/AdminLayout'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'


function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC WEBSITE
      ===================================================== */}

      <Route element={<PublicLayout />}>

        {/* Home */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* Main pages */}

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/fashion"
          element={<Fashion />}
        />

        <Route
          path="/portfolio"
          element={<Portfolio />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* Booking */}

        <Route
          path="/booking"
          element={<Booking />}
        />

        <Route
          path="/enquiry"
          element={<Enquiry />}
        />

        {/* =================================================
            CUSTOMER AUTH
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =================================================
            CUSTOMER ACCOUNT
        ================================================= */}

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/account/bookings"
          element={<Bookings />}
        />

        <Route
          path="/account/bookings/:id"
          element={<BookingDetails />}
        />

      </Route>


      {/* =====================================================
          SUPABASE / GOOGLE AUTH CALLBACK
      ===================================================== */}

      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />


      {/* =====================================================
          ADMIN LOGIN
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />


      {/* =====================================================
          PROTECTED ADMIN APPLICATION
      ===================================================== */}

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >

        {/* Admin dashboard */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* Bookings */}

        <Route
          path="/admin/bookings"
          element={<AdminBookings />}
        />

        {/* Services */}

        <Route
          path="/admin/services"
          element={<AdminServices />}
        />

        {/* Portfolio */}

        <Route
          path="/admin/portfolio"
          element={<AdminPortfolio />}
        />

        {/* Customers */}

        <Route
          path="/admin/customers"
          element={<AdminCustomers />}
        />

      </Route>

    </Routes>
  )
}

export default App