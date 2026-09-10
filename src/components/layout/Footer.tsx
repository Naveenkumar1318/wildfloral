import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'

import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      {/* =================================================
          MAIN FOOTER
      ================================================= */}

      <div className="site-footer-container">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="footer-brand">
          <Link
            to="/"
            className="footer-brand-name"
            aria-label="WildFloral home"
          >
            WildFloral
          </Link>

          <span className="footer-brand-tagline">
            Beauty &amp; Fashion
          </span>

          <p>
            A one stop beauty service destination
            with professional services and home
            service options.
          </p>

          <a
            href="https://www.instagram.com/wildfloral_beauty_destination/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-instagram"
            aria-label="WildFloral Instagram"
          >
            <span
              className="footer-instagram-icon"
              aria-hidden="true"
            >
              @
            </span>

            <span>
              wildfloral_beauty_destination
            </span>
          </a>
        </div>

        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <nav
          className="footer-column"
          aria-label="Quick links"
        >
          <span className="footer-heading">
            Quick Links
          </span>

          <Link to="/">
            Home
          </Link>

          <Link to="/about">
            About
          </Link>

          <Link to="/services">
            Services
          </Link>

          <Link to="/fashion">
            Fashion
          </Link>

          <Link to="/portfolio">
            Portfolio
          </Link>

          <Link to="/contact">
            Contact
          </Link>
        </nav>

        {/* =================================================
            APPOINTMENTS
        ================================================= */}

        <div className="footer-column footer-booking">
          <span className="footer-heading">
            Appointments
          </span>

          <p>
            Book your appointment or send us an
            enquiry for your beauty and fashion needs.
          </p>

          <Link
            to="/booking"
            className="footer-book-button"
          >
            Book Appointment

            <span aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            to="/enquiry"
            className="footer-enquiry-link"
          >
            Make an Enquiry
          </Link>
        </div>

        {/* =================================================
            CONTACT
        ================================================= */}

        <div className="footer-column footer-contact">
          <span className="footer-heading">
            Contact
          </span>

          <a
            href="tel:8838894677"
            className="footer-contact-item"
            aria-label="Call WildFloral at 8838894677"
          >
            <Phone
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
            />

            <span>
              8838894677
            </span>
          </a>

          <div className="footer-contact-item">
            <MapPin
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
            />

            <span>
              3-1/2, Neela Mega Nagar
              <br />
              1st Cross
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          BOTTOM BAR
      ================================================= */}

      <div className="footer-bottom">
        <div className="footer-bottom-inner">

          <div className="footer-legal">
            <Link to="/privacy">
              Privacy Policy
            </Link>

            <span aria-hidden="true">
              |
            </span>

            <Link to="/terms">
              Terms &amp; Conditions
            </Link>
          </div>

          <Link
            to="/admin/login"
            className="footer-admin-link"
          >
            Admin Login

            <span aria-hidden="true">
              ↗
            </span>
          </Link>

          <span className="footer-copyright">
            © {currentYear} WildFloral. All rights reserved.
          </span>

        </div>
      </div>
    </footer>
  )
}

export default Footer