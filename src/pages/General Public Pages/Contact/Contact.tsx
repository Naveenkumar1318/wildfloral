import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  MapPin,
  ArrowRight,
  Flower2,
  Home,
  Zap,
  Clock,
  MessageCircle,
  ExternalLink,
  Check,
  Sparkles,
  Car,
} from 'lucide-react'
import { SEO } from '../../../components/common/SEO'
import {
  getLocalBusinessSchema,
  getContactPageSchema,
  getBreadcrumbSchema,
} from '../../../lib/seoSchemas'
import './Contact.css'

const Contact: React.FC = () => {
  const contactSchemas = useMemo(
    () => [
      getLocalBusinessSchema(),
      getContactPageSchema(),
      getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
      ]),
    ],
    [],
  )

  return (
    <main className="contact-page">
      <SEO
  title="Contact Beauty Salon & Fashion Studio in Hosur | WildFloral"
  description="Contact WildFloral in Hosur for beauty appointments, bridal makeup, hair styling, skincare, custom dress design and fashion consultations."
  canonical="https://www.wildfloral.online/contact"
  schemas={contactSchemas}
/>
      {/* Top Ambient Glow Fields */}
      <div className="contact-ambient-glow glow-top-right"></div>
      <div className="contact-ambient-glow glow-top-left"></div>

      {/* =====================================================
          1. HERO SECTION
      ===================================================== */}
      <section className="contact-hero">
        <div className="contact-container text-center">
          {/* Atelier Monogram Seal */}
          <div className="monogram-seal-wrapper">
            <div className="monogram-seal">
              <svg className="monogram-svg-ring" fill="none" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                <path
                  d="M50 8 C53 25, 47 25, 50 42 C53 25, 47 25, 50 8 Z"
                  fill="currentColor"
                  opacity="0.4"
                />
                <path
                  d="M50 92 C53 75, 47 75, 50 58 C53 75, 47 75, 50 92 Z"
                  fill="currentColor"
                  opacity="0.4"
                />
                <path
                  d="M8 50 C25 53, 25 47, 42 50 C25 53, 25 47, 8 50 Z"
                  fill="currentColor"
                  opacity="0.4"
                />
                <path
                  d="M92 50 C75 53, 75 47, 58 50 C75 53, 75 47, 92 50 Z"
                  fill="currentColor"
                  opacity="0.4"
                />
              </svg>
              <span className="monogram-letters">WF</span>
            </div>
          </div>

          {/* Eyebrow Pill */}
          <div className="contact-eyebrow-pill">
            <span className="contact-pulse-dot"></span>
            <span className="eyebrow-text">Contact WildFloral Hosur</span>
          </div>

          {/* Headline */}
          <h1 className="contact-hero-title">
            Contact WildFloral Studio in{' '}
            <span className="italic-highlight">Hosur</span>
          </h1>

          {/* Description */}
          <p className="contact-hero-description">
            Whether you are booking a beauty appointment, planning bridal makeup, or consulting on custom haute couture fashion, connect with our studio at Neela Mega Nagar, Hosur.
          </p>

          {/* Dual CTAs */}
          <div className="contact-hero-actions">
            <a href="tel:+918838894677" className="btn-contact-primary">
              <Phone size={18} />
              <span>Call +91 8838894677</span>
            </a>
            <Link to="/booking" className="btn-contact-secondary">
              <span>Book Online</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick Trust Indicators */}
          <div className="trust-indicators-flex">
            <div className="trust-pill">
              <Flower2 size={16} className="text-purple-600" />
              <span>Personalized Consultations</span>
            </div>
            <div className="trust-pill">
              <Home size={16} className="text-purple-600" />
              <span>Doorstep &amp; In-Studio Services</span>
            </div>
            <div className="trust-pill">
              <Zap size={16} className="text-purple-600" />
              <span>Immediate Enquiry Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          2. CONTACT INFORMATION SECTION
      ===================================================== */}
      <section className="contact-info-section">
        <div className="contact-container">
          {/* Section Header */}
          <div className="contact-section-header">
            <div className="header-step-block">
              <span className="step-number">01</span>
              <span className="step-line"></span>
              <span className="step-label">Get In Touch</span>
            </div>
            <span className="sanctuary-access-tag">Direct Studio Access</span>
          </div>

          {/* Architectural Cards Grid */}
          <div className="contact-cards-grid">
            {/* Card 1: PHONE */}
            <div className="contact-card">
              <div className="card-top-header">
                <div className="icon-circle icon-purple">
                  <Phone size={22} />
                </div>
                <div className="card-badge active-badge">
                  <span className="badge-pulse-dot"></span>
                  <span>Active Now</span>
                </div>
              </div>

              <span className="card-label">PHONE &amp; WHATSAPP</span>
              <a href="tel:+918838894677" className="card-heading-link">
                +91 8838894677
              </a>
              <p className="card-subtext">
                Call or WhatsApp us for instant appointments and styling consultations in Hosur.
              </p>

              <div className="card-footer-box">
                <div className="footer-info-row">
                  <Clock size={16} className="text-purple-600" />
                  <span>Mon–Sun • 9:00 AM – 9:00 PM</span>
                </div>
                <a
                  href="https://wa.me/918838894677"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-action-btn whatsapp-btn"
                >
                  <MessageCircle size={16} />
                  <span>Chat via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card 2: VISIT US */}
            <div className="contact-card">
              <div className="card-top-header">
                <div className="icon-circle icon-secondary">
                  <MapPin size={22} />
                </div>
                <div className="card-badge info-badge">
                  <Car size={14} />
                  <span>Parking Available</span>
                </div>
              </div>

              <span className="card-label">VISIT OUR ATELIER</span>
              <h3 className="card-heading">Hosur Studio</h3>
              <p className="card-subtext">
                3-1/2, Neela Mega Nagar, 1st Cross, Hosur, Tamil Nadu, 635109, India
              </p>

              <div className="card-footer-box">
                <div className="footer-info-row">
                  <Sparkles size={16} className="text-purple-600" />
                  <span>Private VIP Fitting Chambers</span>
                </div>
                <a
                  href="https://maps.google.com/?q=3-1/2+Neela+Mega+Nagar+1st+Cross+Hosur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-action-btn directions-btn"
                >
                  <span>Get Directions</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Card 3: INSTAGRAM */}
            <div className="contact-card">
              <div className="card-top-header">
                <div className="icon-circle icon-gradient">
                  <span className="at-symbol">@</span>
                </div>
                <div className="card-badge journal-badge">
                  <span>Visual Lookbook</span>
                </div>
              </div>

              <span className="card-label">INSTAGRAM</span>
              <a
                href="https://www.instagram.com/wildfloral_beauty_destination/"
                target="_blank"
                rel="noopener noreferrer"
                className="card-heading-link"
              >
                @wildfloral_beauty
              </a>
              <p className="card-subtext">
                Follow our latest bridal makeovers, haircuts, and custom fashion.
              </p>

              {/* Lookbook Gallery Thumbnails */}
              <div className="gallery-thumbnails-grid">
                <div className="thumb-item">
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80"
                    alt="Bridal Hair Styling"
                  />
                </div>
                <div className="thumb-item">
                  <img
                    src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80"
                    alt="Couture Draping Atelier"
                  />
                </div>
                <div className="thumb-item">
                  <img
                    src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80"
                    alt="Luminous Spa Therapy"
                  />
                </div>
              </div>

              <div className="card-footer-box pt-0">
                <a
                  href="https://www.instagram.com/wildfloral_beauty_destination/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-action-btn instagram-btn"
                >
                  <span>View Lookbook Feed</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          3. ENQUIRY CTA SUITE
      ===================================================== */}
      <section className="contact-enquiry-section">
        <div className="contact-container">
          <div className="enquiry-card-container">
            <div className="enquiry-content-grid">
              {/* Left Column Copy */}
              <div className="enquiry-copy-col">
                <div className="contact-eyebrow-pill light-pill">
                  <span className="eyebrow-text">Have A Question?</span>
                </div>

                <h2 className="enquiry-heading">
                  Tell us what{' '}
                  <span className="italic-highlight">you have in mind.</span>
                </h2>

                <p className="enquiry-description">
                  Share your requirements with us and our team will help you find the
                  right beauty service or bespoke fashion solution for your occasion.
                </p>

                <Link to="/enquiry" className="btn-contact-primary">
                  <span>Send An Enquiry</span>
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Right Column Note Badge */}
              <div className="enquiry-note-col">
                <div className="note-card-box">
                  <span className="note-step-badge">02</span>
                  <span className="note-category-title">BEAUTY &amp; FASHION</span>
                  <p className="note-text">
                    Personalized beauty therapies, bespoke tailoring, and luxury experiences created with you in mind.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          4. APPOINTMENT BANNER SECTION (BEAUTY & FASHION)
      ===================================================== */}
      <section className="contact-appointment-section">
        <div className="contact-container">
          <div className="appointment-banner-card">
            <div className="appointment-banner-glow"></div>

            <div className="banner-flex-layout">
              <div className="banner-text-col">
                <span className="banner-eyebrow">READY WHEN YOU ARE</span>
                <h2 className="banner-heading">
                  Your next{' '}
                  <span className="italic-highlight">beautiful experience.</span>
                </h2>
                <p className="banner-subtext">
                  Book a beauty appointment or consult with our fashion atelier
                  for custom apparel design &amp; bespoke styling.
                </p>

                {/* Reassurance List covering both Beauty & Fashion */}
                <div className="reassurance-list">
                  <span className="reassurance-item">
                    <Check size={14} className="text-purple-600" />
                    <span>Beauty Therapy &amp; Doorstep Care</span>
                  </span>
                  <span className="reassurance-bullet">•</span>
                  <span className="reassurance-item">
                    <Check size={14} className="text-purple-600" />
                    <span>Bespoke Fashion &amp; Custom Tailoring</span>
                  </span>
                  <span className="reassurance-bullet">•</span>
                  <span className="reassurance-item">
                    <Check size={14} className="text-purple-600" />
                    <span>Private VIP Chamber Guarantee</span>
                  </span>
                </div>
              </div>

              <div className="banner-action-col">
                <div className="dual-banner-actions">
                  <Link to="/booking" className="btn-contact-primary large-banner-btn">
                    <span>Book Beauty Appointment</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/fashion" className="btn-contact-secondary large-banner-btn">
                    <span>Explore Fashion Atelier</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact