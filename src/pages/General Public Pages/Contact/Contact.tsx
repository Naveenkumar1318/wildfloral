import { Link } from 'react-router'

import './Contact.css'

function Contact() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-content">
        <span className="coming-soon-eyebrow">
          CONTACT WILDFLORAL
        </span>

        <h1>
          Coming
          <span>soon.</span>
        </h1>

        <p>
          Our contact page is being prepared.
          We will be available soon to help you
          with your beauty and fashion needs.
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

export default Contact