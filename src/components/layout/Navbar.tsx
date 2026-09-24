import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Phone,
  Sparkles,
  LayoutDashboard,
  LogIn,
  Menu,
  X,
  Home,
  Scissors,
  Shirt
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /* =======================================================
     AUTH SESSION
  ======================================================= */

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return
      setIsLoggedIn(Boolean(session))
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setIsLoggedIn(Boolean(session))
    })

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
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  function toggleMobileMenu() {
    setMobileOpen((current) => !current)
  }

  return (
    <>
      <div className="site-header-wrapper">
        {/* =================================================
            TOP ANNOUNCEMENT BAR
        ================================================= */}
        <div className="navbar-announcement-bar">
          <div className="announcement-container">
            <div className="announcement-text">
              <span>✦ Premium Beauty &amp; Fashion Studio</span>
              <span className="announcement-divider">|</span>
              <span>Personalized experiences crafted for you</span>
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN HEADER
        ================================================= */}
        <header
          className={`site-navbar ${scrolled ? 'site-navbar-scrolled' : ''}`}
        >
          <div className="navbar-container">
            {/* BRAND LOGO */}
            <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
              <div className="navbar-logo-circle">
                <Sparkles size={20} className="logo-sparkle-icon" />
              </div>
              <div className="navbar-brand-text">
                <span className="brand-title">
                  WildFloral<span className="brand-dot">.</span>
                </span>
                <span className="brand-subtitle">BEAUTY &amp; FASHION</span>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav className="navbar-links">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Home
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
                About
              </NavLink>
              <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>
                Beauty Services
              </NavLink>
              <NavLink to="/fashion" className={({ isActive }) => (isActive ? 'active' : '')}>
                Fashion Services
              </NavLink>
              <NavLink to="/portfolio" className={({ isActive }) => (isActive ? 'active' : '')}>
                Portfolio
              </NavLink>
              <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>
                Contact Us
              </NavLink>
            </nav>

            {/* DESKTOP RIGHT ACTIONS */}
            <div className="navbar-right-actions">
              {isLoggedIn ? (
                <Link to="/account" className="dashboard-pill-btn">
                  <LayoutDashboard size={16} />
                  <span>My Dashboard</span>
                </Link>
              ) : (
                <Link to="/login" className="dashboard-pill-btn">
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* MOBILE TOP PHONE BUTTON */}
            <div className="navbar-mobile-header-action">
              <a href="tel:8838894677" className="mobile-header-call-pill">
                <Phone size={14} />
                <span>8838894677</span>
              </a>
            </div>
          </div>
        </header>

        {/* =================================================
            MOBILE DRAWER MENU
        ================================================= */}
        <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-title-group">
              <span className="mobile-brand-name">WildFloral.</span>
              <small className="mobile-brand-sub">BEAUTY &amp; FASHION</small>
            </div>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="mobile-drawer-nav">
            <NavLink to="/" end onClick={closeMobileMenu}>
              Home
            </NavLink>
            <NavLink to="/about" onClick={closeMobileMenu}>
              About
            </NavLink>
            <NavLink to="/services" onClick={closeMobileMenu}>
              Beauty Services
            </NavLink>
            <NavLink to="/fashion" onClick={closeMobileMenu}>
              Fashion Services
            </NavLink>
            <NavLink to="/portfolio" onClick={closeMobileMenu}>
              Portfolio
            </NavLink>
            <NavLink to="/contact" onClick={closeMobileMenu}>
              Contact Us
            </NavLink>

            <div className="mobile-drawer-divider" />

            {isLoggedIn ? (
              <Link to="/account" className="mobile-dashboard-link" onClick={closeMobileMenu}>
                <LayoutDashboard size={18} />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" className="mobile-dashboard-link" onClick={closeMobileMenu}>
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            )}

            <Link to="/booking" className="mobile-booking-link" onClick={closeMobileMenu}>
              Book Appointment →
            </Link>
          </nav>
        </div>

        {/* MOBILE MENU BACKDROP */}
        {mobileOpen && <div className="mobile-drawer-backdrop" onClick={closeMobileMenu} />}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" end className="bottom-nav-item">
          <Home size={18} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/services" className="bottom-nav-item">
          <Scissors size={18} />
          <span>Beauty Services</span>
        </NavLink>
        <NavLink to="/fashion" className="bottom-nav-item">
          <Shirt size={18} />
          <span>Fashion Services</span>
        </NavLink>
        {isLoggedIn ? (
          <NavLink to="/account" className="bottom-nav-item">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        ) : (
          <NavLink to="/login" className="bottom-nav-item">
            <LogIn size={18} />
            <span>Login</span>
          </NavLink>
        )}
        <button type="button" className="bottom-nav-item" onClick={toggleMobileMenu}>
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  )
}

export default Navbar
