import { Link } from 'react-router'

import './About.css'

function About() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-content">
        <span className="coming-soon-eyebrow">
          ABOUT WILDFLORAL
        </span>

        <h1>
          Coming
          <span>soon.</span>
        </h1>

        <p>
          Our story and journey are being prepared.
          We are creating something beautiful for you.
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

export default About