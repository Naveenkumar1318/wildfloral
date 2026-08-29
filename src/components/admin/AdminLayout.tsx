import {
  NavLink,
  Link,
  Outlet,
  useNavigate,
} from 'react-router'

import { supabase } from '../../lib/supabase'

import './AdminLayout.css'

function Icon({ type }) {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),

    bookings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="4"
          y="5"
          width="16"
          height="16"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8 3v4M16 3v4M4 10h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),

    services: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3 5 6v5c0 4.7 2.9 8.2 7 10 4.1-1.8 7-5.3 7-10V6l-7-3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    portfolio: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="15"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle
          cx="8"
          cy="10"
          r="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="m5 17 4-4 3 3 3-4 4 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    customers: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M5 20c.7-3.4 3.1-5.3 7-5.3s6.3 1.9 7 5.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),

    website: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5s-1.1 6.2-3.2 8.5c-2.1-2.3-3.2-5.1-3.2-8.5S9.9 5.8 12 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),

    logout: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M14 8l4 4-4 4M18 12H9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    logo: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M14 20V12h20v8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="10"
          y="18"
          width="28"
          height="21"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M18 29c2-5 10-5 12 0M24 24v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  }

  return icons[type] || null
}

function AdminLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()

    navigate('/admin/login', {
      replace: true,
    })
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: 'dashboard',
      end: true,
    },
    {
      label: 'Bookings',
      path: '/admin/bookings',
      icon: 'bookings',
    },
    {
      label: 'Services',
      path: '/admin/services',
      icon: 'services',
    },
    {
      label: 'Portfolio',
      path: '/admin/portfolio',
      icon: 'portfolio',
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: 'customers',
    },
  ]

  return (
    <div className="admin-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        {/* LOGO */}
        <Link
          to="/admin"
          className="admin-sidebar-logo"
          aria-label="WildFloral Admin"
        >
          <Icon type="logo" />
        </Link>

        {/* NAVIGATION */}
        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="admin-nav-icon">
                <Icon type={item.icon} />
              </span>

              <span className="admin-nav-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM */}
        <div className="admin-sidebar-bottom">

          <Link
            to="/"
            className="admin-nav-item admin-website-link"
          >
            <span className="admin-nav-icon">
              <Icon type="website" />
            </span>

            <span className="admin-nav-label">
              View Website
            </span>
          </Link>

          <button
            type="button"
            className="admin-nav-item admin-logout"
            onClick={handleLogout}
          >
            <span className="admin-nav-icon">
              <Icon type="logout" />
            </span>

            <span className="admin-nav-label">
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="admin-main">

        <header className="admin-header">
          <div>
            <span className="admin-header-eyebrow">
              WILDFLORAL
            </span>

            <h1>
              Administration
            </h1>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>

      </main>

    </div>
  )
}

export default AdminLayout