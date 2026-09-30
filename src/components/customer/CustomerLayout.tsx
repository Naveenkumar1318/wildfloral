import { useEffect, useRef, useState } from 'react'

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'
import {
  ChevronDown,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { SEO } from '../common/SEO'
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
  const [mobileEnquiryOpen, setMobileEnquiryOpen] =
    useState(false)
  const [openGroup, setOpenGroup] =
    useState<'bookings' | 'enquiries' | null>('bookings')
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)
  const location = useLocation()

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

      if (mobileMenuOpen || mobileEnquiryOpen) {
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
  }, [mobileMenuOpen, mobileEnquiryOpen])

  useEffect(() => {
    if (location.pathname.startsWith('/account/enquiries/')) {
      setOpenGroup('enquiries')
    } else if (location.pathname.startsWith('/account/bookings/')) {
      setOpenGroup('bookings')
    }
  }, [location.pathname])

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

  function closeMobileMenu() {
    setMobileMenuOpen(false)
    setMobileEnquiryOpen(false)
  }

  function toggleMobileEnquiry() {
    setMobileEnquiryOpen((current) =>
      !current,
    )
  }

  function toggleGroup(
    group: 'bookings' | 'enquiries',
  ) {
    setOpenGroup((current) =>
      current === group ? null : group,
    )
  }

  async function handleLogout() {
  await supabase.auth.signOut()

  closeMobileMenu()

  window.location.href = '/login?redirect=/'
}

  return (
    <>
      <SEO title="Customer Portal | WildFloral" noIndex={true} />
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

<header className={`customer-mobile-header ${navVisible ? 'nav-visible' : 'nav-hidden'}`}>

  {/* =====================================================
      MOBILE BRAND
  ===================================================== */}

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

      <small>
        MY ACCOUNT
      </small>
    </span>
  </Link>


  {/* =====================================================
      MOBILE HEADER ACTIONS
  ===================================================== */}

  <div className="customer-mobile-header-actions">

    {/* BACK TO WEBSITE */}

    <Link
      to="/"
      className="customer-mobile-header-action"
      onClick={closeMobileMenu}
    >
      <span className="customer-mobile-header-action-icon">
        <Icon type="website" />
      </span>

      <span>
        Back to Website
      </span>
    </Link>


    {/* LOGOUT */}

    <button
      type="button"
      className="customer-mobile-header-action customer-mobile-header-logout"
      onClick={() => void handleLogout()}
    >
      <span className="customer-mobile-header-action-icon">
        <Icon type="logout" />
      </span>

      <span>
        Logout
      </span>
    </button>

  </div>

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

            <button
              type="button"
              className={[
                'customer-nav-parent',
                openGroup === 'bookings'
                  ? 'open'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() =>
                toggleGroup('bookings')
              }
              aria-expanded={
                openGroup === 'bookings'
              }
            >
              <span className="customer-nav-icon">
                <Icon type="bookings" />
              </span>

              <span className="customer-nav-label">
                Bookings
              </span>

              <ChevronDown
                className="customer-nav-chevron"
                size={17}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </button>

            {openGroup === 'bookings' && (
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
            )}

          </div>

          {/* ENQUIRIES */}

          <div className="customer-nav-group">

            <button
              type="button"
              className={[
                'customer-nav-parent',
                openGroup === 'enquiries'
                  ? 'open'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() =>
                toggleGroup('enquiries')
              }
              aria-expanded={
                openGroup === 'enquiries'
              }
            >
              <span className="customer-nav-icon">
                <Icon type="enquiries" />
              </span>

              <span className="customer-nav-label">
                Enquiries
              </span>

              <ChevronDown
                className="customer-nav-chevron"
                size={17}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </button>

            {openGroup === 'enquiries' && (
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
            )}

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


      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}

      <nav
        className={`customer-mobile-bottom-nav ${
          navVisible ? 'nav-visible' : 'nav-hidden'
        }`}
        aria-label="Mobile customer navigation"
      >

        {/* HOME */}

        <NavLink
          to="/account"
          end
          onClick={closeMobileMenu}
          className={({ isActive }) =>
            `customer-mobile-bottom-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-mobile-bottom-icon">
            <Icon type="dashboard" />
          </span>

          <span className="customer-mobile-bottom-label">
            Home
          </span>
        </NavLink>


        {/* BEAUTY */}

        <NavLink
          to="/account/bookings/beauty"
          onClick={closeMobileMenu}
          className={({ isActive }) =>
            `customer-mobile-bottom-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-mobile-bottom-icon">
            <Icon type="bookings" />
          </span>

          <span className="customer-mobile-bottom-label">
            Beauty
          </span>
        </NavLink>


        {/* FASHION */}

        <NavLink
          to="/account/bookings/fashion"
          onClick={closeMobileMenu}
          className={({ isActive }) =>
            `customer-mobile-bottom-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-mobile-bottom-icon">
            <Icon type="bookings" />
          </span>

          <span className="customer-mobile-bottom-label">
            Fashion
          </span>
        </NavLink>


        {/* ENQUIRY */}

        <div
          className={[
            'customer-mobile-bottom-group',
            mobileEnquiryOpen
              ? 'open'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >

          <button
            type="button"
            className={[
              'customer-mobile-bottom-item',
              'customer-mobile-bottom-button',
              location.pathname.startsWith(
                '/account/enquiries',
              )
                ? 'active'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={toggleMobileEnquiry}
            aria-label="Open enquiries"
            aria-expanded={mobileEnquiryOpen}
          >
            <span className="customer-mobile-bottom-icon">
              <Icon type="enquiries" />
            </span>

            <span className="customer-mobile-bottom-label">
              Enquiry
            </span>
          </button>


          {/* ENQUIRY OPTIONS */}

          <div className="customer-mobile-enquiry-menu">

            <NavLink
              to="/account/enquiries/beauty"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `customer-mobile-enquiry-item ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="customer-mobile-enquiry-icon">
                <Icon type="enquiries" />
              </span>

              <span>
                Beauty
              </span>
            </NavLink>


            <NavLink
              to="/account/enquiries/fashion"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `customer-mobile-enquiry-item ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="customer-mobile-enquiry-icon">
                <Icon type="enquiries" />
              </span>

              <span>
                Fashion
              </span>
            </NavLink>

          </div>

        </div>


        {/* PROFILE */}

        <NavLink
          to="/account/profile"
          onClick={closeMobileMenu}
          className={({ isActive }) =>
            `customer-mobile-bottom-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="customer-mobile-bottom-icon">
            <Icon type="profile" />
          </span>

          <span className="customer-mobile-bottom-label">
            Profile
          </span>
        </NavLink>

      </nav>


      <main className="customer-layout-content">
        <Outlet />
      </main>
    </>
  )
}

export default CustomerSidebar