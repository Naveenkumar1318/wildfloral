import { Link } from 'react-router'
import './HeroSection.css'

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <span className="hero-eyebrow">
          BEAUTY • FASHION • YOU
        </span>

        <h1>
          Where Beauty Meets
          <em>Personal Style</em>
        </h1>

        <p>
          Discover personalized beauty services and thoughtfully
          crafted fashion, created to make every woman feel
          confident, beautiful, and uniquely herself.
        </p>

        <div className="hero-actions">
          <Link to="/booking" className="button button-primary">
            Book an Appointment
          </Link>

          <Link to="/portfolio" className="button button-secondary">
            Explore Our Work
          </Link>
        </div>

        <div className="hero-details">
          <span>Beauty Services</span>
          <span>Custom Fashion</span>
          <span>Aari Work</span>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="hero-image-placeholder">
          <span>WildFloral</span>
          <small>Beauty & Fashion</small>
        </div>

        <div className="hero-floating-card">
          <span>01</span>
          <p>
            Crafted around
            <br />
            your style.
          </p>
        </div>
      </div>
    </section>
  )
}

export default HeroSection