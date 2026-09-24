import { Link } from 'react-router-dom'
import {
  Clock,
  Phone,
  MapPin,
  Globe,
  Lock,
  ArrowRight,
  ArrowUpRight,
  Mail,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer" id="footer-section">
      <div className="site-footer-container">
        {/* 4 ORGANIZED COLUMNS */}
        <div className="footer-grid">
          {/* COLUMN 1: BRANDING, DESCRIPTION, INSTAGRAM & HOURS */}
          <div className="footer-col brand-col">
            <div className="brand-header-group">
              {/* Brand Logo */}
              <div className="brand-logo-row">
                <div className="brand-icon-circle">
                  <Sparkles size={20} className="brand-sparkle-icon" />
                </div>
                <div className="brand-text-wrap">
                  <span className="brand-name">
                    WildFloral<span className="brand-dot">.</span>
                  </span>
                  <span className="brand-sub">BEAUTY &amp; FASHION</span>
                </div>
              </div>

              {/* Narrative Description */}
              <p className="brand-description">
                A one-stop luxury beauty &amp; haute fashion destination featuring master artisans, private chamber sanctums, and elevated doorstep experiences.
              </p>

              {/* Instagram Link Pill */}
              <a
                href="https://instagram.com/wildfloral_beauty_destination"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-pill-link"
              >
                <div className="instagram-circle">
                  <svg className="instagram-svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="instagram-handle">@wildfloral_beauty_destination</span>
                <ArrowUpRight size={14} className="insta-arrow-icon" />
              </a>
            </div>

            {/* Working Hours Box */}
            <div className="working-hours-card">
              <div className="hours-header">
                <Clock size={16} className="hours-clock-icon" />
                <span>OUR WORKING HOURS</span>
              </div>
              <p className="hours-time-range">Mon – Sun: 09:00 AM – 09:00 PM</p>
              <span className="hours-badge">✦ Walk-ins &amp; Prior Reservations Welcomed</span>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS */}
          <div className="footer-col links-col">
            <h4 className="column-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/services">Services</Link>
              </li>
              <li>
                <Link to="/fashion">Fashion</Link>
              </li>
              <li>
                <Link to="/portfolio">Portfolio</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: APPOINTMENTS */}
          <div className="footer-col appt-col">
            <div className="appt-top-content">
              <h4 className="column-title">Appointments</h4>
              <p className="column-desc">
                Book your appointment or send us an enquiry to sculpt your personalized bridal, couture, or beauty transformation.
              </p>

              {/* Prominent Pill Button */}
              <Link to="/booking" className="book-appointment-btn">
                <span>BOOK APPOINTMENT</span>
                <ArrowRight size={18} className="btn-arrow" />
              </Link>

              {/* Enquiry secondary action */}
              <Link to="/enquiry" className="enquiry-btn">
                <Mail size={15} />
                <span>Make an Enquiry</span>
              </Link>
            </div>

            <div className="appt-bottom-badge">
              <span className="emerald-dot" />
              <span>Immediate booking confirmation</span>
            </div>
          </div>

          {/* COLUMN 4: CONTACT INFO */}
          <div className="footer-col contact-col">
            <h4 className="column-title">Contact Info</h4>
            <div className="contact-list">
              {/* Phone */}
              <div className="contact-item">
                <div className="contact-icon-badge">
                  <Phone size={16} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">DIRECT / WHATSAPP</span>
                  <a href="tel:8838894677" className="contact-value-link">
                    8838894677
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="contact-item">
                <div className="contact-icon-badge">
                  <MapPin size={16} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">STUDIO LOCATION</span>
                  <p className="contact-value-text">
                    3-1/2, Neela Mega Nagar, 1st Cross, Hosur
                  </p>
                </div>
              </div>

              {/* Website */}
              <div className="contact-item">
                <div className="contact-icon-badge">
                  <Globe size={16} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Our Website</span>
                  <a
                    href="https://wildfloral.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-value-link link-with-arrow"
                  >
                    <span>wildfloral.online</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM LEGAL & CONTROLS BAR */}
        <div className="footer-bottom-bar">
          <div className="copyright-text">
            Copyright © {currentYear} WildFloral Website. All Rights Reserved.
          </div>

          <div className="legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="bar-separator">|</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <span className="bar-separator">|</span>
            <Link to="/admin/login" className="admin-login-link">
              <Lock size={13} />
              <span>Admin Login</span>
            </Link>
          </div>

          <div className="locale-selector-group">
            <button type="button" className="locale-btn">
              <span>English</span>
              <ChevronDown size={14} />
            </button>
            <span className="bar-separator muted">|</span>
            <button type="button" className="locale-btn">
              <span>INR ₹</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer