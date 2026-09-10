import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Home,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import {
  supabase,
} from '../../../lib/supabase'

import {
  getServices,
  type Service,
} from '../../../lib/services'

import './BeautyBookings.css'

/* =========================================================
   TYPES
========================================================= */

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'

type BookingItem = {
  id: string
  service_id: string
  service_name: string
  price: number | string
  duration_minutes: number | string
  person_id: string | null
}

type BookingPerson = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

type BeautyBooking = {
  id: string
  customer_id: string
  service_id: string
  booking_date: string
  booking_time: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  notes: string | null
  price: number | string
  status: BookingStatus
  created_at: string
  location_type: string
  address: string | null
  city: string | null
  pincode: string | null
  booking_items: BookingItem[]
  booking_people: BookingPerson[]
}

type FilterType =
  | 'all'
  | 'upcoming'
  | 'completed'
  | 'cancelled'

type SortType =
  | 'latest'
  | 'oldest'
  | 'appointment'
  | 'amount-high'
  | 'amount-low'

const BOOKINGS_PER_PAGE = 3

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateObject(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function formatDay(date: string): string {
  if (!date) {
    return '—'
  }

  const value = getDateObject(date)

  if (Number.isNaN(value.getTime())) {
    return '—'
  }

  return value.toLocaleDateString('en-IN', {
    day: '2-digit',
  })
}

function formatMonth(date: string): string {
  if (!date) {
    return '—'
  }

  const value = getDateObject(date)

  if (Number.isNaN(value.getTime())) {
    return '—'
  }

  return value.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

function formatWeekday(date: string): string {
  if (!date) {
    return '—'
  }

  const value = getDateObject(date)

  if (Number.isNaN(value.getTime())) {
    return '—'
  }

  return value.toLocaleDateString('en-IN', {
    weekday: 'long',
  })
}

function formatLongDate(date: string): string {
  if (!date) {
    return '—'
  }

  const value = getDateObject(date)

  if (Number.isNaN(value.getTime())) {
    return '—'
  }

  return value.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(time: string): string {
  if (!time) {
    return '—'
  }

  const [hours, minutes] = time.split(':')

  const hour = Number(hours)
  const minute = Number(minutes)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return '—'
  }

  const value = new Date()

  value.setHours(
    hour,
    minute,
    0,
    0,
  )

  return value.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )
}

function formatBookedDate(value: string): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

/* =========================================================
   NUMBER FORMATTERS
========================================================= */

function formatPrice(
  value: number | string,
): string {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value) || 0,
  )
}

function formatDuration(
  minutes: number | string,
): string {
  const value =
    Number(minutes) || 0

  if (value <= 0) {
    return '0 min'
  }

  const hours =
    Math.floor(value / 60)

  const remaining =
    value % 60

  if (!hours) {
    return `${remaining} min`
  }

  if (!remaining) {
    return `${hours} hr`
  }

  return `${hours} hr ${remaining} min`
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(
  status: string,
): string {
  const normalized =
    String(status)
      .toLowerCase()

  if (
    normalized === 'canceled'
  ) {
    return 'cancelled'
  }

  return normalized
}

function getStatusLabel(
  status: BookingStatus,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case 'pending':
      return 'Pending'

    case 'confirmed':
      return 'Confirmed'

    case 'completed':
      return 'Completed'

    case 'cancelled':
      return 'Cancelled'

    case 'rejected':
      return 'Rejected'

    default:
      return String(status)
  }
}

function getStatusClass(
  status: BookingStatus,
): string {
  return [
    'beauty-booking-status',
    `beauty-booking-status-${normalizeStatus(
      status,
    )}`,
  ].join(' ')
}

/* =========================================================
   BOOKING HELPERS
========================================================= */

function getAppointmentDate(
  booking: BeautyBooking,
): Date {
  return new Date(
    `${booking.booking_date}T${booking.booking_time}`,
  )
}

function isUpcoming(
  booking: BeautyBooking,
): boolean {
  const status =
    normalizeStatus(
      booking.status,
    )

  if (
    status === 'cancelled' ||
    status === 'rejected' ||
    status === 'completed'
  ) {
    return false
  }

  const appointment =
    getAppointmentDate(
      booking,
    )

  if (
    Number.isNaN(
      appointment.getTime(),
    )
  ) {
    return false
  }

  return (
    appointment.getTime() >=
    Date.now()
  )
}

function getLocationLabel(
  booking: BeautyBooking,
): string {
  return booking.location_type
    ?.toLowerCase() === 'home'
    ? 'At Home'
    : 'At Studio'
}

function getLocationSecondary(
  booking: BeautyBooking,
): string {
  if (
    booking.location_type
      ?.toLowerCase() === 'home'
  ) {
    return (
      booking.city ||
      'Home service'
    )
  }

  return (
    booking.city ||
    'WildPetal Studio'
  )
}

function getLocationAddress(
  booking: BeautyBooking,
): string {
  const parts = [
    booking.address,
    booking.city,
    booking.pincode,
  ].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(', ')
  }

  return 'Studio location details unavailable'
}

/* =========================================================
   SERVICE DISPLAY
========================================================= */

function getServiceDisplay(
  item: BookingItem,
  services: Service[],
) {
  const service =
    services.find(
      (value) =>
        value.id ===
        item.service_id,
    )

  const bookedPrice =
    Math.max(
      Number(item.price) || 0,
      0,
    )

  const originalPrice =
    Math.max(
      Number(
        service?.originalPrice ??
          service?.price ??
          bookedPrice,
      ) || bookedPrice,
      bookedPrice,
    )

  const serviceOfferPrice =
    Math.max(
      Number(
        service?.offerPrice ??
          bookedPrice,
      ) || bookedPrice,
      0,
    )

  const displayPrice =
    bookedPrice > 0
      ? bookedPrice
      : serviceOfferPrice

  const hasDiscount =
    originalPrice >
    displayPrice

  const discountAmount =
    hasDiscount
      ? originalPrice -
        displayPrice
      : 0

  let discountLabel =
    service?.discountLabel ??
    null

  if (
    !discountLabel &&
    hasDiscount &&
    originalPrice > 0
  ) {
    discountLabel =
      `${Math.round(
        (discountAmount /
          originalPrice) *
          100,
      )}% OFF`
  }

  return {
    service,
    originalPrice,
    displayPrice,
    discountAmount,
    discountLabel,
    hasDiscount,
  }
}

