import { Link } from 'react-router-dom'

import './Home.css'

function Home() {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-content">

        <span className="coming-soon-eyebrow">
          WILDFLORAL
        </span>

        <h1>
          Coming
          <span>soon.</span>
        </h1>

        <p>
          We are preparing a beautiful new
          WildFloral experience for you.
          Our website will be ready soon.
        </p>

        <Link
          to="/services"
          className="coming-soon-button"
        >
          Explore Services
        </Link>

      </section>
    </main>
  )
}

export default Home