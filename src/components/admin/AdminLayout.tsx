import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import { supabase } from '../../lib/supabase'

import './AdminLayout.css'


type IconType =
  | 'dashboard'
  | 'bookings'
  | 'services'
  | 'website'
  | 'logout'
  | 'logo'


type IconProps = {
  type: IconType
}


function Icon({ type }: IconProps) {

  const icons = {

    /* =====================================================
       DASHBOARD
    ===================================================== */

    dashboard: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="6"
          height="6"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="14"
          y="4"
          width="6"
          height="6"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="4"
          y="14"
          width="6"
          height="6"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <rect
          x="14"
          y="14"
          width="6"
          height="6"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),


    /* =====================================================
       BOOKINGS
    ===================================================== */

    bookings: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
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

        <path
          d="M8 14h2M14 14h2M8 17h2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),


    /* =====================================================
       SERVICES
    ===================================================== */

    services: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
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


    /* =====================================================
       WEBSITE
    ===================================================== */

    website: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />

        <path
          d="M3.8 12h16.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="M12 3.5c2.1 2.3 3.1 5.1 3.1 8.5s-1 6.2-3.1 8.5c-2.1-2.3-3.1-5.1-3.1-8.5s1-6.2 3.1-8.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),


    /* =====================================================
       LOGOUT
    ===================================================== */

    logout: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <path
          d="m14 8 4 4-4 4M18 12H9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),


    /* =====================================================
       LOGO
    ===================================================== */

    logo: (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
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


function AdminLayout() {

  const navigate = useNavigate()


  async function handleLogout() {

    await supabase.auth.signOut()

    navigate(
      '/admin/login',
      {
        replace: true,
      },
    )
  }


  return (
    <div className="admin-layout">

      {/* =================================================
          FIXED SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">


        {/* =================================================
            BRAND
        ================================================= */}

        <Link
          to="/admin"
          className="admin-sidebar-brand"
        >

          <span className="admin-sidebar-logo">
            <Icon type="logo" />
          </span>


          <span className="admin-sidebar-brand-content">

            <strong>
              WildFloral
            </strong>

            <small>
              ADMINISTRATION
            </small>

          </span>

        </Link>


        {/* =================================================
            MENU TITLE
        ================================================= */}

        <div className="admin-sidebar-section-title">
          MENU
        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
        >


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-item ${
                isActive
                  ? 'active'
                  : ''
              }`
            }
          >

            <span className="admin-nav-icon">
              <Icon type="dashboard" />
            </span>

            <span className="admin-nav-label">
              Dashboard
            </span>

          </NavLink>


          {/* =================================================
              BOOKINGS
          ================================================= */}

          <div className="admin-nav-group">

            <div className="admin-nav-parent">

              <span className="admin-nav-icon">
                <Icon type="bookings" />
              </span>

              <span className="admin-nav-label">
                Bookings
              </span>

            </div>


            <div className="admin-nav-submenu">

              <NavLink
                to="/admin/bookings/beauty"
                className={({ isActive }) =>
                  `admin-nav-subitem ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >

                <span className="admin-subitem-dot" />

                <span>
                  Beauty Services
                </span>

              </NavLink>


              <NavLink
                to="/admin/bookings/fashion"
                className={({ isActive }) =>
                  `admin-nav-subitem ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >

                <span className="admin-subitem-dot" />

                <span>
                  Fashion Services
                </span>

              </NavLink>

            </div>

          </div>


          {/* =================================================
              SERVICES
          ================================================= */}

          <div className="admin-nav-group">

            <div className="admin-nav-parent">

              <span className="admin-nav-icon">
                <Icon type="services" />
              </span>

              <span className="admin-nav-label">
                Services
              </span>

            </div>


            <div className="admin-nav-submenu">

              {/* BEAUTY SERVICES */}

              <NavLink
                to="/admin/services/beauty"
                className={({ isActive }) =>
                  `admin-nav-subitem ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                <span className="admin-subitem-dot" />

                <span>
                  Beauty Services
                </span>
              </NavLink>


              {/* FASHION SERVICES */}

              <NavLink
                to=""
                className={({ isActive }) =>
                  `admin-nav-subitem ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >

                <span className="admin-subitem-dot" />

                <span>
                  Fashion Services
                </span>

              </NavLink>

            </div>

          </div>

        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="admin-sidebar-bottom">


          {/* WEBSITE */}

          <Link
            to="/"
            className="admin-bottom-item"
          >

            <span className="admin-bottom-icon">
              <Icon type="website" />
            </span>

            <span>
              View Website
            </span>

          </Link>


          {/* LOGOUT */}

          <button
            type="button"
            className="admin-bottom-item admin-logout"
            onClick={() =>
              void handleLogout()
            }
          >

            <span className="admin-bottom-icon">
              <Icon type="logout" />
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">

        <div className="admin-main-inner">
          <Outlet />
        </div>

      </main>

    </div>
  )
}


export default AdminLayout