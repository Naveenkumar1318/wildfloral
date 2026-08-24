import { useState } from 'react'
import './Booking.css'

const services = [
  'Hair Styling',
  'Haircut',
  'Hair Treatment',
  'Party Makeup',
  'Bridal Makeup',
  'Engagement Makeup',
  'Facial',
  'Cleanup',
  'Threading',
  'Waxing',
  'Manicure',
  'Pedicure',
  'Mehendi',
  'Saree Draping',
  'Custom Dresses',
  'Aari Work',
  'Blouse Work',
  'Embroidery',
]

const timeSlots = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
]

function Booking() {
  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('studio')
  const [step, setStep] = useState(1)

  const canContinue =
    service &&
    date &&
    time

  const handleContinue = () => {
    if (!canContinue) return

    setStep(2)
  }

  return (
    <main className="booking-page">
      <section className="booking-header">
        <span className="booking-eyebrow">
          WILDFLORAL APPOINTMENTS
        </span>

        <h1>
          Book your
          <span>WildFloral experience.</span>
        </h1>

        <p>
          Choose your service, preferred date and time.
          We'll confirm your appointment with you.
        </p>
      </section>

      <section className="booking-container">
        <div className="booking-progress">
          <div className={step >= 1 ? 'active' : ''}>
            <span>01</span>
            <strong>Appointment</strong>
          </div>

          <div className={step >= 2 ? 'active' : ''}>
            <span>02</span>
            <strong>Your Details</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Confirmation</strong>
          </div>
        </div>

        {step === 1 && (
          <div className="booking-card">
            <div className="booking-section">
              <span className="booking-section-number">
                01
              </span>

              <div className="booking-section-content">
                <h2>Select a service</h2>

                <p>
                  What would you like to book?
                </p>

                <div className="booking-service-grid">
                  {services.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        service === item
                          ? 'booking-service active'
                          : 'booking-service'
                      }
                      onClick={() => setService(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="booking-section">
              <span className="booking-section-number">
                02
              </span>

              <div className="booking-section-content">
                <h2>Choose your date</h2>

                <p>
                  Select your preferred appointment date.
                </p>

                <input
                  className="booking-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="booking-section">
              <span className="booking-section-number">
                03
              </span>

              <div className="booking-section-content">
                <h2>Choose your time</h2>

                <p>
                  WildFloral is currently open from
                  8:00 AM to 8:00 PM.
                </p>

                <div className="booking-time-grid">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={
                        time === slot
                          ? 'booking-time active'
                          : 'booking-time'
                      }
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="booking-section">
              <span className="booking-section-number">
                04
              </span>

              <div className="booking-section-content">
                <h2>Where would you like the service?</h2>

                <p>
                  Select studio or home service.
                </p>

                <div className="booking-location-grid">
                  <button
                    type="button"
                    className={
                      location === 'studio'
                        ? 'booking-location active'
                        : 'booking-location'
                    }
                    onClick={() =>
                      setLocation('studio')
                    }
                  >
                    <strong>Studio</strong>
                    <span>
                      Visit the WildFloral studio
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      location === 'home'
                        ? 'booking-location active'
                        : 'booking-location'
                    }
                    onClick={() =>
                      setLocation('home')
                    }
                  >
                    <strong>Home Service</strong>
                    <span>
                      Selected services available at home
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="booking-footer">
              <div>
                {service && (
                  <span>
                    {service}
                  </span>
                )}

                {date && (
                  <span>
                    {date}
                  </span>
                )}

                {time && (
                  <span>
                    {time}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="booking-primary-button"
                disabled={!canContinue}
                onClick={handleContinue}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-card booking-details-card">
            <button
              type="button"
              className="booking-back-button"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>

            <div className="booking-details-header">
              <span className="booking-eyebrow">
                YOUR DETAILS
              </span>

              <h2>
                Almost there.
                <span>Tell us about you.</span>
              </h2>

              <p>
                We'll use these details to contact you
                about your appointment.
              </p>
            </div>

            <form className="booking-form">
              <div className="booking-form-field">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                />
              </div>

              <div className="booking-form-field">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  placeholder="+91"
                />
              </div>

              <div className="booking-form-field full">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                />
              </div>

              {location === 'home' && (
                <div className="booking-form-field full">
                  <label htmlFor="address">
                    Home Service Address
                  </label>

                  <textarea
                    id="address"
                    rows={4}
                    placeholder="Enter your complete address"
                  />
                </div>
              )}

              <div className="booking-form-field full">
                <label htmlFor="notes">
                  Additional Notes
                </label>

                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Anything you'd like us to know?"
                />
              </div>

              <div className="booking-summary">
                <span>APPOINTMENT SUMMARY</span>

                <strong>{service}</strong>

                <p>
                  {date} · {time}
                </p>

                <p>
                  {location === 'studio'
                    ? 'WildFloral Studio'
                    : 'Home Service'}
                </p>
              </div>

              <button
                type="button"
                className="booking-primary-button booking-confirm-button"
                onClick={() => setStep(3)}
              >
                Review Appointment →
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="booking-card booking-confirmation">
            <span className="booking-confirmation-icon">
              ✓
            </span>

            <span className="booking-eyebrow">
              REVIEW YOUR APPOINTMENT
            </span>

            <h2>
              Ready to
              <span>confirm?</span>
            </h2>

            <div className="booking-review">
              <div>
                <span>Service</span>
                <strong>{service}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>{date}</strong>
              </div>

              <div>
                <span>Time</span>
                <strong>{time}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {location === 'studio'
                    ? 'WildFloral Studio'
                    : 'Home Service'}
                </strong>
              </div>
            </div>

            <p>
              Your appointment will be submitted for
              confirmation. WildFloral will contact you
              with the final booking confirmation.
            </p>

            <button
              type="button"
              className="booking-primary-button"
            >
              Confirm Appointment
            </button>

            <button
              type="button"
              className="booking-back-button"
              onClick={() => setStep(2)}
            >
              ← Edit Details
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default Booking