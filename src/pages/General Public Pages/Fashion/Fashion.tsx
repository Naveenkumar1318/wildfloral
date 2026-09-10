import { Link } from 'react-router-dom'

import './Fashion.css'

function Fashion() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-content">
        <span className="coming-soon-eyebrow">
          WILDFLORAL FASHION STUDIO
        </span>

        <h1>
          Coming
          <span>soon.</span>
        </h1>

        <p>
          Our fashion studio is being prepared.
          Custom designs, Aari work, blouse work,
          and embroidery will be available soon.
        </p>

        <Link
          to="/"
          className="coming-soon-button"
        >
          Back to Home
        </Link>
      </section>
    </main>
  )
}

export default Fashion