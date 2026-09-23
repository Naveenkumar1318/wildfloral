import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
} from 'react-router-dom'
import {
  Menu,
  UserRound,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Navbar.css'

function Navbar() {
  const location = useLocation()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showNavbar, setShowNavbar] = useState(true)

  /* =======================================================
     AUTH SESSION
  ======================================================= */

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setIsLoggedIn(Boolean(session))
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) {
          return
        }

        setIsLoggedIn(Boolean(session))
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /* =======================================================
     CLOSE MOBILE MENU ON ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  /* =======================================================
     SCROLL BEHAVIOUR
  ======================================================= */

  useEffect(() => {
    let lastScrollY = window.scrollY

    function handleScroll() {
      const currentScrollY = window.scrollY

      setScrolled(currentScrollY > 12)

      if (currentScrollY <= 12) {
        setShowNavbar(true)
      } else if (currentScrollY < lastScrollY) {
        setShowNavbar(true)
      } else if (currentScrollY > lastScrollY + 5) {
        setShowNavbar(false)
        setMobileOpen(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )
    }
  }, [])

  /* =======================================================
     MOBILE BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* =======================================================
     ACTIONS
  ======================================================= */

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  function toggleMobileMenu() {
    setMobileOpen((current) => !current)
  }

  return (
    <>
      <header
        className={[
          'site-header',
          showNavbar
            ? 'site-header-visible'
            : 'site-header-hidden',
          scrolled
            ? 'site-header-scrolled'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* =================================================
            ANNOUNCEMENT
        ================================================= */}

        <div className="navbar-announcement">
          <div className="navbar-announcement-inner">
            <span>
              ✦ Premium Beauty & Fashion Studio
            </span>

            <span className="navbar-announcement-divider">
              |
            </span>

            <span>
              Personalized experiences crafted for you
            </span>

            <Link
              to="/services"
              onClick={closeMobileMenu}
            >
              Explore Services →
            </Link>
          </div>
        </div>

        {/* =================================================
            MAIN HEADER
        ================================================= */}

        <div className="site-header-container">

          {/* BRAND */}

          <Link
            to="/"
            className="brand"
            onClick={closeMobileMenu}
            aria-label="WildFloral home"
          >
            <span className="brand-name">
              WildFloral
            </span>

            <span className="brand-tagline">
              Beauty & Fashion Studio
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav
            className="main-navigation"
            aria-label="Main navigation"
          >
            <NavLink
              to="/"
              end
            >
              Home
            </NavLink>

            <NavLink to="/about">
              About
            </NavLink>

            <NavLink to="/services">
              Beauty Services
            </NavLink>

            <NavLink to="/fashion">
              Fashion Services
            </NavLink>

            <NavLink to="/portfolio">
              Portfolio
            </NavLink>

            <NavLink to="/contact">
              Contact
            </NavLink>
          </nav>

          {/* =================================================
              DESKTOP ACTIONS
          ================================================= */}

          <div className="header-actions">

            {isLoggedIn ? (
  <Link
    to="/account"
    className="header-dashboard-link"
    aria-label="Dashboard"
    title="Dashboard"
  >
   
    <span>MY Dashboard  → </span>
    
  </Link>
) : (
              <Link
                to="/login"
                className="header-login-link"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/booking"
              className="header-book-button"
            >
              Book Appointment

              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>

          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}

          <button
            type="button"
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label={
              mobileOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? (
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
        </div>

        {/* =================================================
            MOBILE NAVIGATION
        ================================================= */}

        <div
          id="mobile-navigation"
          className={[
            'mobile-navigation-wrapper',
            mobileOpen
              ? 'mobile-navigation-open'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <nav
            className="mobile-navigation"
            aria-label="Mobile navigation"
          >
            <div className="mobile-navigation-heading">
              <span>
                WILDFLORAL
              </span>

              <small>
                BEAUTY · FASHION · YOU
              </small>
            </div>

            <NavLink
              to="/"
              end
              onClick={closeMobileMenu}
            >
              <span>01</span>
              Home
            </NavLink>

            <NavLink
              to="/about"
              onClick={closeMobileMenu}
            >
              <span>02</span>
              About
            </NavLink>

            <NavLink
              to="/services"
              onClick={closeMobileMenu}
            >
              <span>03</span>
              Beauty Services
            </NavLink>

            <NavLink
              to="/fashion"
              onClick={closeMobileMenu}
            >
              <span>04</span>
              Fashion Services
            </NavLink>

            <NavLink
              to="/portfolio"
              onClick={closeMobileMenu}
            >
              <span>05</span>
              Portfolio
            </NavLink>

            <NavLink
              to="/contact"
              onClick={closeMobileMenu}
            >
              <span>06</span>
              Contact
            </NavLink>

            <div className="mobile-navigation-divider" />

            {isLoggedIn ? (
              <Link
                to="/account"
                className="mobile-account-link"
                onClick={closeMobileMenu}
              >
                <UserRound
                  size={17}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                My Account
              </Link>
            ) : (
              <Link
                to="/login"
                className="mobile-account-link"
                onClick={closeMobileMenu}
              >
                <UserRound
                  size={17}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                Sign In
              </Link>
            )}

            <Link
              to="/booking"
              className="mobile-book-button"
              onClick={closeMobileMenu}
            >
              Book Appointment

              <span aria-hidden="true">
                →
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      {mobileOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}
    </>
  )
}

export default Navbar