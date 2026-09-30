import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Shield,
  Clock,
  CalendarCheck,
  Scissors,
  CreditCard,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Award
} from 'lucide-react'
import './TermsConditions.css'

const termsSections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'beauty-services', title: '2. Beauty Salon & Therapy Services' },
  { id: 'fashion-couture', title: '3. Bespoke Fashion & Tailoring' },
  { id: 'booking-cancellation', title: '4. Booking, Rescheduling & Cancellations' },
  { id: 'pricing-payments', title: '5. Pricing, Deposits & Payment Terms' },
  { id: 'pickup-delivery', title: '6. Studio Pick-Up & Courier Delivery' },
  { id: 'client-obligations', title: '7. Client Health & Responsibilities' },
  { id: 'intellectual-property', title: '8. Intellectual Property & Portfolio' },
  { id: 'limitation-liability', title: '9. Limitation of Liability' },
  { id: 'governing-law', title: '10. Governing Law & Jurisdiction' },
  { id: 'support-contact', title: '11. Support & Contact Information' }
]

const TermsConditions: React.FC = () => {
  const [activeSection, setActiveSection] = useState('acceptance')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileTocRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      for (const section of termsSections) {
        const element = document.getElementById(section.id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileTocRef.current && !mobileTocRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -110
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(id)
      setMobileMenuOpen(false)
    }
  }

  const activeSectionTitle = termsSections.find((s) => s.id === activeSection)?.title || 'Terms Sections'

  return (
    <main className="legal-page">
      {/* Ambient Lighting */}
      <div className="legal-glow glow-top" />
      <div className="legal-glow glow-accent" />

      {/* Hero Header */}
      <section className="legal-hero">
        <div className="legal-container">
          <div className="legal-breadcrumbs">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <span>Legal</span>
            <ChevronRight size={14} />
            <span className="current">Terms &amp; Conditions</span>
          </div>

          <div className="legal-hero-content">
            <div className="legal-badge-pill">
              <FileText size={14} className="badge-icon" />
              <span>WildFloral Service Agreement</span>
            </div>

            <h1 className="legal-hero-title">
              Terms &amp; <span className="italic-highlight">Conditions</span>
            </h1>

            <p className="legal-hero-subtitle">
              Welcome to WildFloral. These Terms &amp; Conditions govern your access to our beauty therapy treatments, custom apparel tailoring, online reservations, and digital consultation systems.
            </p>

            <div className="legal-meta-row">
              <div className="meta-item">
                <Clock size={15} />
                <span>Last Updated: October 2025</span>
              </div>
              <span className="meta-sep">•</span>
              <div className="meta-item">
                <Award size={15} className="text-purple" />
                <span>Standard Client Service Contract</span>
              </div>
            </div>

            {/* Document Switcher */}
            <div className="legal-doc-switcher">
              <Link to="/privacy" className="inactive-doc">
                <Shield size={15} />
                Privacy Policy
              </Link>
              <span className="active-doc">
                <FileText size={15} />
                Terms &amp; Conditions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Highlights Grid */}
      <section className="legal-highlights-section">
        <div className="legal-container">
          <div className="highlights-grid">
            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <CalendarCheck size={20} />
              </div>
              <h3>Punctual Appointments</h3>
              <p>Reserved slots ensure dedicated 1-on-1 stylist attention. Please notify us in advance if you need to reschedule.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <Scissors size={20} />
              </div>
              <h3>Bespoke Craftsmanship</h3>
              <p>Custom bridal and designer outfits include dedicated fitting trials and complimentary minor adjustments.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <CreditCard size={20} />
              </div>
              <h3>Transparent Pricing</h3>
              <p>Honest quotes with no hidden charges. Advance deposits are required to reserve couture materials and dates.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <Sparkles size={20} />
              </div>
              <h3>Highest Hygiene Standards</h3>
              <p>Sterilized salon equipment, certified organic skincare formulations, and premium grade threads &amp; fabrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Navigation */}
      <section className="legal-body-section">
        <div className="legal-container">
          {/* Mobile Quick Navigation Bar (Active on screen <= 860px) */}
          <div className="mobile-toc-bar" ref={mobileTocRef}>
            <button
              type="button"
              className="mobile-toc-dropdown-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Terms of Service Sections Quick Navigation"
            >
              <div className="mobile-toc-btn-left">
                <BookOpen size={16} />
                <span>{activeSectionTitle}</span>
              </div>
              {mobileMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {mobileMenuOpen && (
              <div className="mobile-toc-menu">
                {termsSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className={`mobile-toc-item ${activeSection === sec.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(sec.id)}
                  >
                    <span className="toc-indicator" />
                    <span>{sec.title}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mobile-toc-pills">
              {termsSections.map((sec, idx) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`mobile-toc-pill-btn ${activeSection === sec.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  {idx + 1}. {sec.title.split('. ')[1] || sec.title}
                </button>
              ))}
            </div>
          </div>

          <div className="legal-layout-grid">
            {/* Sticky Table of Contents (Desktop) */}
            <aside className="legal-sidebar">
              <div className="sidebar-sticky-card">
                <div className="sidebar-header">
                  <BookOpen size={16} />
                  <span>Terms Sections</span>
                </div>
                <nav className="toc-nav">
                  {termsSections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      className={`toc-link ${activeSection === sec.id ? 'active' : ''}`}
                      onClick={() => scrollToSection(sec.id)}
                    >
                      <span className="toc-indicator" />
                      <span className="toc-text">{sec.title}</span>
                    </button>
                  ))}
                </nav>

                <div className="sidebar-help-card">
                  <div className="sidebar-help-icon">
                    <HelpCircle size={16} />
                  </div>
                  <h4>Need clarification?</h4>
                  <p>Call or WhatsApp our studio coordinator directly.</p>
                  <a href="tel:8838894677" className="sidebar-contact-btn">
                    Call Studio Desk
                  </a>
                </div>
              </div>
            </aside>

            {/* Terms Content Column */}
            <div className="legal-content-column">
              {/* 1. Acceptance of Terms */}
              <article id="acceptance" className="legal-section-block">
                <div className="section-number-pill">01</div>
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By booking an appointment, commissioning a couture piece, browsing <strong>wildfloral.online</strong>, or utilizing any of our beauty and fashion services, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                </p>
                <p>
                  If you do not agree with any part of these terms, please refrain from using our digital platform or placing orders. We reserve the right to revise or modify these terms at any time; continued engagement following updates constitutes your consent.
                </p>
              </article>

              {/* 2. Beauty Salon & Therapy Services */}
              <article id="beauty-services" className="legal-section-block">
                <div className="section-number-pill">02</div>
                <h2>2. Beauty Salon &amp; Therapy Services</h2>
                <p>
                  WildFloral provides premium beauty therapy, hair styling, bridal makeover, skin rejuvenation, and spa treatments.
                </p>
                <ul className="legal-bullet-list">
                  <li>
                    <strong>Consultations &amp; Patch Tests:</strong> For chemical hair treatments, intensive facials, or bridal makeup, we strongly recommend a preliminary consultation or patch test 24–48 hours prior to the session to prevent unforeseen allergic reactions.
                  </li>
                  <li>
                    <strong>Punctuality:</strong> We strive to maintain zero waiting times. Please arrive 10 minutes prior to your reserved slot. If you are delayed by more than 15 minutes, we may need to shorten your service duration or reschedule to avoid delaying subsequent clients.
                  </li>
                  <li>
                    <strong>Bridal &amp; Special Occasion Packages:</strong> Bridal bookings must be confirmed with an advance deposit to block master artist slots on peak wedding dates.
                  </li>
                </ul>
              </article>

              {/* 3. Bespoke Fashion & Tailoring */}
              <article id="fashion-couture" className="legal-section-block">
                <div className="section-number-pill">03</div>
                <h2>3. Bespoke Fashion &amp; Apparel Designing</h2>
                <p>
                  Our fashion atelier crafts bespoke bridal blouses, designer gowns, lehengas, kurtis, Aari embroidery work, and custom western/ethnic attire.
                </p>

                <div className="data-type-grid">
                  <div className="data-type-card">
                    <div className="data-type-header">
                      <Scissors size={18} />
                      <h4>Measurements &amp; Sizing</h4>
                    </div>
                    <p>
                      Measurements taken in-studio by our master tailor are recorded for optimal fit. If you provide your own self-taken measurements online, WildFloral cannot be held liable for fit discrepancies resulting from inaccurate measurements.
                    </p>
                  </div>

                  <div className="data-type-card">
                    <div className="data-type-header">
                      <Sparkles size={18} />
                      <h4>Fabric &amp; Embellishments</h4>
                    </div>
                    <p>
                      Clients providing their own raw fabrics are responsible for fabric shrinkage testing and dye stability. We provide curated high-quality silks, organza, and embroidery threads upon request.
                    </p>
                  </div>
                </div>

                <div className="legal-callout-box">
                  <div className="callout-icon">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="callout-content">
                    <strong>Complimentary Fitting Adjustment:</strong> Every custom garment includes one complimentary fitting session within 7 days of garment readiness to ensure your outfit fits flawlessly.
                  </div>
                </div>
              </article>

              {/* 4. Booking, Rescheduling & Cancellations */}
              <article id="booking-cancellation" className="legal-section-block">
                <div className="section-number-pill">04</div>
                <h2>4. Booking, Rescheduling &amp; Cancellations</h2>
                <p>We respect your time and plan our staff and material allocations carefully:</p>
                
                <div className="cookie-types-table-wrap">
                  <table className="legal-table">
                    <thead>
                      <tr>
                        <th>Service Category</th>
                        <th>Notice Required</th>
                        <th>Policy Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Standard Salon Services</strong></td>
                        <td>Minimum 4 Hours</td>
                        <td>Reschedule or cancel at no charge with at least 4 hours advance notice.</td>
                      </tr>
                      <tr>
                        <td><strong>Bridal / Group Packages</strong></td>
                        <td>Minimum 72 Hours</td>
                        <td>Rescheduling subject to artist availability. Advance deposits are non-refundable within 48h of the event.</td>
                      </tr>
                      <tr>
                        <td><strong>Custom Couture Tailoring</strong></td>
                        <td>Prior to Cutting</td>
                        <td>Orders can be altered before fabric cutting begins. Once pattern cutting or Aari embroidery starts, fabric/labor costs apply.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  In the rare event that WildFloral must reschedule your appointment due to unforeseen studio emergencies, we will promptly offer you priority alternative slots or issue an immediate full refund of any deposit paid.
                </p>
              </article>

              {/* 5. Pricing, Deposits & Payment Terms */}
              <article id="pricing-payments" className="legal-section-block">
                <div className="section-number-pill">05</div>
                <h2>5. Pricing, Deposits &amp; Payment Terms</h2>
                <ul className="legal-bullet-list">
                  <li>
                    <strong>Quotes &amp; Estimates:</strong> Custom tailoring quotes are based on design complexity, pattern drafting, embroidery density, and material choice. Written or digital estimates are valid for 15 days.
                  </li>
                  <li>
                    <strong>Advance Deposits:</strong> Bespoke garments require an advance booking deposit (typically 40%–50%) to initiate design drafting and procure specialty materials.
                  </li>
                  <li>
                    <strong>Final Settlement:</strong> The remaining balance is payable upon the final trial or prior to studio pick-up/courier dispatch.
                  </li>
                  <li>
                    <strong>Payment Modes:</strong> We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Major Debit &amp; Credit Cards, and Cash at our studio.
                  </li>
                </ul>
              </article>

              {/* 6. Studio Pick-Up & Courier Delivery */}
              <article id="pickup-delivery" className="legal-section-block">
                <div className="section-number-pill">06</div>
                <h2>6. Studio Pick-Up &amp; Courier Delivery</h2>
                <p>
                  Completed garments can be picked up at our Hosur studio or delivered to your doorstep:
                </p>
                <ul className="legal-bullet-list">
                  <li>
                    <strong>Inspection upon Handover:</strong> We encourage clients picking up garments at the studio to try them on during the handover trial to verify cut, finish, and comfort.
                  </li>
                  <li>
                    <strong>Domestic Courier Shipping:</strong> For outstation deliveries, shipping charges are calculated based on weight and destination pincode. We use reputable insured courier partners.
                  </li>
                  <li>
                    <strong>Unclaimed Garments:</strong> Garments ready for pickup must be collected within 60 days of completion notification. WildFloral is not responsible for unclaimed garments stored past 90 days.
                  </li>
                </ul>
              </article>

              {/* 7. Client Health & Responsibilities */}
              <article id="client-obligations" className="legal-section-block">
                <div className="section-number-pill">07</div>
                <h2>7. Client Health &amp; Responsibilities</h2>
                <div className="legal-callout-box info-box">
                  <div className="callout-icon">
                    <AlertCircle size={18} />
                  </div>
                  <div className="callout-content">
                    <strong>Health Disclosures:</strong>
                    <p>
                      Please inform our therapists of any medical conditions, active skin allergies, pregnancy, recent cosmetic procedures, or hypersensitivities prior to any beauty treatment.
                    </p>
                  </div>
                </div>
                <p>
                  Clients agree to follow post-treatment care instructions (e.g. avoiding direct sun exposure after peels, dry cleaning instructions for silk/embroidered bridal garments) for optimal results.
                </p>
              </article>

              {/* 8. Intellectual Property & Portfolio */}
              <article id="intellectual-property" className="legal-section-block">
                <div className="section-number-pill">08</div>
                <h2>8. Intellectual Property &amp; Portfolio</h2>
                <p>
                  All original design sketches, digital patterns, website graphics, branding, and proprietary styling concepts created by WildFloral remain the intellectual property of WildFloral.
                </p>
                <p>
                  We take immense pride in celebrating our craftsmanship. Photographs of finished bridal makeovers or couture pieces may be included in our studio lookbook or social media showcase only with the client’s explicit verbal or written consent.
                </p>
              </article>

              {/* 9. Limitation of Liability */}
              <article id="limitation-liability" className="legal-section-block">
                <div className="section-number-pill">09</div>
                <h2>9. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by applicable law, WildFloral, its founder, staff, and contractors shall not be liable for any indirect, incidental, or consequential damages arising from:
                </p>
                <ul className="legal-bullet-list">
                  <li>Adverse skin or hair reactions when undisclosed pre-existing medical conditions or allergies were not communicated to our therapists.</li>
                  <li>Fabric shrinkage or bleeding caused by pre-existing manufacturing defects in client-supplied textiles.</li>
                  <li>Unforeseen courier delays caused by weather disruptions, strikes, or transit issues outside our reasonable control.</li>
                </ul>
              </article>

              {/* 10. Governing Law & Jurisdiction */}
              <article id="governing-law" className="legal-section-block">
                <div className="section-number-pill">10</div>
                <h2>10. Governing Law &amp; Jurisdiction</h2>
                <p>
                  These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the laws of the Republic of India.
                </p>
                <p>
                  Any dispute, claim, or controversy arising under or relating to these terms or services provided by WildFloral shall be subject to the exclusive jurisdiction of the competent courts in <strong>Hosur, Krishnagiri District, Tamil Nadu, India</strong>.
                </p>
              </article>

              {/* 11. Support & Contact Information */}
              <article id="support-contact" className="legal-section-block contact-block">
                <div className="section-number-pill">11</div>
                <h2>11. Support &amp; Contact Information</h2>
                <p>
                  For questions regarding our terms, service estimates, or booking policies, please reach out directly:
                </p>

                <div className="contact-cards-grid">
                  <div className="contact-info-card">
                    <div className="card-icon">
                      <Phone size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Customer Support &amp; Bookings</span>
                      <a href="tel:8838894677" className="card-val">8838894677</a>
                    </div>
                  </div>

                  <div className="contact-info-card">
                    <div className="card-icon">
                      <Mail size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Customer Inquiries</span>
                      <a href="mailto:info@wildfloral.online" className="card-val">info@wildfloral.online</a>
                    </div>
                  </div>

                  <div className="contact-info-card full-width">
                    <div className="card-icon">
                      <MapPin size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Studio Atelier Address</span>
                      <p className="card-val">3-1/2, Neela Mega Nagar, 1st Cross, Hosur, Tamil Nadu, India</p>
                    </div>
                  </div>
                </div>

                <div className="contact-action-banner">
                  <div className="banner-text">
                    <h3>Ready to experience WildFloral elegance?</h3>
                    <p>Schedule your personalized beauty appointment or explore custom fashion creations today.</p>
                  </div>
                  <div className="banner-buttons">
                    <Link to="/booking" className="btn-banner-primary">
                      <span>Book Appointment</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/fashion" className="btn-banner-secondary">
                      <span>Explore Fashion</span>
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default TermsConditions
