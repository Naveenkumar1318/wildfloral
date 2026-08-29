import { Link } from 'react-router'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      {/* Newsletter */}
      <section className="footer-newsletter" aria-labelledby="footer-newsletter-title">
        <div className="footer-newsletter-inner">
          <div className="footer-newsletter-copy">
            <h2 id="footer-newsletter-title">Stay in the WildFloral world.</h2>

            <p>
              Beauty inspiration, studio updates, fashion stories,
              and special announcements — occasionally, never excessively.
            </p>
          </div>

          <form className="footer-newsletter-form">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>

            <input
              id="footer-email"
              name="email"
              type="email"
              placeholder="Write your email"
              autoComplete="email"
              required
            />

            <button type="submit" aria-label="Subscribe to WildFloral newsletter">
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>

      {/* Main footer */}
      <div className="site-footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-brand-name">
            WildFloral
          </Link>

          <span className="footer-brand-tagline">
            Beauty &amp; Fashion Studio
          </span>

          <p>
            Beauty, fashion, and personalized style crafted
            with care.
          </p>

          <div className="footer-brand-line" />

          <div className="footer-socials" aria-label="Social media">
            <a href="#" aria-label="Instagram">
              IG
            </a>

            <a href="#" aria-label="Facebook">
              FB
            </a>

            <a href="#" aria-label="WhatsApp">
              WA
            </a>
          </div>
        </div>

        {/* Explore */}
        <nav className="footer-column" aria-label="Explore">
          <span className="footer-heading">Explore</span>

          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* Services */}
        <nav className="footer-column" aria-label="Services">
          <span className="footer-heading">Services</span>

          <Link to="/services">Beauty</Link>
          <Link to="/services">Bridal</Link>
          <Link to="/services">Hair</Link>
          <Link to="/fashion">Fashion</Link>
          <Link to="/fashion">Aari Work</Link>
        </nav>

        {/* Contact */}
        <div className="footer-column footer-contact">
          <span className="footer-heading">Contact</span>

          <div className="footer-contact-item">
            <span>Call</span>
            <strong>+1 (555) 123-4567</strong>
          </div>

          <div className="footer-contact-item">
            <span>Email</span>
            <strong>contact@wildfloral.com</strong>
          </div>

          <div className="footer-contact-item">
            <span>Studio</span>
            <strong>123 Beauty Street, Fashion City</strong>
          </div>
        </div>

        {/* Location */}
        <div className="footer-location">
          <span className="footer-heading">Find Us</span>

          <div className="footer-location-card">
            <span className="footer-location-pin">+</span>

            <div>
              <strong>WildFloral Studio</strong>
              <span>123 Beauty Street, Fashion City</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>

          <Link
            to="/admin/login"
            className="footer-admin-link"
          >
            Admin Login
            <span aria-hidden="true">↗</span>
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