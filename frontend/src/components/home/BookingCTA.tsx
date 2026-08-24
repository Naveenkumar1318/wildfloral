import { Link } from 'react-router'
import './BookingCTA.css'

function BookingCTA() {
  return (
    <section className="booking-cta">
      <div className="booking-cta-inner">
        <span className="section-eyebrow">
          YOUR NEXT BEAUTIFUL MOMENT
        </span>

        <h2>
          Ready to make it
          <em>your own?</em>
        </h2>

        <p>
          Choose your service and request your appointment with
          WildFloral.
        </p>

        <Link to="/booking" className="button booking-cta-button">
          Book an Appointment
        </Link>
      </div>
    </section>
  )
}

export default BookingCTA