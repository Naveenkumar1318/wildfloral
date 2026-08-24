import { Link } from 'react-router'
import './Contact.css'

const phoneNumber = '8838894677'
const whatsappNumber = '918838894677'

function Contact() {
  const whatsappMessage = encodeURIComponent(
    'Hello WildFloral, I would like to know more about your services.'
  )

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-eyebrow">
            CONTACT WILDFLORAL
          </span>

          <h1>
            Let's create
            <span>something beautiful.</span>
          </h1>

          <p>
            Have a beauty service in mind, planning a special
            occasion, or looking for custom fashion? We'd love
            to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-information">
        <div className="contact-details">
          <span className="contact-eyebrow">
            GET IN TOUCH
          </span>

          <h2>
            We're here
            <span>for you.</span>
          </h2>

          <div className="contact-detail-list">
            <div className="contact-detail">
              <span className="contact-detail-number">
                01
              </span>

              <div>
                <small>CALL US</small>

                <a href={`tel:+91${phoneNumber}`}>
                  +91 {phoneNumber}
                </a>

                <p>
                  Call us for appointments, service details,
                  and consultations.
                </p>
              </div>
            </div>

            <div className="contact-detail">
              <span className="contact-detail-number">
                02
              </span>

              <div>
                <small>WHATSAPP</small>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat with WildFloral
                </a>

                <p>
                  Send us your requirements and we'll help
                  you choose the right service.
                </p>
              </div>
            </div>

            <div className="contact-detail">
              <span className="contact-detail-number">
                03
              </span>

              <div>
                <small>VISIT US</small>

                <address>
                  3-1/2, Neela Mega Nagar 1st Cross
                </address>

                <p>
                  Visit the WildFloral beauty and fashion
                  studio.
                </p>
              </div>
            </div>

            <div className="contact-detail">
              <span className="contact-detail-number">
                04
              </span>

              <div>
                <small>INSTAGRAM</small>

                <a
                  href="https://instagram.com/wildfloral.beauty.destination"
                  target="_blank"
                  rel="noreferrer"
                >
                  @wildfloral.beauty.destination
                </a>

                <p>
                  Follow our latest beauty and fashion work.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-hours">
          <span className="contact-eyebrow">
            OPENING HOURS
          </span>

          <h2>
            Open every day,
            <span>for your convenience.</span>
          </h2>

          <div className="contact-hours-card">
            <div>
              <span>Monday — Sunday</span>
              <strong>08:00 AM — 08:00 PM</strong>
            </div>
          </div>

          <div className="contact-home-service">
            <span>HOME SERVICE</span>

            <p>
              Home services are also available for selected
              beauty services. Please contact us to confirm
              availability.
            </p>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                'Hello WildFloral, I would like to enquire about home service.'
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Enquire About Home Service →
            </a>
          </div>
        </div>
      </section>

      <section className="contact-actions">
        <div>
          <span className="contact-eyebrow">
            READY WHEN YOU ARE
          </span>

          <h2>
            Prefer to book
            <span>directly?</span>
          </h2>

          <p>
            Choose your service, preferred date, and
            available time through our booking page.
          </p>
        </div>

        <div className="contact-action-buttons">
          <Link
            to="/booking"
            className="contact-primary-button"
          >
            Book Appointment
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
      </section>
    </main>
  )
}

export default Contact