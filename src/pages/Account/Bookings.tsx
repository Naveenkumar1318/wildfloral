import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router'

import { supabase } from '../../lib/supabase'

type Booking = {
  id: string
  booking_date: string
  booking_time: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  notes: string | null
  price: number
  status: string
  service_id: string
}

type Service = {
  id: string
  name: string
  image_url: string | null
}

type BookingItem = Booking & {
  service?: Service
}

type Filter =
  | 'all'
  | 'upcoming'
  | 'completed'
  | 'cancelled'

function Bookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] =
    useState<BookingItem[]>([])

  const [filter, setFilter] =
    useState<Filter>('all')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
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
      data,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .select(
        `
          id,
          booking_date,
          booking_time,
          customer_name,
          customer_email,
          customer_phone,
          notes,
          price,
          status,
          service_id
        `,
      )
      .eq('customer_id', user.id)
      .order('booking_date', {
        ascending: false,
      })

    if (bookingError) {
      setError(bookingError.message)
      setLoading(false)
      return
    }

    const bookingRows =
      (data ?? []) as Booking[]

    const serviceIds = [
      ...new Set(
        bookingRows.map(
          (booking) => booking.service_id,
        ),
      ),
    ]

    let services: Service[] = []

    if (serviceIds.length > 0) {
      const {
        data: serviceData,
      } = await supabase
        .from('services')
        .select(
          'id, name, image_url',
        )
        .in('id', serviceIds)

      services =
        (serviceData ?? []) as Service[]
    }

    setBookings(
      bookingRows.map((booking) => ({
        ...booking,
        service: services.find(
          (service) =>
            service.id ===
            booking.service_id,
        ),
      })),
    )

    setLoading(false)
  }

  const filteredBookings =
    useMemo(() => {
      if (filter === 'all') {
        return bookings
      }

      if (filter === 'upcoming') {
        return bookings.filter(
          (booking) =>
            booking.status ===
              'pending' ||
            booking.status ===
              'confirmed',
        )
      }

      if (filter === 'completed') {
        return bookings.filter(
          (booking) =>
            booking.status ===
            'completed',
        )
      }

      return bookings.filter(
        (booking) =>
          booking.status === 'cancelled',
      )
    }, [bookings, filter])

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <div className="account-loading-spinner" />

          <span>
            LOADING APPOINTMENTS
          </span>
        </div>
      </main>
    )
  }

  return (
    <main className="account-page">
      <section className="account-header">
        <div>
          <span className="account-eyebrow">
            MY APPOINTMENTS
          </span>

          <h1>
            Your
            <span>bookings.</span>
          </h1>

          <p>
            View and manage your WildFloral
            appointments.
          </p>
        </div>

        <Link
          to="/booking"
          className="account-primary-button"
        >
          Book Appointment
        </Link>
      </section>

      <section className="account-content">
        <div className="account-panel">
          <div className="account-panel-heading">
            <div>
              <span className="account-eyebrow">
                APPOINTMENT HISTORY
              </span>

              <h2>
                Every
                <span>experience.</span>
              </h2>
            </div>
          </div>

          {error && (
            <div className="account-error">
              {error}
            </div>
          )}

          <div className="account-booking-filters">
            {(
              [
                ['all', 'All'],
                [
                  'upcoming',
                  'Upcoming',
                ],
                [
                  'completed',
                  'Completed',
                ],
                [
                  'cancelled',
                  'Cancelled',
                ],
              ] as [
                Filter,
                string,
              ][]
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          {filteredBookings.length ===
          0 ? (
            <div className="account-empty">
              <span className="account-empty-number">
                01
              </span>

              <h3>
                Nothing here yet.
              </h3>

              <p>
                Your appointments will
                appear here once you make
                a booking.
              </p>

              <Link
                to="/booking"
                className="account-secondary-button"
              >
                Book Your First Appointment
              </Link>
            </div>
          ) : (
            <div className="account-booking-list">
              {filteredBookings.map(
                (booking) => (
                  <Link
                    key={booking.id}
                    to={`/account/bookings/${booking.id}`}
                    className="account-booking"
                  >
                    <div className="account-booking-date">
                      <span>
                        {new Date(
                          booking.booking_date,
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            month: 'short',
                          },
                        )}
                      </span>

                      <strong>
                        {new Date(
                          booking.booking_date,
                        ).getDate()}
                      </strong>

                      <small>
                        {new Date(
                          booking.booking_date,
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            weekday: 'short',
                          },
                        )}
                      </small>
                    </div>

                    <div className="account-booking-info">
                      <span>
                        {booking.service
                          ?.name ||
                          'Beauty Service'}
                      </span>

                      <h3>
                        Appointment
                      </h3>

                      <p>
                        {booking.booking_time.slice(
                          0,
                          5,
                        )}
                      </p>
                    </div>

                    <div className="account-booking-right">
                      <span
                        className={`account-status ${booking.status}`}
                      >
                        {booking.status}
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
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default Bookings