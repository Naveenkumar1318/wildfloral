import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router'

import { supabase } from '../../lib/supabase'

import './CustomerLayout.css'

type IconType =
  | 'dashboard'
  | 'bookings'
  | 'profile'
  | 'website'
  | 'logout'
  | 'logo'

type IconProps = {
  type: IconType
}

function Icon({ type }: IconProps) {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
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
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        <path
          d="M8 3v4M16 3v4M4 10h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),

    profile: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        <path
          d="M5 20c.7-3.4 3.1-5.3 7-5.3s6.3 1.9 7 5.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),

    website: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        <path
          d="M4 12h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        <path
          d="M12 4c2 2.2 3 4.8 3 8s-1 5.8-3 8c-2-2.2-3-4.8-3-8s1-5.8 3-8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    ),

    logout: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        <path
          d="m14 8 4 4-4 4M18 12H9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
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

  return icons[type]
}

function CustomerSidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <aside className="customer-sidebar">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <Link
        to="/account"
        className="customer-sidebar-brand"
        aria-label="WildFloral Customer Account"
      >
        <span className="customer-sidebar-logo">
          <Icon type="logo" />
        </span>

        <span className="customer-sidebar-brand-content">
          <strong>WildFloral</strong>
          <small>MY ACCOUNT</small>
        </span>
      </Link>

      {/* =====================================================
          MENU
      ===================================================== */}

      <div className="customer-sidebar-section-title">
        MENU
      </div>

      <nav
        className="customer-sidebar-nav"
        aria-label="Customer navigation"
      >

        {/* DASHBOARD */}

        <NavLink
          to="/account"
          end
          className={({ isActive }) =>
            `customer-nav-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-nav-icon">
            <Icon type="dashboard" />
          </span>

          <span className="customer-nav-label">
            Dashboard
          </span>
        </NavLink>

        {/* BOOKINGS */}

        <div className="customer-nav-group">

          <div className="customer-nav-parent">
            <span className="customer-nav-icon">
              <Icon type="bookings" />
            </span>

            <span className="customer-nav-label">
              Bookings
            </span>
          </div>

          <div className="customer-nav-submenu">

            <NavLink
              to="/account/bookings/beauty"
              className={({ isActive }) =>
                `customer-nav-subitem ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="customer-subitem-dot" />

              <span>
                Beauty Services
              </span>
            </NavLink>

            <NavLink
              to="/account/bookings/fashion"
              className={({ isActive }) =>
                `customer-nav-subitem ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="customer-subitem-dot" />

              <span>
                Fashion Services
              </span>
            </NavLink>

          </div>

        </div>

        {/* PROFILE */}

        <NavLink
          to="/account/profile"
          className={({ isActive }) =>
            `customer-nav-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-nav-icon">
            <Icon type="profile" />
          </span>

          <span className="customer-nav-label">
            Profile
          </span>
        </NavLink>

      </nav>

      {/* =====================================================
          BOTTOM
      ===================================================== */}

      <div className="customer-sidebar-bottom">

        <Link
          to="/"
          className="customer-bottom-item"
        >
          <span className="customer-bottom-icon">
            <Icon type="website" />
          </span>

          <span>
            Back to Website
          </span>
        </Link>

        <button
          type="button"
          className="customer-bottom-item customer-logout"
          onClick={handleLogout}
        >
          <span className="customer-bottom-icon">
            <Icon type="logout" />
          </span>

          <span>
            Logout
          </span>
        </button>

      </div>

    </aside>
  )
}

export default CustomerSidebar