import {
  Route,
  Routes,
} from 'react-router-dom'

import ScrollToTop from './components/common/ScrollToTop'

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
import FashionBooking
  from './pages/General Public Pages/FashionBooking/FashionBooking'
import FashionBookingSuccess
  from './pages/General Public Pages/FashionBooking/FashionBookingSuccess'

  import CustomerFashionBooking
  from './pages/Customer/customer_Fashion_Booking/customer_Fashion_Booking'

/* =========================================================
   CUSTOMER AUTHENTICATION
========================================================= */

import CustomerLogin
  from './pages/Customer/Login/CustomerLogin'

import CustomerRegister
  from './pages/Customer/Register/CustomerRegister'

import ForgotPassword
  from './pages/Customer/ForgotPassword'

import AuthCallback
  from './pages/Customer/AuthCallback'

/* =========================================================
   CUSTOMER LAYOUT / PROTECTION
========================================================= */

import CustomerLayout
  from './components/customer/CustomerLayout'

import CustomerProtectedRoute
  from './components/customer/CustomerProtectedRoute'

/* =========================================================
   CUSTOMER PAGES
========================================================= */

import CustomerDashboard
  from './pages/Customer/CustomerDashboard/CustomerDashboard'

import CustomerBeautyDashboard
  from './pages/Customer/CustomerDashboard/CustomerBeautyDashboard/CustomerBeautyDashboard'

import CustomerProfile
  from './pages/Customer/CustomerProfile/CustomerProfile'

import BeautyBookings
  from './pages/Customer/BeautyBookings/BeautyBookings'

import BeautyEnquiries
  from './pages/Customer/BeautyEnquiries/BeautyEnquiries'

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

import AdminLogin
  from './pages/Admin/AdminLogin/AdminLogin'

/* =========================================================
   ADMIN LAYOUT / PROTECTION
========================================================= */

import AdminLayout
  from './components/admin/AdminLayout'

import AdminProtectedRoute
  from './components/admin/AdminProtectedRoute'

/* =========================================================
   ADMIN DASHBOARDS
========================================================= */

import AdminDashboard
  from './pages/Admin/AdminDashboard/AdminDashboard'

import AdminBeautyDashboard
  from './pages/Admin/AdminDashboard/AdminBeautyDashboard/AdminBeautyDashboard'

import AdminFashionDashboard
  from './pages/Admin/AdminDashboard/AdminFashionDashboard/AdminFashionDashboard'

/* =========================================================
   ADMIN BEAUTY SERVICES
========================================================= */

import AdminBeautyServices
  from './pages/Admin/AdminServices/AdminbeautyServices'

import AdminBeautyCategories
  from './pages/Admin/AdminServices/AdminbeautyCategories'

import AdminBeautyCategoryForm
  from './pages/Admin/AdminServices/AdminbeautyCategoryForm'

import AdminBeautyServiceForm
  from './pages/Admin/AdminServices/AdminbeautyServiceForm'

/* =========================================================
   ADMIN BEAUTY BOOKINGS
========================================================= */

import AdminBeautyBookings
  from './pages/Admin/AdminBookings/AdminBeautyBookings'

/* =========================================================
   ADMIN BEAUTY ENQUIRIES
========================================================= */

import AdminbeautyEnquiries
  from './pages/Admin/AdminEnquiries/AdminbeautyEnquiries'

/* =========================================================
   ADMIN BEAUTY OFFERS
========================================================= */

import AdminBeautyOffers
  from './pages/Admin/AdminOffers/AdminBeautyOffers'

/* =========================================================
   ADMIN BEAUTY OP CUSTOMERS
========================================================= */

import OPBeautyCustomers
  from './pages/Admin/OPCustomers/OPBeautyCustomers'

/* =========================================================
   ADMIN FASHION CATEGORIES
========================================================= */

import AdminFashionCategories
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionCategories/AdminFashionCategories'

import AdminFashionCategoryForm
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionCategories/AdminFashionCategoryForm'

  /* =========================================================
   ADMIN FASHION SUBCATEGORIES
========================================================= */

import AdminFashionSubCategories
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionSubCategories/AdminFashionSubCategories'

import AdminFashionSubCategoryForm
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionSubCategories/AdminFashionSubCategoryForm'
/* =========================================================
   ADMIN FASHION DESIGNS
========================================================= */

import AdminFashionDesigns
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionDesigns/AdminFashionDesigns'

import AdminFashionDesignForm
  from './pages/Admin/AdminServices/AdminFashionServices/AdminFashionDesigns/AdminFashionDesignForm'
/* =========================================================
   ADMIN FASHION OFFERS
========================================================= */

import AdminFashionOffers
  from './pages/Admin/AdminOffers/AdminFashionOffers'

import AdminFashionBookings from './pages/Admin/AdminBookings/AdminFashionBookings'
  
