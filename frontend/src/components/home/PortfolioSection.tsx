import { Link } from 'react-router'
import './PortfolioSection.css'

const work = [
  {
    number: '01',
    title: 'Beauty',
    description: 'Makeup, hair, and occasion styling',
  },
  {
    number: '02',
    title: 'Bridal',
    description: 'Beauty looks for memorable moments',
  },
  {
    number: '03',
    title: 'Fashion',
    description: 'Custom dresses and Aari craftsmanship',
  },
]

function PortfolioSection() {
  return (
    <section className="portfolio-section">
      <div className="portfolio-header">
        <div>
          <span className="section-eyebrow">OUR WORK</span>

          <h2>
            A glimpse of
            <em>what we create.</em>
          </h2>
        </div>

        <Link to="/portfolio" className="text-link portfolio-link">
          View Full Portfolio
          <span>↗</span>
        </Link>
      </div>

      <div className="portfolio-grid">
        {work.map((item) => (
          <article className="portfolio-card" key={item.number}>
            <div className="portfolio-image">
              <span>{item.number}</span>
            </div>

            <div className="portfolio-card-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PortfolioSection