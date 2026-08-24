import { Link } from 'react-router'
import './ServicesSection.css'

const services = [
  {
    number: '01',
    title: 'Hair Styling',
    description:
      'Thoughtfully styled looks for everyday confidence and special occasions.',
  },
  {
    number: '02',
    title: 'Bridal & Party Makeup',
    description:
      'Personalized makeup designed to complement your features, outfit, and occasion.',
  },
  {
    number: '03',
    title: 'Skin & Beauty Care',
    description:
      'Professional beauty treatments focused on care, comfort, and healthy-looking skin.',
  },
  {
    number: '04',
    title: 'Custom Fashion',
    description:
      'Custom dresses, Aari work, embroidery, and personalized fashion crafted around you.',
  },
]

function ServicesSection() {
  return (
    <section className="services-section">
      <div className="services-header">
        <div>
          <span className="section-eyebrow">WHAT WE OFFER</span>

          <h2>
            Beauty services,
            <em>made personal.</em>
          </h2>
        </div>

        <Link to="/services" className="text-link">
          View All Services
          <span>↗</span>
        </Link>
      </div>

      <div className="services-list">
        {services.map((service) => (
          <article className="service-item" key={service.number}>
            <span className="service-number">{service.number}</span>

            <div className="service-main">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>

            <span className="service-arrow">↗</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesSection