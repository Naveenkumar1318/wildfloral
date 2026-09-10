import {
  Route,
  Routes,
} from 'react-router-dom'

/* =========================================================
   PUBLIC LAYOUT
========================================================= */

import PublicLayout from './layouts/PublicLayout'

/* =========================================================
   GENERAL PUBLIC PAGES
========================================================= */

import Home from './pages/General Public Pages/Home/Home'
import About from './pages/General Public Pages/About/About'
import Services from './pages/General Public Pages/Services/Services'
import Fashion from './pages/General Public Pages/Fashion/Fashion'
import Portfolio from './pages/General Public Pages/Portfolio/Portfolio'
import Contact from './pages/General Public Pages/Contact/Contact'
import Enquiry from './pages/General Public Pages/Enquiry/Enquiry'
import Booking from './pages/General Public Pages/Booking/Booking'

/* =========================================================
   CUSTOMER
========================================================= */

import CustomerLogin from './pages/Customer/Login/CustomerLogin'
import CustomerRegister from './pages/Customer/Register/CustomerRegister'
import CustomerDashboard from './pages/Customer/CustomerDashboard/CustomerDashboard'
import AuthCallback from './pages/Customer/AuthCallback'
import ForgotPassword from './pages/Customer/ForgotPassword'

import CustomerLayout from './components/customer/CustomerLayout'
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute'
import CustomerProfile from './pages/Customer/CustomerProfile/CustomerProfile'
import BeautyBookings from './pages/Customer/BeautyBookings/BeautyBookings'
import BeautyEnquiries from './pages/Customer/BeautyEnquiries/BeautyEnquiries'

/* =========================================================
   ADMIN
========================================================= */

import AdminLogin from './pages/Admin/AdminLogin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard'
import AdminbeautyEnquiries from './pages/Admin/AdminEnquiries/AdminbeautyEnquiries'

/* =========================================================
   ADMIN SERVICES
========================================================= */

import AdminBeautyServices from './pages/Admin/AdminServices/AdminbeautyServices'
import AdminBeautyCategories from './pages/Admin/AdminServices/AdminbeautyCategories'
import AdminBeautyServiceForm from './pages/Admin/AdminServices/AdminbeautyServiceForm'
import AdminBeautyCategoryForm from './pages/Admin/AdminServices/AdminbeautyCategoryForm'


/* =========================================================
   ADMIN OFFERS
========================================================= */

import AdminBeautyOffers from './pages/Admin/AdminOffers/AdminBeautyOffers'
import AdminBeautyBookings from './pages/Admin/AdminBookings/AdminBeautyBookings'

/* =========================================================
   ADMIN LAYOUT / PROTECTION
========================================================= */

import AdminLayout from './components/admin/AdminLayout'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'


function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC WEBSITE
      ===================================================== */}

      <Route
        element={<PublicLayout />}
      >

        <Route
          path="/"
          element={<Home />}
        />

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

        <Route
          path="/enquiry"
          element={<Enquiry />}
        />

        <Route
          path="/booking"
          element={<Booking />}
        />

      </Route>


      {/* =====================================================
          CUSTOMER AUTHENTICATION
      ===================================================== */}

      <Route
        path="/login"
        element={<CustomerLogin />}
      />

      <Route
        path="/register"
        element={<CustomerRegister />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />


      {/* =====================================================
          CUSTOMER APPLICATION
      ===================================================== */}

      <Route
        element={
          <CustomerProtectedRoute>
            <CustomerLayout />
          </CustomerProtectedRoute>
        }
      >

        <Route
          path="/account"
          element={<CustomerDashboard />}
        />

        <Route
          path="/account/bookings/beauty"
          element={<BeautyBookings />}
        />

        <Route
          path="/account/bookings/beauty"
          element={<BeautyBookings />}
        />

        <Route
            path="/account/profile"
            element={<CustomerProfile />}
          />
        <Route
            path="/account/enquiries/beauty"
            element={<BeautyEnquiries />}
          />  

      </Route>


      {/* =====================================================
          ADMIN LOGIN
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />


      {/* =====================================================
          ADMIN APPLICATION
      ===================================================== */}

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >

        {/* ===================================================
            ADMIN DASHBOARD
        =================================================== */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        {/* ===================================================
            BEAUTY SERVICES
        =================================================== */}

        <Route
          path="/admin/services/beauty"
          element={<AdminBeautyServices />}
        />

        {/* ===================================================
            BEAUTY BOOKINGS
        =================================================== */}

        <Route 
          path="/admin/bookings/beauty" 
          element={<AdminBeautyBookings />} 
        />

        {/* ===================================================
            BEAUTY ENQUIRIES
        =================================================== */}

        <Route
          path="/admin/enquiries/beauty"
          element={<AdminbeautyEnquiries />}
        />


        {/* ===================================================
            FASHION SERVICES

            Using the existing service management component
            until a separate fashion service page is created.
        =================================================== */}

        <Route
          path="/admin/services/fashion"
          element={<AdminBeautyServices />}
        />


        {/* ===================================================
            SERVICE CATEGORIES
        =================================================== */}

        <Route
          path="/admin/services/categories"
          element={<AdminBeautyCategories />}
        />

        {/* CREATE CATEGORY */}

        <Route
          path="/admin/services/categories/new"
          element={<AdminBeautyCategoryForm />}
        />

        {/* EDIT CATEGORY */}

        <Route
          path="/admin/services/categories/:id/edit"
          element={<AdminBeautyCategoryForm />}
        />


        {/* ===================================================
            SERVICES
        =================================================== */}

        {/* CREATE SERVICE */}

        <Route
          path="/admin/services/new"
          element={<AdminBeautyServiceForm />}
        />

        {/* EDIT SERVICE */}

        <Route
          path="/admin/services/:id/edit"
          element={<AdminBeautyServiceForm />}
        />


        {/* ===================================================
            OFFERS MANAGEMENT
        =================================================== */}

        {/* ALL OFFERS */}

        <Route
          path="/admin/services/offers"
          element={<AdminBeautyOffers />}
        />

        {/* CREATE OFFER */}

        <Route
          path="/admin/services/offers/new"
          element={<AdminBeautyOffers />}
        />

        {/* EDIT OFFER */}

        <Route
          path="/admin/services/offers/:id/edit"
          element={<AdminBeautyOffers />}
        />


        {/* ===================================================
            LEGACY OFFERS URL
            Keeps existing sidebar/navigation working.
        =================================================== */}

        <Route
          path="/admin/offers/beauty"
          element={<AdminBeautyOffers />}
        />

      </Route>

    </Routes>
  )
}

export default App