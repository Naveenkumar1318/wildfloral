import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useEffect, useRef, useState } from 'react'

import { supabase } from '../../lib/supabase'
import { SEO } from '../common/SEO'
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
  const location = useLocation()

  const [openSection, setOpenSection] =
    useState<string | null>(null)

  const [mobileOpenSection, setMobileOpenSection] =
    useState<string | null>(null)

  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    setNavVisible(true)
    lastScrollY.current = window.scrollY
  }, [location.pathname])

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const previousScrollY = lastScrollY.current
      const delta = currentScrollY - previousScrollY

      if (currentScrollY <= 50) {
        setNavVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (mobileOpenSection !== null) {
        setNavVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (Math.abs(delta) < 6) {
        return
      }

      if (delta > 0) {
        // Scrolling down -> hide
        setNavVisible(false)
      } else {
        // Scrolling up -> show
        setNavVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [mobileOpenSection])

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

  function toggleMobileSection(
    section: string,
  ) {
    setMobileOpenSection((current) =>
      current === section
        ? null
        : section,
    )
  }

  function closeMobileSection() {
    setMobileOpenSection(null)
  }

  return (
    <div className="admin-layout">
      <SEO title="Admin Portal | WildFloral" noIndex={true} />
      {/* =================================================
          MOBILE HEADER
      ================================================= */}

      <header className={`admin-mobile-header ${navVisible ? 'nav-visible' : 'nav-hidden'}`}>

  {/* =====================================================
      ADMIN BRAND
  ===================================================== */}

  <Link
    to="/admin"
    className="admin-mobile-brand"
    aria-label="WildFloral Administration"
  >
    <span className="admin-mobile-brand-logo">
      <Icon type="logo" />
    </span>

    <span className="admin-mobile-brand-content">
      <strong>
        WildFloral
      </strong>

      <small>
        ADMINISTRATION
      </small>
    </span>
  </Link>


  {/* =====================================================
      MOBILE HEADER ACTIONS
  ===================================================== */}

  <div className="admin-mobile-header-actions">

    {/* BACK TO WEBSITE */}

    <Link
      to="/"
      className="admin-mobile-header-action"
    >
      <span className="admin-mobile-header-action-icon">
        <Icon type="website" />
      </span>

      <span>
        Back to Website
      </span>
    </Link>


    {/* LOGOUT */}

    <button
      type="button"
      className="admin-mobile-header-action admin-mobile-header-logout"
      onClick={() => void handleLogout()}
    >
      <span className="admin-mobile-header-action-icon">
        <Icon type="logout" />
      </span>

      <span>
        Logout
      </span>
    </button>

  </div>

</header>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        {/* BRAND */}

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
                  Beauty Bookings
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
    Fashion Bookings
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
                className={({ isActive }) =>
    `admin-nav-subitem ${
      isActive ? 'active' : ''
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
                to="/admin/services/fashion/offers"
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
    MOBILE BOTTOM NAVIGATION
================================================= */}

<nav
  className={`admin-mobile-bottom-nav ${
    navVisible ? 'nav-visible' : 'nav-hidden'
  }`}
  aria-label="Mobile admin navigation"
>

  {/* =================================================
      HOME
  ================================================= */}

  <NavLink
    to="/admin"
    end
    onClick={closeMobileSection}
    className={({ isActive }) =>
      `admin-mobile-bottom-item ${
        isActive ? 'active' : ''
      }`
    }
  >
    <span className="admin-mobile-bottom-icon">
      <Icon type="dashboard" />
    </span>

    <span className="admin-mobile-bottom-label">
      Home
    </span>
  </NavLink>


  {/* =================================================
      BOOKINGS
  ================================================= */}

  <div
    className={`admin-mobile-bottom-group ${
      mobileOpenSection === 'bookings'
        ? 'open'
        : ''
    }`}
  >

    <button
      type="button"
      className={`admin-mobile-bottom-item admin-mobile-bottom-button ${
        location.pathname.startsWith(
          '/admin/bookings',
        )
          ? 'active'
          : ''
      }`}
      onClick={() =>
        toggleMobileSection('bookings')
      }
      aria-expanded={
        mobileOpenSection === 'bookings'
      }
    >
      <span className="admin-mobile-bottom-icon">
        <Icon type="bookings" />
      </span>

      <span className="admin-mobile-bottom-label">
        Bookings
      </span>
    </button>


    <div className="admin-mobile-submenu">

      <NavLink
        to="/admin/bookings/beauty"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Beauty Bookings
      </NavLink>


      <NavLink
        to="/admin/bookings/fashion"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Fashion Bookings
      </NavLink>

    </div>

  </div>


  {/* =================================================
      ENQUIRY
  ================================================= */}

  <div
    className={`admin-mobile-bottom-group ${
      mobileOpenSection === 'enquiries'
        ? 'open'
        : ''
    }`}
  >

    <button
      type="button"
      className={`admin-mobile-bottom-item admin-mobile-bottom-button ${
        location.pathname.startsWith(
          '/admin/enquiries',
        )
          ? 'active'
          : ''
      }`}
      onClick={() =>
        toggleMobileSection('enquiries')
      }
      aria-expanded={
        mobileOpenSection === 'enquiries'
      }
    >
      <span className="admin-mobile-bottom-icon">
        <Icon type="enquiries" />
      </span>

      <span className="admin-mobile-bottom-label">
        Enquiry
      </span>
    </button>


    <div className="admin-mobile-submenu">

      <NavLink
        to="/admin/enquiries/beauty"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Beauty Enquiry
      </NavLink>


      <NavLink
        to="/admin/enquiries/fashion"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Fashion Enquiry
      </NavLink>

    </div>

  </div>


  {/* =================================================
      SERVICES
  ================================================= */}

  <div
    className={`admin-mobile-bottom-group ${
      mobileOpenSection === 'services'
        ? 'open'
        : ''
    }`}
  >

    <button
      type="button"
      className={`admin-mobile-bottom-item admin-mobile-bottom-button ${
        location.pathname.startsWith(
          '/admin/services',
        )
          ? 'active'
          : ''
      }`}
      onClick={() =>
        toggleMobileSection('services')
      }
      aria-expanded={
        mobileOpenSection === 'services'
      }
    >
      <span className="admin-mobile-bottom-icon">
        <Icon type="services" />
      </span>

      <span className="admin-mobile-bottom-label">
        Services
      </span>
    </button>


    <div className="admin-mobile-submenu">

      <NavLink
        to="/admin/services/beauty"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Beauty Services
      </NavLink>


      <NavLink
        to="/admin/services/fashion"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Fashion Services
      </NavLink>

    </div>

  </div>


  {/* =================================================
      OFFERS
  ================================================= */}

  <div
    className={`admin-mobile-bottom-group ${
      mobileOpenSection === 'offers'
        ? 'open'
        : ''
    }`}
  >

    <button
      type="button"
      className={`admin-mobile-bottom-item admin-mobile-bottom-button ${
        location.pathname.startsWith(
          '/admin/offers',
        ) ||
        location.pathname.startsWith(
          '/admin/services/fashion/offers',
        )
          ? 'active'
          : ''
      }`}
      onClick={() =>
        toggleMobileSection('offers')
      }
      aria-expanded={
        mobileOpenSection === 'offers'
      }
    >
      <span className="admin-mobile-bottom-icon">
        <Icon type="offers" />
      </span>

      <span className="admin-mobile-bottom-label">
        Offers
      </span>
    </button>


    <div className="admin-mobile-submenu">

      <NavLink
        to="/admin/offers/beauty"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Beauty Offers
      </NavLink>


      <NavLink
        to="/admin/services/fashion/offers"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Fashion Offers
      </NavLink>

    </div>

  </div>


  {/* =================================================
      OP CUSTOMER
  ================================================= */}

  <div
    className={`admin-mobile-bottom-group ${
      mobileOpenSection === 'customers'
        ? 'open'
        : ''
    }`}
  >

    <button
      type="button"
      className={`admin-mobile-bottom-item admin-mobile-bottom-button ${
        location.pathname.startsWith(
          '/admin/op-customers',
        )
          ? 'active'
          : ''
      }`}
      onClick={() =>
        toggleMobileSection('customers')
      }
      aria-expanded={
        mobileOpenSection === 'customers'
      }
    >
      <span className="admin-mobile-bottom-icon">
        <Icon type="customers" />
      </span>

      <span className="admin-mobile-bottom-label">
        OP Customer
      </span>
    </button>


    <div className="admin-mobile-submenu">

      <NavLink
        to="/admin/op-customers/beauty"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Beauty Customer
      </NavLink>


      <NavLink
        to="/admin/op-customers/fashion"
        onClick={closeMobileSection}
        className={({ isActive }) =>
          `admin-mobile-submenu-item ${
            isActive ? 'active' : ''
          }`
        }
      >
        Fashion Customer
      </NavLink>

    </div>

  </div>

</nav>

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