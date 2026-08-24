import { Link } from 'react-router'
import heroImage from '../../assets/hero.png'

import './Services.css'

type Service = {
  category: string
  name: string
  description: string
  duration: string
  price: string
  badge?: string
}

const featuredServices: Service[] = [
  {
    category: 'HAIR',
    name: 'Hair Styling',
    description:
      'Professional styling for everyday looks and special occasions.',
    duration: '60 min',
    price: 'From ₹800',
    badge: 'Popular',
  },
  {
    category: 'MAKEUP',
    name: 'Party Makeup',
    description:
      'A polished and glamorous look created for your celebration.',
    duration: '90 min',
    price: 'From ₹2,500',
  },
  {
    category: 'BRIDAL',
    name: 'Bridal Makeup',
    description:
      'Complete bridal beauty styling for your most memorable day.',
    duration: '2 hours',
    price: 'From ₹8,500',
    badge: 'Best Seller',
  },
  {
    category: 'SKIN CARE',
    name: 'Facial & Skin Care',
    description:
      'Professional treatments for fresh, healthy-looking skin.',
    duration: '60 min',
    price: 'From ₹1,200',
  },
  {
    category: 'NAILS',
    name: 'Manicure & Pedicure',
    description:
      'Relaxing nail care with a clean and polished finish.',
    duration: '60 min',
    price: 'From ₹800',
  },
  {
    category: 'MEHENDI',
    name: 'Mehendi',
    description:
      'Beautiful designs for celebrations and special occasions.',
    duration: '45 min',
    price: 'From ₹500',
  },
]

const categories = [
  'All',
  'Hair',
  'Makeup',
  'Bridal',
  'Skin Care',
  'Nails',
  'Mehendi',
  'Saree Draping',
]

function Services() {
  return (
    <main className="services-page">
      <section className="services-intro">
        <div className="services-intro-content">
          <span className="services-eyebrow">
            WILDFLORAL BEAUTY DESTINATION
          </span>

          <h1>
            Beauty services,
            <span>made personal.</span>
          </h1>

          <p>
            Professional beauty care created around your
            style, occasion, and individual needs.
          </p>
        </div>
      </section>

      <section className="services-showcase">
        <div className="services-heading-row">
          <div>
            <span className="services-eyebrow">
              OUR SERVICES
            </span>

            <h2>
              Discover your
              <span>perfect service.</span>
            </h2>
          </div>

          <Link
            to="/booking"
            className="services-heading-link"
          >
            Book Appointment →
          </Link>
        </div>

        <nav
          className="services-categories"
          aria-label="Service categories"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              className={
                index === 0
                  ? 'service-category-button active'
                  : 'service-category-button'
              }
              type="button"
            >
              {category}
            </button>
          ))}
        </nav>

        <div className="services-carousel">
          {featuredServices.map((service) => (
            <article
              className="service-card"
              key={service.name}
            >
              <div className="service-card-image">
                {service.badge && (
                  <span className="service-card-badge">
                    {service.badge}
                  </span>
                )}

                <img
                  src={heroImage}
                  alt={service.name}
                />

                <button
                  className="service-card-favorite"
                  type="button"
                  aria-label={`Save ${service.name}`}
                >
                  ♡
                </button>
              </div>

              <div className="service-card-content">
                <span className="service-card-category">
                  {service.category}
                </span>

                <h3>{service.name}</h3>

                <p>{service.description}</p>

                <div className="service-card-meta">
                  <span>{service.duration}</span>

                  <strong>{service.price}</strong>
                </div>

                <Link
                  to="/booking"
                  className="service-card-button"
                >
                  Book Now
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="services-carousel-footer">
          <span className="services-carousel-indicator">
            01 — 06
          </span>

          <div className="services-carousel-line">
            <span />
          </div>

          <Link
            to="/booking"
            className="services-view-all"
          >
            View All Services →
          </Link>
        </div>
      </section>

      <section className="services-home-service">
        <div className="services-home-service-content">
          <span className="services-eyebrow">
            AT HOME
          </span>

          <h2>
            Beauty care,
            <span>where you need it.</span>
          </h2>

          <p>
            Home service is also available for selected
            beauty services. Choose home service while
            booking and we'll confirm the details with you.
          </p>

          <Link
            to="/booking"
            className="services-primary-button"
          >
            Book Home Service
          </Link>
        </div>

        <div className="services-home-service-image">
          <img
            src={heroImage}
            alt="WildFloral beauty service"
          />
        </div>
      </section>

      <section className="services-fashion-link">
        <span className="services-eyebrow">
          WILDFLORAL FASHION STUDIO
        </span>

        <h2>
          Looking for something
          <span>made just for you?</span>
        </h2>

        <p>
          Explore custom dresses, Aari work, blouse work,
          and embroidery created around your style.
        </p>

        <Link
          to="/fashion"
          className="services-secondary-button"
        >
          Explore Fashion
        </Link>
      </section>
    </main>
  )
}

export default Services