/* =========================================================
   COMPONENT
========================================================= */
function BeautyBookings() {
  const navigate =
    useNavigate()

  const [
    bookings,
    setBookings,
  ] =
    useState<BeautyBooking[]>(
      [],
    )

  const [
    services,
    setServices,
  ] =
    useState<Service[]>(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    filter,
    setFilter,
  ] =
    useState<FilterType>(
      'all',
    )

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortType>(
      'latest',
    )

    const [
  sortOpen,
  setSortOpen,
] =
  useState(false)

  const [
    expandedBooking,
    setExpandedBooking,
  ] =
    useState<string | null>(
      null,
    )

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1)

  const [
    cancellingBooking,
    setCancellingBooking,
  ] =
    useState<BeautyBooking | null>(
      null,
    )

  const [
    cancelling,
    setCancelling,
  ] =
    useState(false)

  const [
    cancelError,
    setCancelError,
  ] =
    useState('')

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setError('')

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        setBookings([])
        setServices([])

        setError(
          'You must be signed in to view your bookings.',
        )

        return
      }

      const [
        bookingsResponse,
        servicesResponse,
      ] =
        await Promise.all([
          supabase
            .from('bookings')
            .select(`
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
              created_at,
              location_type,
              address,
              city,
              pincode,
              booking_items (
                id,
                service_id,
                service_name,
                price,
                duration_minutes,
                person_id
              ),
              booking_people (
                id,
                name,
                phone,
                email
              )
            `)
            .eq(
              'customer_id',
              user.id,
            )
            .order(
              'created_at',
              {
                ascending: false,
              },
            ),

          getServices(),
        ])

      if (
        bookingsResponse.error
      ) {
        throw bookingsResponse.error
      }

      const normalizedBookings =
        (
          bookingsResponse.data ??
          []
        ) as unknown as BeautyBooking[]

      setBookings(
        normalizedBookings,
      )

      setServices(
        servicesResponse,
      )
    } catch (err) {
      console.error(
        'Failed to load beauty bookings:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your bookings. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     COUNTS
  ======================================================= */

  const upcomingCount =
    useMemo(
      () =>
        bookings.filter(
          isUpcoming,
        ).length,
      [bookings],
    )

  const completedCount =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            normalizeStatus(
              booking.status,
            ) === 'completed',
        ).length,
      [bookings],
    )

  const cancelledCount =
    useMemo(
      () =>
        bookings.filter(
          (booking) => {
            const status =
              normalizeStatus(
                booking.status,
              )

            return (
              status === 'cancelled' ||
              status === 'rejected'
            )
          },
        ).length,
      [bookings],
    )

  const totalBookingValue =
    useMemo(
      () =>
        bookings.reduce(
          (
            total,
            booking,
          ) =>
            total +
            (
              Number(
                booking.price,
              ) || 0
            ),
          0,
        ),
      [bookings],
    )

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const filteredBookings =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase()

      let result =
        [...bookings]

      if (
        filter === 'upcoming'
      ) {
        result =
          result.filter(
            isUpcoming,
          )
      }

      if (
        filter === 'completed'
      ) {
        result =
          result.filter(
            (booking) =>
              normalizeStatus(
                booking.status,
              ) === 'completed',
          )
      }

      if (
        filter === 'cancelled'
      ) {
        result =
          result.filter(
            (booking) => {
              const status =
                normalizeStatus(
                  booking.status,
                )

              return (
                status ===
                  'cancelled' ||
                status ===
                  'rejected'
              )
            },
          )
      }

      if (query) {
        result =
          result.filter(
            (booking) => {
              const serviceNames =
                (
                  booking.booking_items ??
                  []
                )
                  .map(
                    (item) =>
                      item.service_name,
                  )
                  .join(' ')

              const searchable =
                [
                  booking.id,
                  booking.customer_name,
                  booking.customer_email,
                  booking.customer_phone ??
                    '',
                  booking.city ??
                    '',
                  booking.location_type ??
                    '',
                  serviceNames,
                ]
                  .join(' ')
                  .toLowerCase()

              return searchable.includes(
                query,
              )
            },
          )
      }

      result.sort(
        (a, b) => {
          switch (sortBy) {
            case 'oldest':
              return (
                new Date(
                  a.created_at,
                ).getTime() -
                new Date(
                  b.created_at,
                ).getTime()
              )

            case 'appointment':
              return (
                getAppointmentDate(
                  a,
                ).getTime() -
                getAppointmentDate(
                  b,
                ).getTime()
              )

            case 'amount-high':
              return (
                Number(b.price) -
                Number(a.price)
              )

            case 'amount-low':
              return (
                Number(a.price) -
                Number(b.price)
              )

            case 'latest':
            default:
              return (
                new Date(
                  b.created_at,
                ).getTime() -
                new Date(
                  a.created_at,
                ).getTime()
              )
          }
        },
      )

      return result
    }, [
      bookings,
      filter,
      searchQuery,
      sortBy,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredBookings.length /
          BOOKINGS_PER_PAGE,
      ),
    )

  const paginatedBookings =
    useMemo(() => {
      const start =
        (
          currentPage -
          1
        ) *
        BOOKINGS_PER_PAGE

      return filteredBookings.slice(
        start,
        start +
          BOOKINGS_PER_PAGE,
      )
    }, [
      filteredBookings,
      currentPage,
    ])

  useEffect(() => {
    setCurrentPage(1)
    setExpandedBooking(null)
  }, [
    filter,
    searchQuery,
    sortBy,
  ])

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  /* =======================================================
     ACTIONS
  ======================================================= */

  function toggleBooking(
    bookingId: string,
  ) {
    setExpandedBooking(
      (current) =>
        current === bookingId
          ? null
          : bookingId,
    )
  }

  function openCancelModal(
    booking: BeautyBooking,
  ) {
    setCancelError('')
    setCancellingBooking(
      booking,
    )
  }

  function closeCancelModal() {
    if (cancelling) {
      return
    }

    setCancellingBooking(null)
    setCancelError('')
  }

  async function confirmCancellation() {
    if (
      !cancellingBooking ||
      cancelling
    ) {
      return
    }

    const booking =
      cancellingBooking

    const status =
      normalizeStatus(
        booking.status,
      )

    if (
      status !== 'pending' &&
      status !== 'confirmed'
    ) {
      setCancelError(
        'This booking can no longer be cancelled.',
      )

      return
    }

    setCancelling(true)
    setCancelError('')

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.',
        )
      }

      const {
        error: updateError,
      } =
        await supabase
          .from('bookings')
          .update({
            status:
              'cancelled',
          })
          .eq(
            'id',
            booking.id,
          )
          .eq(
            'customer_id',
            user.id,
          )
          .in(
            'status',
            [
              'pending',
              'confirmed',
            ],
          )

      if (updateError) {
        throw updateError
      }

      setBookings(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              booking.id
                ? {
                    ...item,
                    status:
                      'cancelled',
                  }
                : item,
          ),
      )

      setExpandedBooking(null)
      setCancellingBooking(null)
    } catch (err) {
      console.error(
        'Failed to cancel booking:',
        err,
      )

      setCancelError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel this booking. Please try again.',
      )
    } finally {
      setCancelling(false)
    }
  }

  function handleRebook(
    booking: BeautyBooking,
  ) {
    void booking
    navigate('/booking')
  }

  const pageNumbers =
    useMemo(() => {
      const pages: number[] =
        []

      for (
        let page = 1;
        page <= totalPages;
        page += 1
      ) {
        pages.push(page)
      }

      return pages
    }, [totalPages])

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="beauty-bookings-page">
        <div className="beauty-bookings-container">
          <div className="beauty-bookings-loading">
            <div className="beauty-bookings-loading-mark">
              <Sparkles size={22} />
            </div>

            <span>
              BEAUTY SERVICES
            </span>

            <h2>
              Preparing your appointments
            </h2>

            <p>
              Loading your personal
              booking collection...
            </p>

            <div className="beauty-bookings-spinner" />
          </div>
        </div>
      </main>
    )
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <main className="beauty-bookings-page">
        <div className="beauty-bookings-container">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <header className="beauty-bookings-header">

            <div className="beauty-bookings-header-copy">

              <span className="beauty-bookings-eyebrow">
                <span />
                MY ACCOUNT
              </span>

              <h1>
                Beauty{' '}
                <em>
                  Bookings
                </em>
              </h1>

              <p>
                View, manage and track all your beauty
                service bookings in one place.
              </p>

              <div className="beauty-bookings-header-summary">
                Total spend:{' '}
                <strong>
                  {formatPrice(
                    totalBookingValue,
                  )}
                </strong>
              </div>

              <div className="beauty-bookings-header-note">
                Relive your self-care moments
                <span>
                  ✦
                </span>
              </div>

            </div>

            <div className="beauty-bookings-header-actions">

              <button
                type="button"
                className="beauty-bookings-back-button"
                onClick={() =>
                  navigate('/account')
                }
              >
                <ArrowLeft size={16} />

                <span>
                  Back to Account
                </span>
              </button>

              <Link
                to="/services"
                className="beauty-bookings-new-button"
              >
                <CalendarDays size={16} />

                <span>
                  Book a New Service
                </span>
              </Link>

            </div>

          </header>

          {/* =================================================
              MAIN CARD
          ================================================= */}

          <section className="beauty-bookings-main-card">

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="beauty-bookings-toolbar">

              <div
                className="beauty-bookings-filters"
                role="tablist"
                aria-label="Booking filters"
              >

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    filter === 'all'
                  }
                  className={
                    filter === 'all'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter('all')
                  }
                >
                  <span>
                    All
                  </span>

                  <strong>
                    {bookings.length}
                  </strong>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    filter === 'upcoming'
                  }
                  className={
                    filter === 'upcoming'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter('upcoming')
                  }
                >
                  <CalendarDays size={14} />

                  <span>
                    Upcoming
                  </span>

                  <strong>
                    {upcomingCount}
                  </strong>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    filter === 'completed'
                  }
                  className={
                    filter === 'completed'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter('completed')
                  }
                >
                  <CheckCircle2 size={14} />

                  <span>
                    Completed
                  </span>

                  <strong>
                    {completedCount}
                  </strong>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    filter === 'cancelled'
                  }
                  className={
                    filter === 'cancelled'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter('cancelled')
                  }
                >
                  <X size={14} />

                  <span>
                    Cancelled
                  </span>

                  <strong>
                    {cancelledCount}
                  </strong>
                </button>

              </div>

              <div className="beauty-bookings-tools">

                <label className="beauty-search-box">
                  <Search size={18} />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search by service, booking ID..."
                    aria-label="Search bookings"
                  />
                </label>

                <div className="beauty-sort-box">

  <span>
    Sort by
  </span>

  <button
    type="button"
    className="beauty-sort-trigger"
    aria-haspopup="listbox"
    aria-expanded={sortOpen}
    onClick={() =>
      setSortOpen((value) => !value)
    }
  >
    <strong>
      {sortBy === 'latest'
        ? 'Latest First'
        : sortBy === 'oldest'
          ? 'Oldest First'
          : sortBy === 'appointment'
            ? 'Appointment Date'
            : sortBy === 'amount-high'
              ? 'Highest Amount'
              : 'Lowest Amount'}
    </strong>

    <ChevronDown
      size={16}
      className={
        sortOpen
          ? 'beauty-sort-chevron-open'
          : ''
      }
    />
  </button>

  {sortOpen && (
    <div
      className="beauty-sort-menu"
      role="listbox"
      aria-label="Sort bookings"
    >

      <button
        type="button"
        className={
          sortBy === 'latest'
            ? 'active'
            : ''
        }
        onClick={() => {
          setSortBy('latest')
          setSortOpen(false)
        }}
      >
        Latest First
      </button>

      <button
        type="button"
        className={
          sortBy === 'oldest'
            ? 'active'
            : ''
        }
        onClick={() => {
          setSortBy('oldest')
          setSortOpen(false)
        }}
      >
        Oldest First
      </button>

      <button
        type="button"
        className={
          sortBy === 'appointment'
            ? 'active'
            : ''
        }
        onClick={() => {
          setSortBy('appointment')
          setSortOpen(false)
        }}
      >
        Appointment Date
      </button>

      <button
        type="button"
        className={
          sortBy === 'amount-high'
            ? 'active'
            : ''
        }
        onClick={() => {
          setSortBy('amount-high')
          setSortOpen(false)
        }}
      >
        Highest Amount
      </button>

      <button
        type="button"
        className={
          sortBy === 'amount-low'
            ? 'active'
            : ''
        }
        onClick={() => {
          setSortBy('amount-low')
          setSortOpen(false)
        }}
      >
        Lowest Amount
      </button>

    </div>
  )}

