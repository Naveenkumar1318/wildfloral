import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Home, Scissors, Shirt, Calendar, Mail } from 'lucide-react'
import { SEO } from '../../../components/common/SEO'
import './NotFound.css'

const NotFound: React.FC = () => {
  return (
    <>
      <SEO
        title="Page Not Found | WildFloral Hosur"
        description="The page you are looking for does not exist. Explore WildFloral luxury beauty services, couture fashion, and personalized appointments in Hosur."
        canonical="https://www.wildfloral.online/404"
        noIndex={true}
      />
      <main className="not-found-page">
        <div className="not-found-container">
          <div className="not-found-badge">
            <Sparkles size={16} className="not-found-sparkle" />
            <span>404 ERROR</span>
          </div>

          <h1 className="not-found-title">Page Not Found</h1>

          <p className="not-found-text">
            We couldn&apos;t find the page you were looking for. The link may be broken or the page may have been moved.
            Please explore our beauty services, haute couture, or book a consultation below.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="not-found-primary-btn">
              <Home size={18} />
              <span>Return Home</span>
            </Link>
            <Link to="/booking" className="not-found-secondary-btn">
              <Calendar size={18} />
              <span>Book Appointment</span>
            </Link>
          </div>

          <div className="not-found-links-grid">
            <Link to="/services" className="not-found-quick-link">
              <Scissors size={18} />
              <span>Beauty Services</span>
            </Link>
            <Link to="/fashion" className="not-found-quick-link">
              <Shirt size={18} />
              <span>Fashion &amp; Couture</span>
            </Link>
            <Link to="/contact" className="not-found-quick-link">
              <Mail size={18} />
              <span>Contact &amp; Location</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default NotFound
