import { Link } from 'react-router'
import './Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="footer-brand">
          <span className="footer-brand-name">WildFloral</span>

          <p>
            Beauty, fashion, and personalized style crafted
            with care.
          </p>
        </div>

        <div className="footer-links">
          <span className="footer-heading">Explore</span>

          <Link to="/services">Services</Link>
          <Link to="/fashion">Fashion</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-contact">
            <span className="footer-heading">Connect</span>

            <span className="footer-contact-placeholder">
              Contact details coming soon
            </span>
          </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} WildFloral
        </span>

        <span>
          Beauty & Fashion Studio
        </span>
      </div>
    </footer>
  )
}

export default Footer