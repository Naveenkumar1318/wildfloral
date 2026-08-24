import { Link } from 'react-router'
import heroImage from '../../assets/hero.png'

import './About.css'

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">
            ABOUT WILDFLORAL
          </span>

          <h1>
            Beauty,
            <span>fashion,</span>
            and you.
          </h1>

          <p>
            WildFloral is a one-stop beauty and fashion
            destination where professional beauty care and
            personalized fashion come together.
          </p>
        </div>

        <div className="about-hero-image">
          <img
            src={heroImage}
            alt="WildFloral beauty and fashion studio"
          />
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-heading">
          <span className="about-eyebrow">
            OUR STORY
          </span>

          <h2>
            A place created
            <span>around you.</span>
          </h2>
        </div>

        <div className="about-story-content">
          <p>
            At WildFloral, beauty is personal. We believe
            every client has their own style, personality,
            and special moments worth celebrating.
          </p>

          <p>
            From professional beauty services to custom
            fashion, our work is focused on understanding
            what you want and creating an experience that
            feels comfortable, thoughtful, and personal.
          </p>

          <p>
            Whether you are preparing for a wedding,
            celebration, special occasion, or simply taking
            time for yourself, WildFloral is here to help
            you feel confident in your own style.
          </p>
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-heading">
          <span className="about-eyebrow">
            WHAT WE BELIEVE
          </span>

          <h2>
            Thoughtful service.
            <span>Beautiful results.</span>
          </h2>
        </div>

        <div className="about-values-grid">
          <article className="about-value">
            <span>01</span>

            <h3>Personal Attention</h3>

            <p>
              Every service begins with understanding your
              preferences, occasion, and individual style.
            </p>
          </article>

          <article className="about-value">
            <span>02</span>

            <h3>Quality Work</h3>

            <p>
              We focus on careful work, quality products,
              thoughtful design, and beautiful finishing.
            </p>
          </article>

          <article className="about-value">
            <span>03</span>

            <h3>Craftsmanship</h3>

            <p>
              Our fashion services bring detailed
              handcrafted work and personalized design
              together.
            </p>
          </article>

          <article className="about-value">
            <span>04</span>

            <h3>Comfort & Trust</h3>

            <p>
              We want every client to feel comfortable,
              heard, and confident throughout their
              WildFloral experience.
            </p>
          </article>
        </div>
      </section>

      <section className="about-services">
        <div className="about-services-image">
          <img
            src={heroImage}
            alt="WildFloral services"
          />
        </div>

        <div className="about-services-content">
          <span className="about-eyebrow">
            ONE DESTINATION
          </span>

          <h2>
            From beauty
            <span>to fashion.</span>
          </h2>

          <p>
            Explore beauty services including hair,
            makeup, bridal styling, skin care, nails,
            mehendi, and more.
          </p>

          <p>
            Our fashion studio also offers custom dresses,
            Aari work, blouse work, and embroidery.
          </p>

          <div className="about-actions">
            <Link
              to="/services"
              className="about-primary-button"
            >
              Explore Services
            </Link>

            <Link
              to="/fashion"
              className="about-secondary-button"
            >
              Explore Fashion
            </Link>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <span className="about-eyebrow">
          YOUR WILDFLORAL EXPERIENCE
        </span>

        <h2>
          Let's create
          <span>something beautiful.</span>
        </h2>

        <p>
          Choose your service and find a time that works
          for you.
        </p>

        <Link
          to="/booking"
          className="about-cta-button"
        >
          Book an Appointment
        </Link>
      </section>
    </main>
  )
}

export default About