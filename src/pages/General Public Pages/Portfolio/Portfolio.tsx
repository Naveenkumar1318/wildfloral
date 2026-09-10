import { Link } from 'react-router-dom'

import './Portfolio.css'

function Portfolio() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-content">
        <span className="coming-soon-eyebrow">
          WILDFLORAL PORTFOLIO
        </span>

        <h1>
          Coming
          <span>soon.</span>
        </h1>

        <p>
          We are preparing our portfolio to showcase
          beautiful beauty styling, fashion, and
          handcrafted work from WildFloral.
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

export default Portfolio