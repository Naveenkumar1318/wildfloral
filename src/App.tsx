import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import ScrollToTop from './components/common/ScrollToTop'

/* =========================================================
   PUBLIC LAYOUT
========================================================= */

import PublicLayout from './layouts/PublicLayout'

/* =========================================================
   CUSTOMER LAYOUT / PROTECTION
========================================================= */

import CustomerLayout from './components/customer/CustomerLayout'
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute'

/* =========================================================
   ADMIN LAYOUT / PROTECTION
========================================================= */

import AdminLayout from './components/admin/AdminLayout'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'

/* =========================================================
   LAZY LOADED PAGES
========================================================= */

const Home = lazy(() => import('./pages/General Public Pages/Home/Home'))
const About = lazy(() => import('./pages/General Public Pages/About/About'))
const Services = lazy(() => import('./pages/General Public Pages/Services/Services'))
const Fashion = lazy(() => import('./pages/General Public Pages/Fashion/Fashion'))
const Contact = lazy(() => import('./pages/General Public Pages/Contact/Contact'))
const Enquiry = lazy(() => import('./pages/General Public Pages/Enquiry/Enquiry'))
const Booking = lazy(() => import('./pages/General Public Pages/Booking/Booking'))
const FashionBooking = lazy(() => import('./pages/General Public Pages/FashionBooking/FashionBooking'))
const FashionBookingSuccess = lazy(() => import('./pages/General Public Pages/FashionBooking/FashionBookingSuccess'))
const PrivacyPolicy = lazy(() => import('./pages/General Public Pages/PrivacyPolicy/PrivacyPolicy'))
const TermsConditions = lazy(() => import('./pages/General Public Pages/TermsConditions/TermsConditions'))
const NotFound = lazy(() => import('./pages/General Public Pages/NotFound/NotFound'))

const CustomerFashionBooking = lazy(() => import('./pages/Customer/customer_Fashion_Booking/customer_Fashion_Booking'))
const CustomerLogin = lazy(() => import('./pages/Customer/Login/CustomerLogin'))
const CustomerRegister = lazy(() => import('./pages/Customer/Register/CustomerRegister'))
const ForgotPassword = lazy(() => import('./pages/Customer/ForgotPassword'))
const AuthCallback = lazy(() => import('./pages/Customer/AuthCallback'))
const CustomerDashboard = lazy(() => import('./pages/Customer/CustomerDashboard/CustomerDashboard'))
const CustomerBeautyDashboard = lazy(() => import('./pages/Customer/CustomerDashboard/CustomerBeautyDashboard/CustomerBeautyDashboard'))
const CustomerFashionDashboard = lazy(() => import('./pages/Customer/CustomerDashboard/CustomerFashionDashboard/CustomerFashionDashboard'))
const CustomerProfile = lazy(() => import('./pages/Customer/CustomerProfile/CustomerProfile'))
const BeautyBookings = lazy(() => import('./pages/Customer/BeautyBookings/BeautyBookings'))
const BeautyEnquiries = lazy(() => import('./pages/Customer/BeautyEnquiries/BeautyEnquiries'))
const FashionEnquiry = lazy(() => import('./pages/Customer/FashionEnquiry/CustomerFashionEnquiry'))

const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard/AdminDashboard'))
const AdminBeautyDashboard = lazy(() => import('./pages/Admin/AdminDashboard/AdminBeautyDashboard/AdminBeautyDashboard'))
const AdminFashionDashboard = lazy(() => import('./pages/Admin/AdminDashboard/AdminFashionDashboard/AdminFashionDashboard'))
const AdminBeautyServices = lazy(() => import('./pages/Admin/AdminServices/AdminbeautyServices'))
const AdminBeautyCategories = lazy(() => import('./pages/Admin/AdminServices/AdminbeautyCategories'))
const AdminBeautyCategoryForm = lazy(() => import('./pages/Admin/AdminServices/AdminbeautyCategoryForm'))
const AdminBeautyServiceForm = lazy(() => import('./pages/Admin/AdminServices/AdminbeautyServiceForm'))
const AdminBeautyBookings = lazy(() => import('./pages/Admin/AdminBookings/AdminBeautyBookings'))
const AdminbeautyEnquiries = lazy(() => import('./pages/Admin/AdminEnquiries/AdminbeautyEnquiries'))
const AdminBeautyOffers = lazy(() => import('./pages/Admin/AdminOffers/AdminBeautyOffers'))
const OPBeautyCustomers = lazy(() => import('./pages/Admin/OPCustomers/OPBeautyCustomers'))

const AdminFashionCategories = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionCategories/AdminFashionCategories'))
const AdminFashionCategoryForm = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionCategories/AdminFashionCategoryForm'))
const AdminFashionSubCategories = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionSubCategories/AdminFashionSubCategories'))
const AdminFashionSubCategoryForm = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionSubCategories/AdminFashionSubCategoryForm'))
const AdminFashionDesigns = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionDesigns/AdminFashionDesigns'))
const AdminFashionDesignForm = lazy(() => import('./pages/Admin/AdminServices/AdminFashionServices/AdminFashionDesigns/AdminFashionDesignForm'))
const AdminFashionOffers = lazy(() => import('./pages/Admin/AdminOffers/AdminFashionOffers'))
const AdminFashionEnquiry = lazy(() => import('./pages/Admin/AdminEnquiries/AdminFashionEnquiry'))
const AdminFashionOPCustomer = lazy(() => import('./pages/Admin/OPCustomers/AdminFashionOPCustomer'))
const AdminFashionBookings = lazy(() => import('./pages/Admin/AdminBookings/AdminFashionBookings'))

function App() {
  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<div>Loading page...</div>}>
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

        <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terms"
          element={<TermsConditions />}
        />

        <Route
          path="*"
          element={<NotFound />}
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

        <Route
          path="/customer/fashion"
          element={<CustomerFashionDashboard />}
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
            CUSTOMER BEAUTY ENQUIRIES and FASHION ENQUIRIES
        =================================================== */}

        <Route
          path="/account/enquiries/beauty"
          element={<BeautyEnquiries />}
        />

        <Route
          path="/account/enquiries/fashion"
          element={<FashionEnquiry />}
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

        {/* ===================================================
            FASHION ENQUIRIES
        =================================================== */} 
        <Route
          path="/admin/enquiries/fashion"
          element={<AdminFashionEnquiry />}
        />
        {/* ===================================================
            FASHION OP CUSTOMERS
        =================================================== */} 

        <Route
          path="/admin/op-customers/fashion"
          element={<AdminFashionOPCustomer />}
        />

      </Route>

        </Routes>
      </Suspense>
    </>
  )
}

export default App