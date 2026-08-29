import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
} from 'react-router'
import {
  ChevronDown,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showNavbar, setShowNavbar] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (mounted) {
        setIsLoggedIn(Boolean(session))
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        setIsLoggedIn(Boolean(session))
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let lastScrollY = window.scrollY

    function handleScroll() {
      const currentScrollY = window.scrollY

      setScrolled(currentScrollY > 12)

      if (currentScrollY <= 12) {
        setShowNavbar(true)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP
        setShowNavbar(true)
      } else if (
        currentScrollY > lastScrollY + 5
      ) {
        // Scrolling DOWN
        setShowNavbar(false)
        setMobileOpen(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true },
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      )
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function closeMobileMenu() {
    setMobileOpen(false)
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
            TOP ANNOUNCEMENT
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

            <Link to="/services">
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
          >
            <span className="brand-name">
              WildFloral
            </span>

            <span className="brand-tagline">
              Beauty & Fashion Studio
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}

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

            <NavLink
              to="/services"
              className="navigation-dropdown-link"
            >
              Services
              <ChevronDown
                size={12}
                strokeWidth={1.7}
              />
            </NavLink>

            <NavLink to="/fashion">
              Fashion
            </NavLink>

            <NavLink to="/portfolio">
              Portfolio
            </NavLink>

            <NavLink to="/contact">
              Contact
            </NavLink>
          </nav>

          {/* ACTIONS */}

          <div className="header-actions">

            {isLoggedIn ? (
              <Link
                to="/account"
                className="header-icon-button"
                aria-label="My account"
                title="My account"
              >
                <UserRound
                  size={19}
                  strokeWidth={1.5}
                />
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
              <span>→</span>
            </Link>

            <Link
              to="/booking"
              className="header-cart-button"
              aria-label="Booking bag"
              title="Booking bag"
            >
              <ShoppingBag
                size={19}
                strokeWidth={1.5}
              />

              <span className="header-cart-count">
                0
              </span>
            </Link>
          </div>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                (current) => !current,
              )
            }
            aria-label={
              mobileOpen
                ? 'Close menu'
                : 'Open menu'
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X
                size={23}
                strokeWidth={1.5}
              />
            ) : (
              <Menu
                size={23}
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>

        {/* =================================================
            MOBILE MENU
        ================================================= */}

        <div
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
              Services
            </NavLink>

            <NavLink
              to="/fashion"
              onClick={closeMobileMenu}
            >
              <span>04</span>
              Fashion
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
                  size={18}
                  strokeWidth={1.5}
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
                  size={18}
                  strokeWidth={1.5}
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
              <span>→</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* MOBILE BACKDROP */}

      {mobileOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
    </>
  )
}

export default Navbar