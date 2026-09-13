import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'

import { useState } from 'react'

import { supabase } from '../../lib/supabase'

import './AdminLayout.css'

type IconType =
  | 'dashboard'
  | 'bookings'
  | 'enquiries'
  | 'services'
  | 'offers'
  | 'customers'
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

    bookings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
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

    enquiries: (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8A2.5 2.5 0 0 1 16.5 16H11l-4.5 4v-4.2A2.5 2.5 0 0 1 5 13.5v-8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />

    <path
      d="M8 8h8M8 11.5h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
customers: (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle
      cx="9"
      cy="7"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    />

    <path
      d="M22 21v-2a4 4 0 0 0-3-3.87"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />

    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
),
    offers: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 12l-8 8-9-9V4h7l10 8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="7.5"
          cy="7.5"
          r="1.2"
          fill="currentColor"
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

    logout: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
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

function AdminLayout() {
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const [openSection, setOpenSection] =
    useState<string | null>(null)

  async function handleLogout() {
    await supabase.auth.signOut()

    navigate(
      '/admin/login',
      {
        replace: true,
      },
    )
  }

  function toggleSection(section: string) {
    setOpenSection((current) =>
      current === section
        ? null
        : section,
    )
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
    setOpenSection(null)
  }

  return (
    <div
      className={`admin-layout ${
        mobileMenuOpen
          ? 'mobile-menu-open'
          : ''
      }`}
    >

      {/* =================================================
          MOBILE HEADER
      ================================================= */}

      <header className="admin-mobile-header">

        <button
          type="button"
          className="admin-mobile-menu-button"
          aria-label={
            mobileMenuOpen
              ? 'Close menu'
              : 'Open menu'
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen(
              (current) => !current,
            )
          }
        >
          <span />
          <span />
          <span />
        </button>

        <Link
          to="/admin"
          className="admin-mobile-brand"
          onClick={closeMobileMenu}
        >
          <span className="admin-mobile-brand-logo">
            <Icon type="logo" />
          </span>

          <span>
            WildFloral
          </span>
        </Link>

      </header>


      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      <button
        type="button"
        className="admin-mobile-overlay"
        aria-label="Close navigation"
        onClick={closeMobileMenu}
      />


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        {/* BRAND */}

        <Link
          to="/admin"
          className="admin-sidebar-brand"
          onClick={closeMobileMenu}
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


        {/* MENU TITLE */}

        <div className="admin-sidebar-section-title">
          MENU
        </div>


        {/* NAVIGATION */}

        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
        >

          {/* DASHBOARD */}

          <NavLink
            to="/admin"
            end
            onClick={closeMobileMenu}
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

          <div
            className={`admin-nav-group ${
              openSection === 'bookings'
                ? 'open'
                : ''
            }`}
          >

            <button
              type="button"
              className="admin-nav-parent"
              onClick={() =>
                toggleSection('bookings')
              }
              aria-expanded={
                openSection === 'bookings'
              }
            >
              <span className="admin-nav-icon">
                <Icon type="bookings" />
              </span>

              <span className="admin-nav-label">
                Bookings
              </span>

              <span className="admin-nav-arrow">
                ›
              </span>
            </button>

            <div className="admin-nav-submenu">

              <NavLink
                to="/admin/bookings/beauty"
                onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
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
    ENQUIRIES
================================================= */}

<div
  className={`admin-nav-group ${
    openSection === 'enquiries'
      ? 'open'
      : ''
  }`}
>

  <button
    type="button"
    className="admin-nav-parent"
    onClick={() =>
      toggleSection('enquiries')
    }
    aria-expanded={
      openSection === 'enquiries'
    }
  >
    <span className="admin-nav-icon">
      <Icon type="enquiries" />
    </span>

    <span className="admin-nav-label">
      Enquiries
    </span>

    <span className="admin-nav-arrow">
      ›
    </span>
  </button>

  <div className="admin-nav-submenu">

    <NavLink
      to="/admin/enquiries/beauty"
      onClick={closeMobileMenu}
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
        Beauty Enquiries
      </span>
    </NavLink>

    <NavLink
      to="/admin/enquiries/fashion"
      onClick={closeMobileMenu}
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
        Fashion Enquiries
      </span>
    </NavLink>

  </div>

</div>

          {/* =================================================
              SERVICES
          ================================================= */}

          <div
            className={`admin-nav-group ${
              openSection === 'services'
                ? 'open'
                : ''
            }`}
          >

            <button
              type="button"
              className="admin-nav-parent"
              onClick={() =>
                toggleSection('services')
              }
              aria-expanded={
                openSection === 'services'
              }
            >
              <span className="admin-nav-icon">
                <Icon type="services" />
              </span>

              <span className="admin-nav-label">
                Services
              </span>

              <span className="admin-nav-arrow">
                ›
              </span>
            </button>

            <div className="admin-nav-submenu">

              <NavLink
                to="/admin/services/beauty"
                onClick={closeMobileMenu}
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
                to="/admin/services/fashion"
                onClick={closeMobileMenu}
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
              OFFERS
          ================================================= */}

          <div
            className={`admin-nav-group ${
              openSection === 'offers'
                ? 'open'
                : ''
            }`}
          >

            <button
              type="button"
              className="admin-nav-parent"
              onClick={() =>
                toggleSection('offers')
              }
              aria-expanded={
                openSection === 'offers'
              }
            >
              <span className="admin-nav-icon">
                <Icon type="offers" />
              </span>

              <span className="admin-nav-label">
                Offers
              </span>

              <span className="admin-nav-arrow">
                ›
              </span>
            </button>

            <div className="admin-nav-submenu">

              <NavLink
                to="/admin/offers/beauty"
                onClick={closeMobileMenu}
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
                  Beauty Offers
                </span>
              </NavLink>

              <NavLink
                to="/admin/offers/fashion"
                onClick={closeMobileMenu}
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
                  Fashion Offers
                </span>
              </NavLink>

            </div>
{/* =================================================
    OP CUSTOMERS
================================================= */}

<div
  className={`admin-nav-group ${
    openSection === 'op-customers'
      ? 'open'
      : ''
  }`}
>

  <button
    type="button"
    className="admin-nav-parent"
    onClick={() =>
      toggleSection('op-customers')
    }
    aria-expanded={
      openSection === 'op-customers'
    }
  >

    <span className="admin-nav-icon">
      <Icon type="customers" />
    </span>

    <span className="admin-nav-label">
      OP Customers
    </span>

    <span className="admin-nav-arrow">
      ›
    </span>

  </button>


  <div className="admin-nav-submenu">

    <NavLink
      to="/admin/op-customers/beauty"
      onClick={closeMobileMenu}
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
        Beauty Customers
      </span>

    </NavLink>


    <NavLink
      to="/admin/op-customers/fashion"
      onClick={closeMobileMenu}
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
        Fashion Customers
      </span>

    </NavLink>

  </div>

</div>
          </div>

        </nav>

        


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="admin-sidebar-bottom">

          <Link
            to="/"
            className="admin-bottom-item"
            onClick={closeMobileMenu}
          >
            <span className="admin-bottom-icon">
              <Icon type="website" />
            </span>

            <span>
              View Website
            </span>
          </Link>


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