</div>

              </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="beauty-bookings-error">

                <div className="beauty-bookings-error-icon">
                  <X size={18} />
                </div>

                <div>
                  <strong>
                    Something went wrong
                  </strong>

                  <p>
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadPageData()
                  }
                >
                  Try Again
                </button>

              </div>
            )}

            {/* =================================================
                EMPTY
            ================================================= */}

            {!error &&
              filteredBookings.length === 0 && (
                <div className="beauty-bookings-empty">

                  <div className="beauty-bookings-empty-icon">
                    <CalendarDays
                      size={28}
                      strokeWidth={1.5}
                    />
                  </div>

                  <span className="beauty-bookings-empty-eyebrow">
                    YOUR APPOINTMENTS
                  </span>

                  <h2>
                    No bookings found
                  </h2>

                  <p>
                    {searchQuery
                      ? 'Try another search term or clear your search.'
                      : 'Your beauty appointments will appear here after you make a booking.'}
                  </p>

                  {searchQuery ? (
                    <button
                      type="button"
                      className="beauty-bookings-empty-button"
                      onClick={() =>
                        setSearchQuery('')
                      }
                    >
                      Clear Search
                    </button>
                  ) : (
                    <Link
                      to="/booking"
                      className="beauty-bookings-empty-button"
                    >
                      Book Your First Service
                      <ArrowRight size={15} />
                    </Link>
                  )}

                </div>
              )}

            {/* =================================================
                BOOKING LIST
            ================================================= */}

            {!error &&
              paginatedBookings.length > 0 && (
                <div className="beauty-bookings-list">

                  {paginatedBookings.map(
                    (booking) => {
                      const isExpanded =
                        expandedBooking ===
                        booking.id

                      const serviceItems =
                        booking.booking_items ??
                        []

                      const people =
                        booking.booking_people ??
                        []

                      const peopleCount =
                        people.length || 1

                      const status =
                        normalizeStatus(
                          booking.status,
                        )

                      const canCancel =
                        status === 'pending' ||
                        status === 'confirmed'

                      const isCompleted =
                        status === 'completed'

                      const totalDuration =
                        serviceItems.reduce(
                          (
                            total,
                            item,
                          ) =>
                            total +
                            (
                              Number(
                                item.duration_minutes,
                              ) || 0
                            ),
                          0,
                        )

                      const bookingReference =
                        booking.id
                          .slice(0, 100)
                          .toUpperCase()

                      return (
                        <article
                          key={booking.id}
                          className={`beauty-booking-card ${
                            isExpanded
                              ? 'expanded'
                              : ''
                          }`}
                        >

                          {/* =================================================
                              BOOKING HEADER
                          ================================================= */}

                          <div className="beauty-booking-top">

                            <div className="beauty-booking-date-panel">

                              <div className="beauty-booking-date">
                                <strong>
                                  {formatDay(
                                    booking.booking_date,
                                  )}
                                </strong>

                                <span>
                                  {formatMonth(
                                    booking.booking_date,
                                  )}
                                </span>

                                <small>
                                  {formatWeekday(
                                    booking.booking_date,
                                  )}
                                </small>
                              </div>

                              <div className="beauty-booking-time">
                                <Clock3 size={14} />

                                <span>
                                  {formatTime(
                                    booking.booking_time,
                                  )}
                                </span>
                              </div>

                            </div>

                            <div className="beauty-booking-heading">

                              <span className="beauty-booking-eyebrow-small">
                                BEAUTY APPOINTMENT
                              </span>

                              <h2>
                                Booking #{bookingReference}
                              </h2>

                              <p>
                                Booked on{' '}
                                {formatBookedDate(
                                  booking.created_at,
                                )}
                              </p>

                            </div>

                            <div className="beauty-booking-status-area">

                              <span
                                className={getStatusClass(
                                  booking.status,
                                )}
                              >
                                <span className="beauty-status-dot" />

                                {getStatusLabel(
                                  booking.status,
                                )}
                              </span>

                              
                              
                            </div>
                            {/* =================================================
                              ACTIONS
                          ================================================= */}

                          <div className="beauty-booking-actions">

                            <div className="beauty-booking-action-spacer" />

                            <div className="beauty-booking-action-buttons">

                              <button
                                type="button"
                                className="beauty-booking-details-button"
                                onClick={() =>
                                  toggleBooking(
                                    booking.id,
                                  )
                                }
                                aria-expanded={
                                  isExpanded
                                }
                                aria-controls={`booking-details-${booking.id}`}
                              >
                                <span>
                                  {isExpanded
                                    ? 'Hide Details'
                                    : 'View Details'}
                                </span>

                                {isExpanded ? (
                                  <ChevronUp
                                    size={15}
                                  />
                                ) : (
                                  <ChevronDown
                                    size={15}
                                  />
                                )}
                              </button>

                              {canCancel && (
                                <button
                                  type="button"
                                  className="beauty-booking-cancel-button"
                                  onClick={() =>
                                    openCancelModal(
                                      booking,
                                    )
                                  }
                                >
                                  Cancel Booking
                                </button>
                              )}

              {isCompleted && (
                                <button
                                  type="button"
                                  className="beauty-booking-rebook-button"
                                  onClick={() =>
                                    handleRebook(
                                      booking,
                                    )
                                  }
                                >
                                  Rebook Service
                                </button>
                              )}

                            </div>

                          </div>

                            

                          </div>

                          {/* =================================================
                              QUICK SUMMARY
                          ================================================= */}

                          <div className="beauty-booking-summary">

                            {/* PEOPLE */}

                            <div className="beauty-booking-summary-item">

                              <div className="beauty-summary-icon">
                                <Users size={16} />
                              </div>

                              <div>
                                <strong>
                                  {peopleCount}{' '}
                                  {peopleCount === 1
                                    ? 'Person'
                                    : 'People'}
                                </strong>
                              </div>

                            </div>

                            {/* LOCATION */}

                            <div className="beauty-booking-summary-item">

                              <div className="beauty-summary-icon">
                                {status ===
                                'completed' ? (
                                  <CheckCircle2
                                    size={16}
                                  />
                                ) : (
                                  <MapPin
                                    size={16}
                                  />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {getLocationLabel(
                                    booking,
                                  )}
                                </strong>

                                <span>
                                  {getLocationSecondary(
                                    booking,
                                  )}
                                </span>
                              </div>

                            </div>

                            {/* SERVICE DURATION */}

                            <div className="beauty-booking-summary-item">

                              <div className="beauty-summary-icon">
                                <Clock3 size={16} />
                              </div>

                              <div>
                                <strong>
                                  {formatDuration(
                                    totalDuration,
                                  )}
                                </strong>

                                <span>
                                  Service Duration
                                </span>
                              </div>

                            </div>

                            {/* TOTAL */}

                            <div className="beauty-booking-summary-item beauty-booking-summary-total">

                              <div className="beauty-summary-icon">
                                ₹
                              </div>

                              <div>
                                <strong>
                                  {formatPrice(
                                    booking.price,
                                  )}
                                </strong>

                                <span>
                                  Total Amount
                                </span>
                              </div>

                            </div>

                          </div>

                          

                          {/* =================================================
                              EXPANDED DETAILS
                          ================================================= */}

                          {isExpanded && (
                            <div
                              id={`booking-details-${booking.id}`}
                              className="beauty-booking-expanded"
                            >

                              {/* =================================================
    PEOPLE & SELECTED SERVICES
================================================= */}

{booking.booking_people.length > 0 && (
  <section className="beauty-selected-services">

    <div className="beauty-selected-services-header">

      <div>
        <span className="beauty-section-label">
          APPOINTMENT DETAILS
        </span>

        <h3>
          People & Selected Services
        </h3>
      </div>

      <span className="beauty-people-count">
        {booking.booking_people.length}{' '}
        {booking.booking_people.length === 1
          ? 'Person'
          : 'People'}
      </span>

    </div>


    <div className="beauty-booking-people-list">

      {booking.booking_people.map(
        (person, personIndex) => {

          const personServices =
            booking.booking_items.filter(
              (item) =>
                item.person_id === person.id,
            )

          const personTotal =
            personServices.reduce(
              (total, item) =>
                total +
                Number(item.price || 0),
              0,
            )

          const personDuration =
            personServices.reduce(
              (total, item) =>
                total +
                Number(
                  item.duration_minutes || 0,
                ),
              0,
            )

          return (
            <article
              key={person.id}
              className="beauty-booking-person-card"
            >

              {/* =====================================
                  PERSON HEADER
              ===================================== */}

              <div className="beauty-booking-person-header">

                <div className="beauty-booking-person-number">
                  {String(
                    personIndex + 1,
                  ).padStart(2, '0')}
                </div>


                <div className="beauty-booking-person-info">

  <span className="beauty-booking-person-label">
    PERSON {personIndex + 1}
  </span>

  <div className="beauty-booking-person-contact">

    <div className="beauty-booking-contact-row">
      <span>Name:</span>
      <strong>
        {person.name ||
          `Person ${personIndex + 1}`}
      </strong>
    </div>

    {person.email && (
      <div className="beauty-booking-contact-row">
        <span>Email:</span>
        <strong className="beauty-booking-email">
          {person.email}
        </strong>
      </div>
    )}

    {person.phone && (
      <div className="beauty-booking-contact-row">
        <span>Number:</span>
        <strong>
          {person.phone}
        </strong>
      </div>
    )}

  </div>

</div>


                <div className="beauty-booking-person-total">

                  <span>
                    TOTAL
                  </span>

                  <strong>
                    {formatPrice(
                      personTotal,
                    )}
                  </strong>

                </div>

              </div>


              {/* =====================================
                  SERVICES FOR THIS PERSON
              ===================================== */}

              <div className="beauty-booking-person-services">

                <div className="beauty-booking-person-services-title">

                  <strong>
                    Selected Services
                  </strong>

                  <span>
                    {personServices.length}{' '}
                    {personServices.length === 1
                      ? 'Service'
                      : 'Services'}
                  </span>

                </div>


                {personServices.length > 0 ? (

                  <div className="beauty-selected-services-grid">

                    {personServices.map(
                      (item) => {

                        const display =
                          getServiceDisplay(
                            item,
                            services,
                          )

                        return (
                          <div
                            key={item.id}
                            className="beauty-selected-service-card"
                          >

                            {/* SERVICE IMAGE */}

                            <div className="beauty-selected-service-image">

                              {display.service?.imageUrl ? (

                                <img
                                  src={
                                    display
                                      .service
                                      .imageUrl
                                  }
                                  alt={
                                    item.service_name
                                  }
                                />

                              ) : (

                                <span>
                                  WF
                                </span>

                              )}

                            </div>


                            {/* SERVICE DETAILS */}

                            <div className="beauty-selected-service-content">

                              <strong>
                                {item.service_name}
                              </strong>

                              <span>
                                {formatDuration(
                                  item.duration_minutes,
                                )}
                              </span>


                              {display.hasDiscount && (
                                <small>
                                  {
                                    display.discountLabel
                                  }
                                </small>
                              )}

                            </div>


                            {/* SERVICE PRICE */}

                            <div className="beauty-selected-service-price">

                              {display.hasDiscount && (
                                <span>
                                  {formatPrice(
                                    display.originalPrice,
                                  )}
                                </span>
                              )}

                              <strong>
                                {formatPrice(
                                  display.displayPrice,
                                )}
                              </strong>

                            </div>

                          </div>
                        )
                      },
                    )}

                  </div>

                ) : (

                  <div className="beauty-booking-no-services">
                    No services selected for this person.
                  </div>

                )}

              </div>


              {/* =====================================
                  PERSON SUMMARY
              ===================================== */}

              <div className="beauty-booking-person-footer">

                <div>
                  <span>
                    SERVICES
                  </span>

                  <strong>
                    {personServices.length}
                  </strong>
                </div>


                <div>
                  <span>
                    DURATION
                  </span>

                  <strong>
                    {formatDuration(
                      personDuration,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    PERSON TOTAL
                  </span>

                  <strong>
                    {formatPrice(
                      personTotal,
                    )}
                  </strong>
                </div>

              </div>

            </article>
          )
        },
      )}

    </div>

  </section>
)}
                              {/* =================================================
                                  INFORMATION GRID
                              ================================================= */}

                              <div className="beauty-booking-information-grid">

                                {/* CUSTOMER */}

                                <section className="beauty-booking-information-section">

                                  <div className="beauty-information-heading">
                                    <h3>
                                      Customer Details
                                    </h3>
                                  </div>

                                  <div className="beauty-information-list">

                                    <div className="beauty-information-row">
                                      <UserRound size={17} />

                                      <div>
                                        <strong>
                                          {booking.customer_name}
                                        </strong>
                                      </div>
                                    </div>

                                    <div className="beauty-information-row">
                                      <Mail size={17} />

                                      <span>
                                        {booking.customer_email}
                                      </span>
                                    </div>

                                    {booking.customer_phone && (
                                      <div className="beauty-information-row">
                                        <Phone size={17} />

                                        <span>
                                          {booking.customer_phone}
                                        </span>
                                      </div>
                                    )}

                                  </div>

                                </section>

                                {/* LOCATION */}

                                <section className="beauty-booking-information-section">

                                  <div className="beauty-information-heading">
                                    <h3>
                                      Location Details
                                    </h3>
                                  </div>

                                  <div className="beauty-information-list">

                                    <div className="beauty-information-row">
                                      {booking.location_type
                                        ?.toLowerCase() ===
                                      'home' ? (
                                        <Home size={17} />
                                      ) : (
                                        <MapPin size={17} />
                                      )}

                                      <div>
                                        <strong>
                                          {getLocationLabel(
                                            booking,
                                          )}
                                        </strong>

                                        <span>
                                          {getLocationSecondary(
                                            booking,
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="beauty-information-row">
                                      <MapPin size={17} />

                                      <span>
                                        {getLocationAddress(
                                          booking,
                                        )}
                                      </span>
                                    </div>

                                  </div>

                                </section>

                                {/* ADDITIONAL */}

                                <section className="beauty-booking-information-section">

                                  <div className="beauty-information-heading">
                                    <h3>
                                      Additional Information
                                    </h3>
                                  </div>

                                  <div className="beauty-information-list">

                                    <div className="beauty-information-row beauty-information-row-top">
                                      <Users size={17} />

                                      <div>
                                        <strong>
                                          Guests
                                        </strong>

                                        <span>
                                          {people.length > 0
                                            ? people
                                                .map(
                                                  (
                                                    person,
                                                  ) =>
                                                    person.name,
                                                )
                                                .join(
                                                  ', ',
                                                )
                                            : `${booking.customer_name} (Self)`}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="beauty-information-row beauty-information-row-top">
                                      <Sparkles size={17} />

                                      <div>
                                        <strong>
                                          Notes
                                        </strong>

                                        <span>
                                          {booking.notes ||
                                            'No additional notes provided.'}
                                        </span>
                                      </div>
                                    </div>

                                  </div>

                                </section>

                              </div>

                            </div>
                          )}

                        </article>
                      )
                    },
                  )}

                </div>
              )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!error &&
              filteredBookings.length > 0 && (
                <div className="beauty-bookings-pagination">

                  <div className="beauty-pagination-info">
                    Showing{' '}
                    <strong>
                      {Math.min(
                        (
                          currentPage -
                          1
                        ) *
                          BOOKINGS_PER_PAGE +
                          1,
                        filteredBookings.length,
                      )}
                    </strong>

                    {' – '}

                    <strong>
                      {Math.min(
                        currentPage *
                          BOOKINGS_PER_PAGE,
                        filteredBookings.length,
                      )}
                    </strong>

                    {' of '}

                    <strong>
                      {
                        filteredBookings.length
                      }
                    </strong>

                    {' bookings'}
                  </div>

                  <div className="beauty-pagination-controls">

                    <button
                      type="button"
                      className="beauty-pagination-arrow"
                      disabled={
                        currentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1,
                            ),
                        )
                      }
                      aria-label="Previous page"
                    >
                      <ChevronLeft
                        size={17}
                      />
                    </button>

                    {pageNumbers.map(
                      (page) => (
                        <button
                          type="button"
                          key={page}
                          className={
                            currentPage ===
                            page
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            setCurrentPage(
                              page,
                            )
                          }
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      className="beauty-pagination-arrow"
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1,
                            ),
                        )
                      }
                      aria-label="Next page"
                    >
                      <ChevronRight
                        size={17}
                      />
                    </button>

                  </div>

                  <div className="beauty-pagination-per-page">

                    <span>
                      Show
                    </span>

                    <strong>
                      {BOOKINGS_PER_PAGE}
                    </strong>

                    <span>
                      per page
                    </span>

                    <ChevronDown
                      size={15}
                    />

                  </div>

                </div>
              )}

          </section>

        </div>
      </main>

      {/* =====================================================
          CANCEL MODAL
      ===================================================== */}

      {cancellingBooking && (
        <div
          className="beauty-cancel-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCancelModal()
            }
          }}
        >
          <div
            className="beauty-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="beauty-cancel-title"
          >

            <button
              type="button"
              className="beauty-cancel-close"
              onClick={
                closeCancelModal
              }
              disabled={
                cancelling
              }
              aria-label="Close cancellation dialog"
            >
              <X size={17} />
            </button>

            <div className="beauty-cancel-icon">
              <X size={24} />
            </div>

            <span className="beauty-cancel-eyebrow">
              CANCEL APPOINTMENT
            </span>

            <h2 id="beauty-cancel-title">
              Cancel this booking?
            </h2>

            <p>
              Are you sure you want to cancel
              booking #
              {cancellingBooking.id
                .slice(0, 7)
                .toUpperCase()}
              ?
            </p>

            <div className="beauty-cancel-booking-summary">
              <strong>
                {formatLongDate(
                  cancellingBooking.booking_date,
                )}
              </strong>

              <span>
                {formatTime(
                  cancellingBooking.booking_time,
                )}
              </span>
            </div>

            {cancelError && (
              <div className="beauty-cancel-error">
                <X size={15} />

                <span>
                  {cancelError}
                </span>
              </div>
            )}

            <div className="beauty-cancel-actions">

              <button
                type="button"
                className="beauty-cancel-keep"
                onClick={
                  closeCancelModal
                }
                disabled={
                  cancelling
                }
              >
                Keep Booking
              </button>

              <button
                type="button"
                className="beauty-cancel-confirm"
                onClick={
                  confirmCancellation
                }
                disabled={
                  cancelling
                }
              >
                {cancelling
                  ? 'Cancelling...'
                  : 'Cancel Booking'}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default BeautyBookings