import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Account.css'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: string
}

type Booking = {
  id: string
  booking_date: string
  booking_time: string
  customer_name: string
  price: number
  status: string
  service_id: string
}

type Service = {
  id: string
  name: string
  image_url: string | null
}

type BookingWithService =
  Booking & {
    service?: Service
  }

function formatDate(
  date: string,
) {
  return new Date(
    `${date}T00:00:00`,
  ).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function formatShortDate(
  date: string,
) {
  return new Date(
    `${date}T00:00:00`,
  ).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
    },
  )
}

function formatTime(
  time: string,
) {
  const [hours, minutes] =
    time
      .slice(0, 5)
      .split(':')

  const date = new Date()

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0,
  )

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  )
}

function formatPrice(
  price: number,
) {
  return `₹${Number(
    price,
  ).toLocaleString('en-IN')}`
}

function getStatusLabel(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case 'pending':
      return 'Pending'

    case 'confirmed':
      return 'Confirmed'

    case 'completed':
      return 'Completed'

    case 'cancelled':
      return 'Cancelled'

    default:
      return status
  }
}

function getInitial(
  profile: Profile,
) {
  return (
    profile.full_name ||
    profile.email ||
    'W'
  )
    .charAt(0)
    .toUpperCase()
}

function Account() {
  const navigate = useNavigate()

  const [profile, setProfile] =
    useState<Profile | null>(
      null,
    )

  const [bookings, setBookings] =
    useState<
      BookingWithService[]
    >([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [name, setName] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [mobileMenu, setMobileMenu] =
    useState(false)

  useEffect(() => {
    void loadAccount()
  }, [])

  async function loadAccount() {
    setLoading(true)
    setError('')

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabase.auth.getUser()

    if (
      userError ||
      !user
    ) {
      navigate('/login', {
        replace: true,
      })

      return
    }

    /*
     * IMPORTANT:
     * profiles table contains:
     *
     * id
     * email
     * full_name
     * role
     *
     * It does NOT contain phone.
     */
    const {
      data: profileData,
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .select(
          'id, email, full_name, role',
        )
        .eq(
          'id',
          user.id,
        )
        .maybeSingle()

    if (profileError) {
      console.error(
        'Profile error:',
        profileError,
      )

      setError(
        'Unable to load your profile.',
      )

      setLoading(false)

      return
    }

    /*
     * If Auth user exists but
     * profile row does not exist,
     * create the profile.
     */
    if (!profileData) {
      const newProfile = {
        id: user.id,
        email:
          user.email || null,
        full_name:
          typeof user.user_metadata
            ?.full_name === 'string'
            ? user.user_metadata
                .full_name
            : null,
        role: 'customer',
      }

      const {
        data: createdProfile,
        error:
          createProfileError,
      } =
        await supabase
          .from('profiles')
          .insert(
            newProfile,
          )
          .select(
            'id, email, full_name, role',
          )
          .single()

      if (
        createProfileError ||
        !createdProfile
      ) {
        console.error(
          'Create profile error:',
          createProfileError,
        )

        setError(
          'Your account profile could not be created.',
        )

        setLoading(false)

        return
      }

      setProfile(
        createdProfile as Profile,
      )

      setName(
        createdProfile.full_name ||
          '',
      )
    } else {
      setProfile(
        profileData as Profile,
      )

      setName(
        profileData.full_name ||
          '',
      )
    }

    /*
     * Load customer's bookings.
     */
    const {
      data: bookingData,
      error: bookingError,
    } =
      await supabase
        .from('bookings')
        .select(
          `
            id,
            booking_date,
            booking_time,
            customer_name,
            price,
            status,
            service_id
          `,
        )
        .eq(
          'customer_id',
          user.id,
        )
        .order(
          'booking_date',
          {
            ascending: false,
          },
        )
        .order(
          'booking_time',
          {
            ascending: false,
          },
        )

    if (bookingError) {
      console.error(
        'Bookings error:',
        bookingError,
      )

      setError(
        'Unable to load your bookings.',
      )

      setLoading(false)

      return
    }

    const bookingRows =
      (bookingData ||
        []) as Booking[]

    /*
     * Load related services.
     */
    const serviceIds =
      Array.from(
        new Set(
          bookingRows.map(
            (booking) =>
              booking.service_id,
          ),
        ),
      )

    let services: Service[] =
      []

    if (
      serviceIds.length >
      0
    ) {
      const {
        data: serviceData,
        error:
          serviceError,
      } =
        await supabase
          .from('services')
          .select(
            'id, name, image_url',
          )
          .in(
            'id',
            serviceIds,
          )

      if (serviceError) {
        console.error(
          'Services error:',
          serviceError,
        )
      }

      services =
        (serviceData ||
          []) as Service[]
    }

    const combined =
      bookingRows.map(
        (booking) => ({
          ...booking,
          service:
            services.find(
              (service) =>
                service.id ===
                booking.service_id,
            ),
        }),
      )

    setBookings(
      combined,
    )

    setLoading(false)
  }

  async function updateProfile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!profile) {
      return
    }

    const cleanName =
      name.trim()

    if (!cleanName) {
      setError(
        'Please enter your name.',
      )

      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const {
      error: updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          full_name:
            cleanName,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          profile.id,
        )

    if (updateError) {
      console.error(
        'Profile update error:',
        updateError,
      )

      setError(
        updateError.message,
      )

      setSaving(false)

      return
    }

    setProfile({
      ...profile,
      full_name:
        cleanName,
    })

    setMessage(
      'Profile updated successfully.',
    )

    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    navigate('/login', {
      replace: true,
    })
  }

  const upcomingBookings =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.status ===
              'pending' ||
            booking.status ===
              'confirmed',
        ),
      [bookings],
    )

  const completedBookings =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.status ===
            'completed',
        ),
      [bookings],
    )

  const pendingBookings =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.status ===
            'pending',
        ),
      [bookings],
    )

  const nextBooking =
    useMemo(() => {
      const upcoming =
        [...upcomingBookings]

      upcoming.sort(
        (a, b) => {
          const first =
            new Date(
              `${a.booking_date}T${a.booking_time}`,
            ).getTime()

          const second =
            new Date(
              `${b.booking_date}T${b.booking_time}`,
            ).getTime()

          return first - second
        },
      )

      return upcoming[0]
    }, [upcomingBookings])

  const recentBookings =
    bookings.slice(0, 4)

  if (loading) {
    return (
      <main className="customer-dashboard">
        <div className="customer-dashboard-loading">
          <div className="customer-spinner" />

          <span>
            PREPARING YOUR ACCOUNT
          </span>

          <p>
            Your WildFloral experience
            is loading...
          </p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <main className="customer-dashboard">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="customer-mobile-header">
        <Link
          to="/"
          className="customer-brand"
        >
          WildFloral
        </Link>

        <button
          type="button"
          className="customer-menu-button"
          onClick={() =>
            setMobileMenu(
              (current) =>
                !current,
            )
          }
          aria-label="Open menu"
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenu && (
        <div className="customer-mobile-menu">
          <Link
            to="/account"
            onClick={() =>
              setMobileMenu(
                false,
              )
            }
          >
            Overview
          </Link>

          <Link
            to="/account/bookings"
            onClick={() =>
              setMobileMenu(
                false,
              )
            }
          >
            My Bookings
          </Link>

          <Link
            to="/booking"
            onClick={() =>
              setMobileMenu(
                false,
              )
            }
          >
            Book Appointment
          </Link>

          <button
            type="button"
            onClick={
              handleLogout
            }
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="customer-dashboard-shell">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="customer-sidebar">

          <div className="customer-sidebar-top">

            <Link
              to="/"
              className="customer-sidebar-brand"
            >
              <strong>
                WildFloral
              </strong>

              <span>
                BEAUTY · FASHION · YOU
              </span>
            </Link>

            <div className="customer-profile-mini">
              <div className="customer-avatar">
                {getInitial(
                  profile,
                )}
              </div>

              <div>
                <strong>
                  {profile.full_name ||
                    'Welcome'}
                </strong>

                <span>
                  Customer
                </span>
              </div>
            </div>

            <nav className="customer-nav">

              <Link
                to="/account"
                className="active"
              >
                <UserRound
                  size={17}
                  strokeWidth={1.5}
                />

                <span>
                  Overview
                </span>
              </Link>

              <Link
                to="/account/bookings"
              >
                <CalendarDays
                  size={17}
                  strokeWidth={1.5}
                />

                <span>
                  My Bookings
                </span>

                {upcomingBookings.length >
                  0 && (
                  <small>
                    {
                      upcomingBookings.length
                    }
                  </small>
                )}
              </Link>

              <Link
                to="/booking"
              >
                <Clock3
                  size={17}
                  strokeWidth={1.5}
                />

                <span>
                  Book Appointment
                </span>
              </Link>

            </nav>
          </div>

          <div className="customer-sidebar-bottom">

            <Link
              to="/"
            >
              View Website
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
            >
              <LogOut
                size={16}
                strokeWidth={1.5}
              />

              Sign Out
            </button>

          </div>
        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <section className="customer-dashboard-main">

          {/* TOP BAR */}

          <header className="customer-topbar">

            <div>
              <span>
                MY WILDFLORAL
              </span>

              <p>
                Customer account
              </p>
            </div>

            <Link
              to="/booking"
              className="customer-topbar-button"
            >
              Book Appointment

              <ChevronRight
                size={16}
              />
            </Link>

          </header>

          {/* CONTENT */}

          <div className="customer-dashboard-content">

            {error && (
              <div
                className="customer-alert customer-alert-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =================================================
                WELCOME
            ================================================= */}

            <section className="customer-welcome">

              <div>
                <span className="customer-eyebrow">
                  YOUR PERSONAL SPACE
                </span>

                <h1>
                  Welcome back,
                  <em>
                    {profile.full_name ||
                      'Beautiful'}
                  </em>
                </h1>

                <p>
                  Everything you need for
                  your WildFloral experiences,
                  all in one place.
                </p>
              </div>

              <div className="customer-welcome-mark">
                WF
              </div>

            </section>

            {/* =================================================
                STATS
            ================================================= */}

            <section className="customer-stats">

              <div className="customer-stat-card">

                <span>
                  UPCOMING
                </span>

                <strong>
                  {
                    upcomingBookings.length
                  }
                </strong>

                <p>
                  Active appointments
                </p>

              </div>

              <div className="customer-stat-card">

                <span>
                  TOTAL BOOKINGS
                </span>

                <strong>
                  {bookings.length}
                </strong>

                <p>
                  All appointments
                </p>

              </div>

              <div className="customer-stat-card">

                <span>
                  PENDING
                </span>

                <strong>
                  {
                    pendingBookings.length
                  }
                </strong>

                <p>
                  Awaiting confirmation
                </p>

              </div>

              <div className="customer-stat-card">

                <span>
                  COMPLETED
                </span>

                <strong>
                  {
                    completedBookings.length
                  }
                </strong>

                <p>
                  Experiences completed
                </p>

              </div>

            </section>

            {/* =================================================
                NEXT APPOINTMENT
            ================================================= */}

            <section className="customer-next-section">

              <div className="customer-section-heading">

                <div>
                  <span className="customer-eyebrow">
                    NEXT EXPERIENCE
                  </span>

                  <h2>
                    Your upcoming
                    <em>
                      appointment.
                    </em>
                  </h2>
                </div>

                <Link
                  to="/account/bookings"
                >
                  View all bookings

                  <ChevronRight
                    size={15}
                  />
                </Link>

              </div>

              {nextBooking ? (
                <Link
                  to={`/account/bookings/${nextBooking.id}`}
                  className="customer-next-card"
                >

                  <div className="customer-next-image">

                    {nextBooking.service
                      ?.image_url ? (
                      <img
                        src={
                          nextBooking
                            .service
                            .image_url
                        }
                        alt={
                          nextBooking
                            .service
                            .name ||
                          'Service'
                        }
                      />
                    ) : (
                      <span>
                        WILDFLORAL
                      </span>
                    )}

                  </div>

                  <div className="customer-next-details">

                    <span className="customer-service-category">
                      BEAUTY EXPERIENCE
                    </span>

                    <h3>
                      {nextBooking.service
                        ?.name ||
                        'Beauty Service'}
                    </h3>

                    <div className="customer-next-meta">

                      <span>
                        <CalendarDays
                          size={15}
                        />

                        {formatDate(
                          nextBooking.booking_date,
                        )}
                      </span>

                      <span>
                        <Clock3
                          size={15}
                        />

                        {formatTime(
                          nextBooking.booking_time,
                        )}
                      </span>

                    </div>

                    <div className="customer-next-footer">

                      <span
                        className={`customer-status ${nextBooking.status}`}
                      >
                        <i />

                        {
                          getStatusLabel(
                            nextBooking.status,
                          )
                        }
                      </span>

                      <strong>
                        {formatPrice(
                          nextBooking.price,
                        )}
                      </strong>

                    </div>

                  </div>

                  <ChevronRight
                    className="customer-next-arrow"
                    size={21}
                    strokeWidth={1.3}
                  />

                </Link>
              ) : (
                <div className="customer-no-booking">

                  <div>
                    <span>
                      NO UPCOMING APPOINTMENT
                    </span>

                    <h3>
                      Your next experience
                      starts here.
                    </h3>

                    <p>
                      Explore our beauty and
                      fashion services and
                      create your next
                      appointment.
                    </p>
                  </div>

                  <Link
                    to="/services"
                    className="customer-primary-button"
                  >
                    Explore Services

                    <ChevronRight
                      size={16}
                    />
                  </Link>

                </div>
              )}

            </section>

            {/* =================================================
                RECENT BOOKINGS + PROFILE
            ================================================= */}

            <section className="customer-lower-grid">

              {/* RECENT BOOKINGS */}

              <div className="customer-card">

                <div className="customer-card-heading">

                  <div>
                    <span className="customer-eyebrow">
                      RECENT ACTIVITY
                    </span>

                    <h2>
                      Your
                      <em>
                        bookings.
                      </em>
                    </h2>
                  </div>

                  <Link
                    to="/account/bookings"
                  >
                    View all
                  </Link>

                </div>

                {recentBookings.length >
                0 ? (
                  <div className="customer-recent-list">

                    {recentBookings.map(
                      (
                        booking,
                      ) => (
                        <Link
                          key={
                            booking.id
                          }
                          to={`/account/bookings/${booking.id}`}
                          className="customer-recent-item"
                        >

                          <div className="customer-recent-date">

                            <span>
                              {formatShortDate(
                                booking.booking_date,
                              )}
                            </span>

                            <small>
                              {formatTime(
                                booking.booking_time,
                              )}
                            </small>

                          </div>

                          <div className="customer-recent-info">

                            <strong>
                              {booking.service
                                ?.name ||
                                'Beauty Service'}
                            </strong>

                            <span>
                              {
                                getStatusLabel(
                                  booking.status,
                                )
                              }
                            </span>

                          </div>

                          <strong className="customer-recent-price">
                            {formatPrice(
                              booking.price,
                            )}
                          </strong>

                          <ChevronRight
                            size={16}
                            className="customer-recent-arrow"
                          />

                        </Link>
                      ),
                    )}

                  </div>
                ) : (
                  <div className="customer-small-empty">
                    <p>
                      No bookings yet.
                    </p>

                    <Link
                      to="/services"
                    >
                      Explore Services
                    </Link>
                  </div>
                )}

              </div>

              {/* PROFILE */}

              <div className="customer-card">

                <div className="customer-card-heading">

                  <div>
                    <span className="customer-eyebrow">
                      PERSONAL DETAILS
                    </span>

                    <h2>
                      Your
                      <em>
                        profile.
                      </em>
                    </h2>
                  </div>

                </div>

                <form
                  className="customer-profile-form"
                  onSubmit={
                    updateProfile
                  }
                >

                  <div className="customer-large-avatar">
                    {getInitial(
                      profile,
                    )}
                  </div>

                  <div className="customer-field">

                    <label htmlFor="customer-name">
                      Full name
                    </label>

                    <input
                      id="customer-name"
                      type="text"
                      value={name}
                      onChange={(
                        event,
                      ) =>
                        setName(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Your full name"
                    />

                  </div>

                  <div className="customer-field">

                    <label htmlFor="customer-email">
                      Email
                    </label>

                    <input
                      id="customer-email"
                      type="email"
                      value={
                        profile.email ||
                        ''
                      }
                      disabled
                    />

                  </div>

                  {message && (
                    <div className="customer-alert customer-alert-success">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="customer-primary-button"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                </form>

              </div>

            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="customer-quick-section">

              <span className="customer-eyebrow">
                QUICK ACCESS
              </span>

              <div className="customer-quick-grid">

                <Link
                  to="/services"
                  className="customer-quick-card"
                >
                  <span>
                    01
                  </span>

                  <strong>
                    Explore Services
                  </strong>

                  <p>
                    Discover your next
                    beauty experience.
                  </p>

                  <ChevronRight
                    size={17}
                  />
                </Link>

                <Link
                  to="/account/bookings"
                  className="customer-quick-card"
                >
                  <span>
                    02
                  </span>

                  <strong>
                    Manage Bookings
                  </strong>

                  <p>
                    View and manage your
                    appointments.
                  </p>

                  <ChevronRight
                    size={17}
                  />
                </Link>

                <Link
                  to="/contact"
                  className="customer-quick-card"
                >
                  <span>
                    03
                  </span>

                  <strong>
                    Need Assistance?
                  </strong>

                  <p>
                    We're here whenever you
                    need us.
                  </p>

                  <ChevronRight
                    size={17}
                  />
                </Link>

              </div>

            </section>

          </div>
        </section>
      </div>
    </main>
  )
}

export default Account