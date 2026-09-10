import { useEffect, useState } from 'react'

import {
  Link,
  NavLink,
  Outlet,
} from 'react-router-dom'
import {
  Menu,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './CustomerLayout.css'

type IconType =
  | 'dashboard'
  | 'bookings'
  | 'enquiries'
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
    enquiries: (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />

    <path
      d="M7 9h10M7 12h7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  function toggleMobileMenu() {
    setMobileMenuOpen((current) => !current)
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    closeMobileMenu()

    window.location.href = '/login'
  }

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="customer-mobile-header">
        <Link
          to="/account"
          className="customer-mobile-brand"
          onClick={closeMobileMenu}
          aria-label="WildFloral Customer Account"
        >
          <span className="customer-mobile-brand-logo">
            <Icon type="logo" />
          </span>

          <span className="customer-mobile-brand-content">
            <strong>WildFloral</strong>
            <small>MY ACCOUNT</small>
          </span>
        </Link>

        <button
          type="button"
          className="customer-mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label={
            mobileMenuOpen
              ? 'Close dashboard menu'
              : 'Open dashboard menu'
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="customer-sidebar"
        >
          {mobileMenuOpen ? (
            <X
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Menu
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </button>
      </header>


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <button
        type="button"
        className={[
          'customer-mobile-overlay',
          mobileMenuOpen
            ? 'customer-mobile-overlay-open'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Close navigation"
        onClick={closeMobileMenu}
      />


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        id="customer-sidebar"
        className={[
          'customer-sidebar',
          mobileMenuOpen
            ? 'customer-sidebar-mobile-open'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >

        {/* ===================================================
            BRAND
        =================================================== */}

        <Link
          to="/account"
          className="customer-sidebar-brand"
          aria-label="WildFloral Customer Account"
          onClick={closeMobileMenu}
        >
          <span className="customer-sidebar-logo">
            <Icon type="logo" />
          </span>

          <span className="customer-sidebar-brand-content">
            <strong>WildFloral</strong>

            <small>
              MY ACCOUNT
            </small>
          </span>
        </Link>


        {/* ===================================================
            MENU
        =================================================== */}

        <div className="customer-sidebar-section-title">
          MENU
        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav
          className="customer-sidebar-nav"
          aria-label="Customer navigation"
        >

          {/* DASHBOARD */}

          <NavLink
            to="/account"
            end
            onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
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

{/* ENQUIRIES */}

<div className="customer-nav-group">

  <div className="customer-nav-parent">
    <span className="customer-nav-icon">
      <Icon type="enquiries" />
    </span>

    <span className="customer-nav-label">
      Enquiries
    </span>
  </div>

  <div className="customer-nav-submenu">

    <NavLink
      to="/account/enquiries/beauty"
      onClick={closeMobileMenu}
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
      to="/account/enquiries/fashion"
      onClick={closeMobileMenu}
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
            onClick={closeMobileMenu}
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


        {/* ===================================================
            BOTTOM
        =================================================== */}

        <div className="customer-sidebar-bottom">

          <Link
            to="/"
            className="customer-bottom-item"
            onClick={closeMobileMenu}
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
            onClick={() => void handleLogout()}
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
      <main className="customer-layout-content">
        <Outlet />
      </main>
    </>
  )
}

export default CustomerSidebar