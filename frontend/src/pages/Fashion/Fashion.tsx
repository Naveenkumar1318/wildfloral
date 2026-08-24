import { Link } from 'react-router'
import heroImage from '../../assets/hero.png'

import './Fashion.css'

type FashionService = {
  name: string
  description: string
  badge?: string
}

const fashionServices: FashionService[] = [
  {
    name: 'Custom Dresses',
    description:
      'Personalized outfits created around your measurements, occasion, and individual style.',
    badge: 'POPULAR',
  },
  {
    name: 'Aari Work',
    description:
      'Detailed handcrafted Aari embroidery designed to add character and elegance to your outfit.',
  },
  {
    name: 'Blouse Work',
    description:
      'Custom blouse designs with detailed finishing, embroidery, and styling for your saree.',
    badge: 'SPECIALTY',
  },
  {
    name: 'Embroidery',
    description:
      'Beautiful embroidery work customized to complement your fabric, design, and occasion.',
  },
]

function Fashion() {
  return (
    <main className="fashion-page">
      <section className="fashion-hero">
        <div className="fashion-hero-content">
          <span className="fashion-eyebrow">
            WILDFLORAL FASHION STUDIO
          </span>

          <h1>
            Designed around you,
            <span>made by hand.</span>
          </h1>

          <p>
            Custom fashion created with attention to detail,
            thoughtful design, and your individual style.
          </p>

          <Link
            to="/booking"
            className="fashion-primary-button"
          >
            Book a Consultation
          </Link>
        </div>

        <div className="fashion-hero-image">
          <img
            src={heroImage}
            alt="WildFloral custom fashion"
          />
        </div>
      </section>

      <section className="fashion-services">
        <div className="fashion-heading">
          <div>
            <span className="fashion-eyebrow">
              OUR CRAFT
            </span>

            <h2>
              Made for your
              <span>special moments.</span>
            </h2>
          </div>

          <p>
            From custom dresses to detailed embroidery,
            every piece is created around your requirements.
          </p>
        </div>

        <div className="fashion-card-grid">
          {fashionServices.map((service) => (
            <article
              className="fashion-card"
              key={service.name}
            >
              <div className="fashion-card-image">
                {service.badge && (
                  <span className="fashion-card-badge">
                    {service.badge}
                  </span>
                )}

                <img
                  src={heroImage}
                  alt={service.name}
                />
              </div>

              <div className="fashion-card-content">
                <span className="fashion-card-label">
                  FASHION STUDIO
                </span>

                <h3>{service.name}</h3>

                <p>{service.description}</p>

                <div className="fashion-card-footer">
                  <span>By consultation</span>

                  <Link to="/booking">
                    Enquire →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fashion-process">
        <div className="fashion-process-heading">
          <span className="fashion-eyebrow">
            THE PROCESS
          </span>

          <h2>
            From your idea
            <span>to the final detail.</span>
          </h2>
        </div>

        <div className="fashion-process-list">
          <div className="fashion-process-item">
            <span>01</span>

            <div>
              <h3>Consultation</h3>
              <p>
                Discuss your occasion, preferred style,
                fabric, colours, and design requirements.
              </p>
            </div>
          </div>

          <div className="fashion-process-item">
            <span>02</span>

            <div>
              <h3>Design & Measurements</h3>
              <p>
                We understand your measurements and refine
                the design details before work begins.
              </p>
            </div>
          </div>

          <div className="fashion-process-item">
            <span>03</span>

            <div>
              <h3>Crafting</h3>
              <p>
                Your selected work is carefully created with
                attention to finishing and detail.
              </p>
            </div>
          </div>

          <div className="fashion-process-item">
            <span>04</span>

            <div>
              <h3>Final Fitting</h3>
              <p>
                The finished piece is reviewed and adjusted
                where necessary before delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fashion-consultation">
        <span className="fashion-eyebrow">
          PERSONALIZED SERVICE
        </span>

        <h2>
          Have something
          <span>special in mind?</span>
        </h2>

        <p>
          Tell us what you are looking for and we'll discuss
          the design, measurements, materials, and details
          with you.
        </p>

        <Link
          to="/booking"
          className="fashion-secondary-button"
        >
          Start a Consultation
        </Link>
      </section>
    </main>
  )
}

export default Fashion