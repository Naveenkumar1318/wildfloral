import { Link } from 'react-router'

import './Contact.css'

const phoneNumber = '8838894677'
const whatsappNumber = '918838894677'

function Contact() {
  const whatsappMessage = encodeURIComponent(
    'Hello WildFloral, I would like to know more about your services.'
  )

  const homeServiceMessage = encodeURIComponent(
    'Hello WildFloral, I would like to enquire about home service.'
  )

  return (
    <main className="contact-page">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="contact-hero">
        <div className="contact-hero-background" />

        <div className="contact-hero-content">
          <div className="contact-hero-kicker">
            <span>06</span>
            <span>WILDFLORAL CONTACT</span>
          </div>

          <span className="contact-eyebrow">
            GET IN TOUCH
          </span>

          <h1>
            Let's create
            <em>something beautiful.</em>
          </h1>

          <p>
            Have a beauty service in mind, planning a special
            occasion, or looking for custom fashion? We'd love
            to hear from you.
          </p>

          <div className="contact-hero-actions">
            <Link
              to="/booking"
              className="contact-primary-button"
            >
              Book Appointment
              <span>↗</span>
            </Link>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="contact-secondary-button"
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        <div className="contact-hero-mark">
          WILDFLORAL
        </div>
      </section>

      {/* =====================================================
          CONTACT INFORMATION
      ===================================================== */}

      <section className="contact-information">
        <div className="contact-information-inner">
          <div className="contact-details">
            <div className="contact-section-heading">
              <span className="contact-eyebrow">
                GET IN TOUCH
              </span>

              <h2>
                We're here
                <em>for you.</em>
              </h2>

              <p>
                Whether you have a question, need help
                selecting a service, or want to discuss a
                special occasion, our team is ready to help.
              </p>
            </div>

            <div className="contact-detail-list">
              {/* CALL */}

              <a
                href={`tel:+91${phoneNumber}`}
                className="contact-detail"
              >
                <span className="contact-detail-number">
                  01
                </span>

                <div className="contact-detail-main">
                  <span className="contact-detail-label">
                    CALL US
                  </span>

                  <strong>
                    +91 {phoneNumber}
                  </strong>

                  <p>
                    Appointments, service details, and
                    consultations.
                  </p>
                </div>

                <span className="contact-detail-arrow">
                  ↗
                </span>
              </a>

              {/* WHATSAPP */}

              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="contact-detail"
              >
                <span className="contact-detail-number">
                  02
                </span>

                <div className="contact-detail-main">
                  <span className="contact-detail-label">
                    WHATSAPP
                  </span>

                  <strong>
                    Chat with WildFloral
                  </strong>

                  <p>
                    Send your requirements and we'll help
                    you choose the right service.
                  </p>
                </div>

                <span className="contact-detail-arrow">
                  ↗
                </span>
              </a>

              {/* ADDRESS */}

              <div className="contact-detail">
                <span className="contact-detail-number">
                  03
                </span>

                <div className="contact-detail-main">
                  <span className="contact-detail-label">
                    VISIT US
                  </span>

                  <address>
                    3-1/2, Neela Mega Nagar 1st Cross
                  </address>

                  <p>
                    Visit the WildFloral beauty and fashion
                    studio.
                  </p>
                </div>
              </div>

              {/* INSTAGRAM */}

              <a
                href="https://instagram.com/wildfloral.beauty.destination"
                target="_blank"
                rel="noreferrer"
                className="contact-detail"
              >
                <span className="contact-detail-number">
                  04
                </span>

                <div className="contact-detail-main">
                  <span className="contact-detail-label">
                    INSTAGRAM
                  </span>

                  <strong>
                    @wildfloral.beauty.destination
                  </strong>

                  <p>
                    Follow our latest beauty and fashion
                    work.
                  </p>
                </div>

                <span className="contact-detail-arrow">
                  ↗
                </span>
              </a>
            </div>
          </div>

          {/* =================================================
              HOURS
          ================================================= */}

          <aside className="contact-hours">
            <div className="contact-hours-card">
              <div className="contact-hours-top">
                <span className="contact-eyebrow">
                  OPENING HOURS
                </span>

                <span className="contact-hours-status">
                  OPEN DAILY
                </span>
              </div>

              <h2>
                Open every day,
                <em>for your convenience.</em>
              </h2>

              <div className="contact-hours-row">
                <span>Monday — Sunday</span>

                <strong>
                  08:00 AM — 08:00 PM
                </strong>
              </div>

              <div className="contact-hours-divider" />

              <div className="contact-hours-note">
                <span>BOOKING NOTE</span>

                <p>
                  Appointment availability may vary by
                  service and professional. We recommend
                  booking in advance for bridal and special
                  occasion services.
                </p>
              </div>
            </div>

            {/* HOME SERVICE */}

            <div className="contact-home-service">
              <div>
                <span className="contact-home-label">
                  HOME SERVICE
                </span>

                <h3>
                  Beauty care,
                  <em>where you need it.</em>
                </h3>

                <p>
                  Home services are available for selected
                  beauty services. Contact us to confirm
                  availability.
                </p>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber}?text=${homeServiceMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                Enquire About Home Service
                <span>↗</span>
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* =====================================================
          DIRECT BOOKING
      ===================================================== */}

      <section className="contact-actions">
        <div className="contact-actions-inner">
          <div className="contact-actions-heading">
            <span className="contact-eyebrow">
              READY WHEN YOU ARE
            </span>

            <h2>
              Prefer to book
              <em>directly?</em>
            </h2>

            <p>
              Choose your service, preferred date, and
              available time through our booking page.
            </p>
          </div>

          <div className="contact-action-buttons">
            <Link
              to="/booking"
              className="contact-action-primary"
            >
              Book Appointment
              <span>↗</span>
            </Link>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="contact-action-secondary"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL BRAND STRIP
      ===================================================== */}

      <section className="contact-brand-strip">
        <span>BEAUTY</span>
        <i />
        <span>FASHION</span>
        <i />
        <span>CRAFT</span>
        <i />
        <span>YOU</span>
      </section>
    </main>
  )
}

export default Contact