import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen
} from 'lucide-react'
import { SEO } from '../../../components/common/SEO'
import './PrivacyPolicy.css'

const sections = [
  { id: 'introduction', title: '1. Introduction & Overview' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'payments-security', title: '4. Payments & Financial Data' },
  { id: 'cookies-tracking', title: '5. Cookies & Analytics' },
  { id: 'sharing-disclosure', title: '6. Information Sharing & Third Parties' },
  { id: 'data-retention', title: '7. Data Retention & Security' },
  { id: 'your-rights', title: '8. Your Rights & Choices' },
  { id: 'policy-updates', title: '9. Updates to This Policy' },
  { id: 'contact-us', title: '10. Contact Us' }
]

const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState('introduction')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileTocRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      for (const section of sections) {
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

  const activeSectionTitle = sections.find((s) => s.id === activeSection)?.title || 'Table of Contents'

  return (
    <main className="legal-page">
      <SEO
        title="Privacy Policy | WildFloral"
        description="Learn how WildFloral protects your privacy and handles your personal information when booking beauty services or fashion consultations in Hosur."
        canonical="https://www.wildfloral.online/privacy"
      />
      {/* Background Glows */}
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
            <span className="current">Privacy Policy</span>
          </div>

          <div className="legal-hero-content">
            <div className="legal-badge-pill">
              <Shield size={14} className="badge-icon" />
              <span>WildFloral Legal &amp; Data Protection</span>
            </div>

            <h1 className="legal-hero-title">
              Privacy <span className="italic-highlight">Policy</span>
            </h1>

            <p className="legal-hero-subtitle">
              At WildFloral Beauty &amp; Fashion Studio, we value your trust. This Privacy Policy explains transparently how we collect, handle, safeguard, and respect your personal information when you visit our studio, use our website, book services, or consult with our designers.
            </p>

            <div className="legal-meta-row">
              <div className="meta-item">
                <Clock size={15} />
                <span>Last Updated: October 2025</span>
              </div>
              <span className="meta-sep">•</span>
              <div className="meta-item">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>Applicable to all WildFloral Web &amp; Studio Services</span>
              </div>
            </div>

            {/* Document Switcher */}
            <div className="legal-doc-switcher">
              <span className="active-doc">
                <Shield size={15} />
                Privacy Policy
              </span>
              <Link to="/terms" className="inactive-doc">
                <FileText size={15} />
                Terms &amp; Conditions
                <ArrowRight size={14} />
              </Link>
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
                <Lock size={20} />
              </div>
              <h3>Zero Sale of Personal Data</h3>
              <p>We never sell, rent, or trade your personal contact or styling information to any third parties for marketing purposes.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <Shield size={20} />
              </div>
              <h3>Bank-Grade Security</h3>
              <p>All online transactions and customer accounts are guarded with modern industry-standard encryption protocols.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <Sparkles size={20} />
              </div>
              <h3>Tailored Luxury Experience</h3>
              <p>Your measurements, skin profile, and beauty preferences are utilized strictly to deliver bespoke couture and salon care.</p>
            </div>

            <div className="highlight-card">
              <div className="highlight-icon-wrapper">
                <UserCheck size={20} />
              </div>
              <h3>Complete User Control</h3>
              <p>You can request access, corrections, or complete deletion of your account and records at any time with ease.</p>
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
              aria-label="Table of Contents Quick Navigation"
            >
              <div className="mobile-toc-btn-left">
                <BookOpen size={16} />
                <span>{activeSectionTitle}</span>
              </div>
              {mobileMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {mobileMenuOpen && (
              <div className="mobile-toc-menu">
                {sections.map((sec) => (
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
              {sections.map((sec, idx) => (
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
                  <span>Table of Contents</span>
                </div>
                <nav className="toc-nav">
                  {sections.map((sec) => (
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
                    <Mail size={16} />
                  </div>
                  <h4>Have questions?</h4>
                  <p>Reach out to our privacy compliance desk directly.</p>
                  <a href="mailto:info@wildfloral.online" className="sidebar-contact-btn">
                    Email Privacy Team
                  </a>
                </div>
              </div>
            </aside>

            {/* Legal Document Content */}
            <div className="legal-content-column">
              {/* 1. Introduction & Overview */}
              <article id="introduction" className="legal-section-block">
                <div className="section-number-pill">01</div>
                <h2>1. Introduction &amp; Overview</h2>
                <p>
                  Welcome to <strong>WildFloral</strong> ("we", "our", or "us"). Operating both as a premium beauty wellness therapy studio and a bespoke fashion &amp; apparel atelier located at Hosur, Tamil Nadu, we are committed to upholding the highest standards of privacy, confidentiality, and data ethics.
                </p>
                <p>
                  This Privacy Policy applies to our website (<strong>wildfloral.online</strong>), customer dashboard portal, appointment booking systems, AI Fashion Consultation features, and in-person studio interactions. By accessing or using any of our services, you acknowledge that you have read and understood the practices detailed in this document.
                </p>
                <div className="legal-callout-box">
                  <div className="callout-icon">
                    <Sparkles size={18} />
                  </div>
                  <div className="callout-content">
                    <strong>Our Core Promise:</strong> We treat your personal beauty records, custom bridal measurements, and styling preferences with absolute discretion and artistic integrity.
                  </div>
                </div>
              </article>

              {/* 2. Information We Collect */}
              <article id="information-collected" className="legal-section-block">
                <div className="section-number-pill">02</div>
                <h2>2. Information We Collect</h2>
                <p>
                  To provide you with seamless appointment scheduling, personalized beauty treatments, and tailored apparel craftsmanship, we collect relevant information in the following categories:
                </p>

                <div className="data-type-grid">
                  <div className="data-type-card">
                    <div className="data-type-header">
                      <UserCheck size={18} />
                      <h4>Contact &amp; Identity</h4>
                    </div>
                    <ul>
                      <li>Full Name</li>
                      <li>Phone number &amp; WhatsApp contact</li>
                      <li>Email address</li>
                      <li>Delivery / Billing Address (for couture shipping)</li>
                    </ul>
                  </div>

                  <div className="data-type-card">
                    <div className="data-type-header">
                      <Sparkles size={18} />
                      <h4>Beauty &amp; Fashion Profile</h4>
                    </div>
                    <ul>
                      <li>Custom body measurements &amp; sizing notes</li>
                      <li>Skin type, hair history &amp; allergies (voluntary)</li>
                      <li>Inspiration images, sketches &amp; fabric choices</li>
                      <li>Event dates (wedding, reception, ceremonies)</li>
                    </ul>
                  </div>

                  <div className="data-type-card">
                    <div className="data-type-header">
                      <Clock size={18} />
                      <h4>Booking &amp; Service History</h4>
                    </div>
                    <ul>
                      <li>Service reservations, dates &amp; preferred time slots</li>
                      <li>Bespoke order status &amp; alteration logs</li>
                      <li>Communication logs and customer support inquiries</li>
                      <li>Stylist / Master tailor assignment notes</li>
                    </ul>
                  </div>

                  <div className="data-type-card">
                    <div className="data-type-header">
                      <Eye size={18} />
                      <h4>Technical &amp; Usage Data</h4>
                    </div>
                    <ul>
                      <li>Device type, browser version &amp; IP address</li>
                      <li>Pages visited on wildfloral.online and interaction timestamps</li>
                      <li>AI Fashion Enquiry chat prompts &amp; preferences</li>
                      <li>Authentication tokens for registered customer accounts</li>
                    </ul>
                  </div>
                </div>
              </article>

              {/* 3. How We Use Your Information */}
              <article id="how-we-use" className="legal-section-block">
                <div className="section-number-pill">03</div>
                <h2>3. How We Use Your Information</h2>
                <p>We process your personal information strictly for legitimate and service-related purposes, including:</p>
                
                <ul className="legal-bullet-list">
                  <li>
                    <strong>Appointment Scheduling &amp; Confirmations:</strong> Sending SMS, WhatsApp, and email booking confirmations, slot reminders, and rescheduling updates.
                  </li>
                  <li>
                    <strong>Bespoke Garment Creation:</strong> Designing, drafting pattern cuts, taking accurate stitch measurements, and conducting fittings for custom blouses, gowns, and bridal couture.
                  </li>
                  <li>
                    <strong>Personalized Beauty Therapies:</strong> Tailoring hair, facial, and spa treatments to ensure safe application without triggering allergen sensitivities.
                  </li>
                  <li>
                    <strong>AI Fashion Assistant Intelligence:</strong> Processing style requirements to provide instant fashion suggestions, fabric estimates, and style recommendations.
                  </li>
                  <li>
                    <strong>Customer Support &amp; Order Updates:</strong> Notifying you when your customized garments are ready for studio trial or dispatch.
                  </li>
                  <li>
                    <strong>Exclusive Studio Offers (Opt-In):</strong> Sending seasonal festive offers, bridal packages, and VIP salon perks only when you have explicitly consented.
                  </li>
                </ul>
              </article>

              {/* 4. Payments & Financial Data */}
              <article id="payments-security" className="legal-section-block">
                <div className="section-number-pill">04</div>
                <h2>4. Payments &amp; Financial Data</h2>
                <p>
                  When you make an advance deposit or complete payments online through <strong>wildfloral.online</strong>:
                </p>
                <div className="legal-callout-box info-box">
                  <div className="callout-icon">
                    <Lock size={18} />
                  </div>
                  <div className="callout-content">
                    <strong>We do NOT store credit/debit card numbers or bank passwords.</strong>
                    <p>
                      All digital payments are processed through RBI-authorized, PCI-DSS compliant payment gateways (such as Razorpay / UPI / Netbanking / Stripe). WildFloral receives only a cryptographic transaction confirmation and receipt reference.
                    </p>
                  </div>
                </div>
                <p>
                  In-studio payments via POS swipe machines, UPI QR codes, or cash are recorded securely in our studio management ledger solely for invoicing, tax compliance (GST), and customer loyalty tracking.
                </p>
              </article>

              {/* 5. Cookies & Analytics */}
              <article id="cookies-tracking" className="legal-section-block">
                <div className="section-number-pill">05</div>
                <h2>5. Cookies &amp; Tracking Technologies</h2>
                <p>
                  Our website uses minimal, functional cookies and secure local storage mechanisms to improve your browsing experience:
                </p>
                <div className="cookie-types-table-wrap">
                  <table className="legal-table">
                    <thead>
                      <tr>
                        <th>Cookie Type</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Essential Session</strong></td>
                        <td>Keeps you signed in to your Customer Dashboard and maintains your shopping/booking cart state.</td>
                        <td>Session / 30 Days</td>
                      </tr>
                      <tr>
                        <td><strong>Preferences</strong></td>
                        <td>Remembers language, currency settings (INR ₹), and theme preferences.</td>
                        <td>1 Year</td>
                      </tr>
                      <tr>
                        <td><strong>Performance &amp; Analytics</strong></td>
                        <td>Helps us measure page speed, popular service categories, and navigation flow to optimize responsiveness.</td>
                        <td>90 Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  You can configure your browser settings at any time to decline non-essential cookies. However, some portal features like automated login preservation may require essential cookies.
                </p>
              </article>

              {/* 6. Sharing & Disclosure */}
              <article id="sharing-disclosure" className="legal-section-block">
                <div className="section-number-pill">06</div>
                <h2>6. Information Sharing &amp; Third Parties</h2>
                <p>
                  WildFloral does not engage in selling or leasing user data. We only disclose necessary information in limited circumstances:
                </p>
                <ul className="legal-bullet-list">
                  <li>
                    <strong>Verified Delivery Partners:</strong> Sharing your name, delivery address, and phone number with trusted courier services (e.g., DTDC, India Post, Blue Dart) for dispatching custom garments.
                  </li>
                  <li>
                    <strong>Cloud Infrastructure &amp; Database Hosts:</strong> Secure database storage (Supabase / AWS) adhering to strict enterprise-grade security standards.
                  </li>
                  <li>
                    <strong>Legal &amp; Regulatory Compliance:</strong> If mandated by applicable Indian law, court order, or governmental authorities for tax, accounting, or legal prevention.
                  </li>
                  <li>
                    <strong>Portfolio Consent:</strong> We will only post pictures of bridal makeovers, bespoke blouses, or garments on our social media / website if you have given us prior explicit permission.
                  </li>
                </ul>
              </article>

              {/* 7. Data Retention & Security */}
              <article id="data-retention" className="legal-section-block">
                <div className="section-number-pill">07</div>
                <h2>7. Data Retention &amp; Security Measures</h2>
                <p>
                  We implement robust administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, destruction, loss, or alteration.
                </p>
                <div className="security-badges-list">
                  <div className="sec-badge-item">
                    <CheckCircle2 size={16} className="text-purple" />
                    <span>End-to-end SSL/TLS 256-bit encryption on all web endpoints</span>
                  </div>
                  <div className="sec-badge-item">
                    <CheckCircle2 size={16} className="text-purple" />
                    <span>Role-based access controls limiting staff access to customer data</span>
                  </div>
                  <div className="sec-badge-item">
                    <CheckCircle2 size={16} className="text-purple" />
                    <span>Regular automated backups and sanitized database practices</span>
                  </div>
                </div>
                <p>
                  We retain your account history and measurement charts as long as your customer profile remains active so you can effortlessly reorder customized outfits without remeasuring. You may request data deletion whenever desired.
                </p>
              </article>

              {/* 8. Your Rights & Choices */}
              <article id="your-rights" className="legal-section-block">
                <div className="section-number-pill">08</div>
                <h2>8. Your Rights &amp; Choices</h2>
                <p>As a valued client of WildFloral, you enjoy comprehensive rights regarding your personal information:</p>
                <div className="rights-cards-grid">
                  <div className="rights-item">
                    <h4>Access &amp; Export</h4>
                    <p>Request a complete copy of the personal records and measurement charts we hold in your profile.</p>
                  </div>
                  <div className="rights-item">
                    <h4>Correction &amp; Update</h4>
                    <p>Instantly update your phone number, addresses, or profile details directly from the Customer Dashboard.</p>
                  </div>
                  <div className="rights-item">
                    <h4>Marketing Opt-Out</h4>
                    <p>Opt out of promotional WhatsApp alerts or email newsletters at any time with a single reply or click.</p>
                  </div>
                  <div className="rights-item">
                    <h4>Data Erasure</h4>
                    <p>Request the complete permanent removal of your account, history, and uploaded design files.</p>
                  </div>
                </div>
              </article>

              {/* 9. Updates to This Policy */}
              <article id="policy-updates" className="legal-section-block">
                <div className="section-number-pill">09</div>
                <h2>9. Updates to This Privacy Policy</h2>
                <p>
                  We may periodically update this Privacy Policy to reflect innovations in our studio services, changes in applicable data protection laws, or enhancements to our digital platform.
                </p>
                <p>
                  Any material modifications will be announced with an updated "Last Updated" date at the top of this page, and significant changes will be communicated via notification banner or email to registered users.
                </p>
              </article>

              {/* 10. Contact Us */}
              <article id="contact-us" className="legal-section-block contact-block">
                <div className="section-number-pill">10</div>
                <h2>10. Contact Us &amp; Privacy Officer</h2>
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out to our team through any of the channels below:
                </p>

                <div className="contact-cards-grid">
                  <div className="contact-info-card">
                    <div className="card-icon">
                      <Phone size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Direct Call &amp; WhatsApp</span>
                      <a href="tel:8838894677" className="card-val">8838894677</a>
                    </div>
                  </div>

                  <div className="contact-info-card">
                    <div className="card-icon">
                      <Mail size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Official Email</span>
                      <a href="mailto:info@wildfloral.online" className="card-val">info@wildfloral.online</a>
                    </div>
                  </div>

                  <div className="contact-info-card full-width">
                    <div className="card-icon">
                      <MapPin size={18} />
                    </div>
                    <div className="card-info">
                      <span className="card-lbl">Studio Atelier Location</span>
                      <p className="card-val">3-1/2, Neela Mega Nagar, 1st Cross, Hosur, Tamil Nadu, India</p>
                    </div>
                  </div>
                </div>

                <div className="contact-action-banner">
                  <div className="banner-text">
                    <h3>Need custom assistance with your styling or booking?</h3>
                    <p>Our beauty therapists and fashion consultants are here to help you every step of the way.</p>
                  </div>
                  <div className="banner-buttons">
                    <Link to="/contact" className="btn-banner-primary">
                      <span>Contact Studio</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/enquiry" className="btn-banner-secondary">
                      <span>Make an Enquiry</span>
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

export default PrivacyPolicy
