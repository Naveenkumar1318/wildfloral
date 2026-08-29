import { Route, Routes } from 'react-router'

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

/* =========================================================
   ADMIN
========================================================= */

import AdminLogin from './pages/Admin/AdminLogin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard'

import AdminBeautyServices from './pages/Admin/AdminServices/AdminbeautyServices'
import AdminBeautyCategories from './pages/Admin/AdminServices/AdminbeautyCategories'
import AdminBeautyServiceForm from './pages/Admin/AdminServices/AdminbeautyServiceForm'
import AdminBeautyCategoryForm from './pages/Admin/AdminServices/AdminbeautyCategoryForm'

import AdminLayout from './components/admin/AdminLayout'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'

function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC WEBSITE
      ===================================================== */}

      <Route element={<PublicLayout />}>

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
        {/* DASHBOARD */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* BEAUTY SERVICES */}

        <Route
          path="/admin/services/beauty"
          element={<AdminBeautyServices />}
        />

        {/* BEAUTY CATEGORIES */}

        <Route
          path="/admin/services/categories"
          element={<AdminBeautyCategories />}
        />

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
      </Route>

    </Routes>
  )
}

export default App