function App() {
  return (
    <>
      <ScrollToTop />

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

        <Route
          path="/fashion-booking"
          element={<FashionBooking />}
        />

        <Route
          path="/fashion-booking/success/:orderId"
          element={<FashionBookingSuccess />}
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
          All customer routes are protected.
      ===================================================== */}

      <Route
        element={
          <CustomerProtectedRoute>
            <CustomerLayout />
          </CustomerProtectedRoute>
        }
      >

        {/* ===================================================
            CUSTOMER DASHBOARD
        =================================================== */}

        <Route
          path="/account"
          element={<CustomerDashboard />}
        />

        {/* ===================================================
            CUSTOMER BEAUTY DASHBOARD
        =================================================== */}

        <Route
          path="/customer/beauty"
          element={<CustomerBeautyDashboard />}
        />

        {/* ===================================================
            CUSTOMER PROFILE
        =================================================== */}

        <Route
          path="/account/profile"
          element={<CustomerProfile />}
        />

        {/* ===================================================
            CUSTOMER BEAUTY BOOKINGS
        =================================================== */}

        <Route
          path="/account/bookings/beauty"
          element={<BeautyBookings />}
        />

                {/* ===================================================
            CUSTOMER BEAUTY ENQUIRIES
        =================================================== */}

        <Route
          path="/account/enquiries/beauty"
          element={<BeautyEnquiries />}
        />

        {/* ===================================================
            CUSTOMER FASHION BOOKINGS
        =================================================== */}

        <Route
          path="/account/bookings/fashion"
          element={<CustomerFashionBooking />}
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

          AdminProtectedRoute protects the entire AdminLayout.
          Therefore all nested admin pages are protected.
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
            ADMIN BEAUTY DASHBOARD
        =================================================== */}

        <Route
          path="/admin/beauty"
          element={<AdminBeautyDashboard />}
        />

        {/* ===================================================
            ADMIN FASHION DASHBOARD
        =================================================== */}

        <Route
          path="/admin/fashion"
          element={<AdminFashionDashboard />}
        />


        {/* ===================================================
            BEAUTY SERVICES
        =================================================== */}

        <Route
          path="/admin/services/beauty"
          element={<AdminBeautyServices />}
        />

        {/* ===================================================
            BEAUTY SERVICE CATEGORIES
        =================================================== */}

        <Route
          path="/admin/services/categories"
          element={<AdminBeautyCategories />}
        />

        <Route
          path="/admin/services/categories/new"
          element={<AdminBeautyCategoryForm />}
        />

        <Route
          path="/admin/services/categories/:id/edit"
          element={<AdminBeautyCategoryForm />}
        />

        {/* ===================================================
            BEAUTY SERVICE CREATE / EDIT
        =================================================== */}

        <Route
          path="/admin/services/new"
          element={<AdminBeautyServiceForm />}
        />

        <Route
          path="/admin/services/:id/edit"
          element={<AdminBeautyServiceForm />}
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
            BEAUTY OFFERS
        =================================================== */}

        <Route
          path="/admin/services/offers"
          element={<AdminBeautyOffers />}
        />

        <Route
          path="/admin/services/offers/new"
          element={<AdminBeautyOffers />}
        />

        <Route
          path="/admin/services/offers/:id/edit"
          element={<AdminBeautyOffers />}
        />

        {/* ===================================================
            BEAUTY OFFERS - LEGACY URL
        =================================================== */}

        <Route
          path="/admin/offers/beauty"
          element={<AdminBeautyOffers />}
        />


        {/* ===================================================
            BEAUTY OP CUSTOMERS
        =================================================== */}

        <Route
          path="/admin/op-customers/beauty"
          element={<OPBeautyCustomers />}
        />


        {/* ===================================================
            FASHION SERVICES
           
            Main Fashion Services page.
            This is the URL used by AdminLayout:
            
            /admin/services/fashion
        =================================================== */}

        <Route
          path="/admin/services/fashion"
          element={<AdminFashionDesigns />}
        />


        {/* ===================================================
            FASHION CATEGORIES
           
            Category management is part of the Fashion module.
        =================================================== */}

        <Route
          path="/admin/services/fashion/categories"
          element={<AdminFashionCategories />}
        />

        <Route
          path="/admin/services/fashion/categories/new"
          element={<AdminFashionCategoryForm />}
        />

        <Route
          path="/admin/services/fashion/categories/:categoryId/edit"
          element={<AdminFashionCategoryForm />}
        />

        {/* ===================================================
                FASHION SUBCATEGORIES
            =================================================== */}

            <Route
              path="/admin/services/fashion/subcategories"
              element={<AdminFashionSubCategories />}
            />

            <Route
              path="/admin/services/fashion/subcategories/new"
              element={<AdminFashionSubCategoryForm />}
            />

            <Route
              path="/admin/services/fashion/subcategories/:subcategoryId/edit"
              element={<AdminFashionSubCategoryForm />}
            />

        {/* ===================================================
            FASHION DESIGNS
        =================================================== */}

        <Route
          path="/admin/services/fashion/designs"
          element={<AdminFashionDesigns />}
        />

        <Route
          path="/admin/services/fashion/designs/new"
          element={<AdminFashionDesignForm />}
        />

        <Route
          path="/admin/services/fashion/designs/:designId/edit"
          element={<AdminFashionDesignForm />}
        />

        {/* ===================================================
            FASHION OFFERS
        =================================================== */}
        {/* ===================================================
          ADMIN FASHION OFFERS
        =================================================== */}

        <Route
          path="/admin/services/fashion/offers"
          element={<AdminFashionOffers />}
        />

        <Route
          path="/admin/services/fashion/offers/new"
          element={<AdminFashionOffers />}
        />

        <Route
          path="/admin/services/fashion/offers/:id/edit"
          element={<AdminFashionOffers />}
        />
        {/* ===================================================
            FASHION BOOKINGS
        =================================================== */}

        <Route
          path="/admin/bookings/fashion"
          element={<AdminFashionBookings />}
        />


      </Route>

      </Routes>
    </>
  )
}

export default App