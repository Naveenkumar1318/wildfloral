import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router'

import { supabase } from '../../lib/supabase'

type Booking = {
  id: string
  customer_id: string
  service_id: string
  booking_date: string
  booking_time: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  notes: string | null
  price: number
  status: string
  created_at: string
}

type Service = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  image_url: string | null
}

function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] =
    useState<Booking | null>(null)

  const [service, setService] =
    useState<Service | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [cancelling, setCancelling] =
    useState(false)

  useEffect(() => {
    if (id) {
      loadBooking(id)
    }
  }, [id])

  async function loadBooking(
    bookingId: string,
  ) {
    setLoading(true)
    setError('')

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    const {
      data: bookingData,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .select(
        `
          id,
          customer_id,
          service_id,
          booking_date,
          booking_time,
          customer_name,
          customer_email,
          customer_phone,
          notes,
          price,
          status,
          created_at
        `,
      )
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (bookingError) {
      setError(
        'We could not find this appointment.',
      )
      setLoading(false)
      return
    }

    setBooking(
      bookingData as Booking,
    )

    const {
      data: serviceData,
      error: serviceError,
    } = await supabase
      .from('services')
      .select(
        `
          id,
          name,
          description,
          duration_minutes,
          price,
          image_url
        `,
      )
      .eq(
        'id',
        bookingData.service_id,
      )
      .single()

    if (!serviceError) {
      setService(
        serviceData as Service,
      )
    }

    setLoading(false)
  }

  async function cancelBooking() {
    if (!booking) return

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this appointment?',
      )

    if (!confirmed) return

    setCancelling(true)
    setError('')

    const {
      error: cancelError,
    } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', booking.id)
      .eq(
        'customer_id',
        booking.customer_id,
      )
      .eq('status', 'pending')

    if (cancelError) {
      setError(
        cancelError.message,
      )
      setCancelling(false)
      return
    }

    setBooking({
      ...booking,
      status: 'cancelled',
    })

    setCancelling(false)
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <div className="account-loading-spinner" />

          <span>
            LOADING APPOINTMENT
          </span>
        </div>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="account-page">
        <section className="account-content">
          <div className="account-panel account-empty">
            <span className="account-empty-number">
              404
            </span>

            <h3>
              Appointment not found.
            </h3>

            <p>
              This appointment may no longer
              be available.
            </p>

            <Link
              to="/account/bookings"
              className="account-secondary-button"
            >
              Back to Bookings
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="account-page">
      <section className="account-header">
        <div>
          <span className="account-eyebrow">
            APPOINTMENT DETAILS
          </span>

          <h1>
            Your
            <span>experience.</span>
          </h1>

          <p>
            Everything you need for your
            WildFloral appointment.
          </p>
        </div>

        <Link
          to="/account/bookings"
          className="account-secondary-button"
        >
          ← All Bookings
        </Link>
      </section>

      <section className="account-content">
        <div className="account-panel">
          {error && (
            <div className="account-error">
              {error}
            </div>
          )}

          <div className="booking-detail-hero">
            <div className="booking-detail-image">
              {service?.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                />
              ) : (
                <div>
                  WILDFLORAL
                </div>
              )}
            </div>

            <div className="booking-detail-main">
              <span className="account-eyebrow">
                {booking.status}
              </span>

              <h2>
                {service?.name ||
                  'Beauty Service'}
              </h2>

              <p>
                {service?.description ||
                  'Your selected WildFloral service.'}
              </p>

              <span
                className={`account-status ${booking.status}`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="booking-detail-grid">
            <div>
              <span>
                DATE
              </span>

              <strong>
                {new Date(
                  booking.booking_date,
                ).toLocaleDateString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  },
                )}
              </strong>
            </div>

            <div>
              <span>
                TIME
              </span>

              <strong>
                {booking.booking_time.slice(
                  0,
                  5,
                )}
              </strong>
            </div>

            <div>
              <span>
                DURATION
              </span>

              <strong>
                {service
                  ? `${service.duration_minutes} min`
                  : '—'}
              </strong>
            </div>

            <div>
              <span>
                TOTAL
              </span>

              <strong>
                ₹
                {Number(
                  booking.price,
                ).toLocaleString(
                  'en-IN',
                )}
              </strong>
            </div>
          </div>

          <div className="booking-detail-customer">
            <span className="account-eyebrow">
              CUSTOMER DETAILS
            </span>

            <div>
              <strong>
                {booking.customer_name}
              </strong>

              <p>
                {booking.customer_email}
              </p>

              {booking.customer_phone && (
                <p>
                  {booking.customer_phone}
                </p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="booking-detail-notes">
              <span className="account-eyebrow">
                NOTES
              </span>

              <p>
                {booking.notes}
              </p>
            </div>
          )}

          {booking.status ===
            'pending' && (
            <div className="booking-detail-actions">
              <button
                type="button"
                className="booking-cancel-button"
                disabled={cancelling}
                onClick={
                  cancelBooking
                }
              >
                {cancelling
                  ? 'Cancelling...'
                  : 'Cancel Appointment'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default BookingDetails