import { Link } from 'react-router'
import './FashionSection.css'

function FashionSection() {
  return (
    <section className="fashion-section">
      <div className="fashion-visual">
        <div className="fashion-visual-placeholder">
          <span>F</span>
        </div>

        <div className="fashion-label">
          <span>WILDFLORAL</span>
          <span>FASHION STUDIO</span>
        </div>
      </div>

      <div className="fashion-content">
        <span className="section-eyebrow">CUSTOM FASHION</span>

        <h2>
          Made by hand,
          <em>made for you.</em>
        </h2>

        <p>
          Bring your ideas to life with custom dresses, detailed
          Aari work, embroidery, and personalized fashion created
          around your measurements and style.
        </p>

        <ul>
          <li>Custom dress design</li>
          <li>Aari work & embroidery</li>
          <li>Blouse customization</li>
          <li>Personalized fashion consultation</li>
        </ul>

        <Link to="/fashion" className="button button-primary">
          Discover Fashion
        </Link>
      </div>
    </section>
  )
}

export default FashionSection