import { Link } from 'react-router'
import { assets } from '../../assets/assets'

import './Portfolio.css'

type PortfolioItem = {
  category: string
  title: string
  description: string
}

const portfolioItems: PortfolioItem[] = [
  {
    category: 'BEAUTY',
    title: 'Beauty Styling',
    description:
      'Personalized beauty looks created around each client and occasion.',
  },
  {
    category: 'BRIDAL',
    title: 'Bridal Beauty',
    description:
      'Elegant bridal makeup and styling for memorable celebrations.',
  },
  {
    category: 'HAIR',
    title: 'Hair Styling',
    description:
      'Professional hair styling designed for everyday and special occasions.',
  },
  {
    category: 'FASHION',
    title: 'Custom Fashion',
    description:
      'Personalized outfits created around individual style and measurements.',
  },
  {
    category: 'AARI WORK',
    title: 'Aari Embroidery',
    description:
      'Detailed handcrafted embroidery created for custom fashion pieces.',
  },
  {
    category: 'MEHENDI',
    title: 'Mehendi',
    description:
      'Beautiful mehendi designs for celebrations and special moments.',
  },
]

const categories = [
  'All',
  'Beauty',
  'Bridal',
  'Hair',
  'Fashion',
  'Aari Work',
  'Mehendi',
]

function Portfolio() {
  return (
    <main className="portfolio-page">
      <section className="portfolio-hero">
        <div className="portfolio-hero-content">
          <span className="portfolio-eyebrow">
            OUR WORK
          </span>

          <h1>
            A glimpse of
            <span>what we create.</span>
          </h1>

          <p>
            Explore selected beauty and fashion work from
            WildFloral. Every look, design, and detail is
            created with care.
          </p>
        </div>
      </section>

      <section className="portfolio-gallery">
        <div className="portfolio-heading">
          <div>
            <span className="portfolio-eyebrow">
              WILDFLORAL PORTFOLIO
            </span>

            <h2>
              Beauty, fashion,
              <span>and craftsmanship.</span>
            </h2>
          </div>

          <p>
            Discover the work behind WildFloral and find
            inspiration for your own look or design.
          </p>
        </div>

        <nav
          className="portfolio-filters"
          aria-label="Portfolio categories"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              className={
                index === 0
                  ? 'portfolio-filter active'
                  : 'portfolio-filter'
              }
              type="button"
            >
              {category}
            </button>
          ))}
        </nav>

        <div className="portfolio-grid">
          {portfolioItems.map((item, index) => (
            <article
              className={
                index === 0 || index === 5
                  ? 'portfolio-item portfolio-item-featured'
                  : 'portfolio-item'
              }
              key={item.title}
            >
              <div className="portfolio-image">
                <img
                  src={assets.hero}
                  alt={item.title}
                />

                <span className="portfolio-image-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="portfolio-item-content">
                <span>{item.category}</span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-fashion-cta">
        <div>
          <span className="portfolio-eyebrow">
            WANT SOMETHING UNIQUE?
          </span>

          <h2>
            Create your own
            <span>WildFloral look.</span>
          </h2>

          <p>
            From beauty styling to custom fashion,
            let's create something that feels personal
            to you.
          </p>
        </div>

        <div className="portfolio-actions">
          <Link
            to="/booking"
            className="portfolio-primary-button"
          >
            Book an Appointment
          </Link>

          <Link
            to="/fashion"
            className="portfolio-secondary-button"
          >
            Explore Fashion
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Portfolio