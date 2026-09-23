import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './AdminBeautyBookings.css'

/* =========================================================
   TYPES
========================================================= */

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'

type FilterType =
  | 'all'
  | 'upcoming'
  | 'completed'
  | 'cancelled'

type SortType =
  | 'latest'
  | 'oldest'
  | 'appointment'
  | 'highest'
  | 'lowest'

type Booking = {
  id: string
  customer_id: string
  service_id: string | null
  booking_date: string
  booking_time: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  notes: string | null
  price: number | string | null
  status: BookingStatus
  location_type: string | null
  address: string | null
  city: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

type BookingItem = {
  id: string
  booking_id: string
  service_id: string
  service_name: string | null
  price: number | string | null
  duration_minutes: number | string | null
  person_id: string | null
}

type BookingPerson = {
  id: string
  booking_id: string
  name: string
  phone: string | null
  email: string | null
}

type ServiceRecord = {
  id: string
  name: string
  price: number | string | null
  duration_minutes: number | string | null
  image_url: string | null
}

type BookingWithDetails = Booking & {
  items: BookingItem[]
  people: BookingPerson[]
}

type ServiceDisplay = {
  name: string
  imageUrl: string | null
  duration: number
  originalPrice: number
  finalPrice: number
  discountAmount: number
  discountLabel: string | null
  hasDiscount: boolean
}

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_PAGE_SIZE = 3

const PAGE_SIZE_OPTIONS = [
  3,
  5,
  10,
  20,
]

/* =========================================================
   FORMATTERS
========================================================= */

function toNumber(
  value: number | string | null | undefined,
): number {
  const numberValue = Number(value)

  return Number.isFinite(numberValue)
    ? numberValue
    : 0
}

function formatCurrency(
  value: number | string | null | undefined,
): string {
  return `₹${Math.round(
    toNumber(value),
  ).toLocaleString('en-IN')}`
}

function formatDuration(
  minutes: number | string | null | undefined,
): string {
  const value = Math.max(
    Math.floor(toNumber(minutes)),
    0,
  )

  if (value === 0) {
    return '0 min'
  }

  const hours = Math.floor(
    value / 60,
  )

  const remaining = value % 60

  if (hours === 0) {
    return `${remaining} min`
  }

  if (remaining === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remaining} min`
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(
    `${value}T00:00:00`,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function formatLongDate(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(
    `${value}T00:00:00`,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function formatTime(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const [
    hour,
    minute,
  ] = value
    .split(':')
    .map(Number)

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return value
  }

  const date = new Date()

  date.setHours(
    hour,
    minute,
    0,
    0,
  )

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )
}

function formatBookingId(
  id: string,
): string {
  if (!id) {
    return 'Booking'
  }

  return `#${id.toUpperCase()}`
}

/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(
  status: string | null | undefined,
): string {
  const value = String(
    status ?? '',
  )
    .trim()
    .toLowerCase()

  if (value === 'canceled') {
    return 'cancelled'
  }

  return value
}

function getStatusLabel(
  status: string | null | undefined,
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
      return 'Unknown'
  }
}

/* =========================================================
   BOOKING HELPERS
========================================================= */

function getAppointmentDate(
  booking: Booking,
): Date {
  return new Date(
    `${booking.booking_date}T${
      booking.booking_time || '00:00'
    }`,
  )
}

function isUpcoming(
  booking: Booking,
): boolean {
  const status =
    normalizeStatus(
      booking.status,
    )

  if (
    status === 'completed' ||
    status === 'cancelled' ||
    status === 'rejected'
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
  booking: Booking,
): string {
  return booking.location_type
    ?.toLowerCase() === 'home'
    ? 'At Home'
    : 'At Studio'
}

function getLocationSecondary(
  booking: Booking,
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
  booking: Booking,
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

function getBookingDuration(
  booking: BookingWithDetails,
): number {
  return booking.items.reduce(
    (
      total,
      item,
    ) =>
      total +
      Math.max(
        toNumber(
          item.duration_minutes,
        ),
        0,
      ),
    0,
  )
}

function getPersonDuration(
  booking: BookingWithDetails,
  personId: string,
): number {
  return booking.items
    .filter(
      (item) =>
        item.person_id ===
        personId,
    )
    .reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.max(
          toNumber(
            item.duration_minutes,
          ),
          0,
        ),
      0,
    )
}

function getPersonItems(
  booking: BookingWithDetails,
  personId: string,
): BookingItem[] {
  return booking.items.filter(
    (item) =>
      item.person_id ===
      personId,
  )
}

/* =========================================================
   SERVICE DISPLAY
========================================================= */

function getServiceDisplay(
  item: BookingItem,
  serviceMap: Map<
    string,
    ServiceRecord
  >,
): ServiceDisplay {
  const service =
    serviceMap.get(
      item.service_id,
    )

  const finalPrice = Math.max(
    toNumber(item.price),
    0,
  )

  const originalPrice = Math.max(
    toNumber(service?.price),
    finalPrice,
  )

  const discountAmount =
    Math.max(
      originalPrice -
        finalPrice,
      0,
    )

  const hasDiscount =
    discountAmount > 0

  const discountLabel =
    hasDiscount &&
    originalPrice > 0
      ? `${Math.round(
          (discountAmount /
            originalPrice) *
            100,
        )}% OFF`
      : null

  return {
    name:
      item.service_name ||
      service?.name ||
      'Beauty Service',

    imageUrl:
      service?.image_url ??
      null,

    duration:
      toNumber(
        item.duration_minutes,
      ) ||
      toNumber(
        service?.duration_minutes,
      ),

    originalPrice,

    finalPrice,

    discountAmount,

    discountLabel,

    hasDiscount,
  }
}

/* =========================================================
   MAP
========================================================= */

function getMapUrl(
  booking: Booking,
): string {
  if (
    Number.isFinite(
      Number(booking.latitude),
    ) &&
    Number.isFinite(
      Number(booking.longitude),
    )
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${booking.latitude},${booking.longitude}`,
    )}`
  }

  const address =
    getLocationAddress(
      booking,
    )

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`
}

/* =========================================================
   PAGE NUMBER HELPER
========================================================= */

function buildPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<
  number | 'left-ellipsis' | 'right-ellipsis'
> {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) =>
        index + 1,
    )
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      'right-ellipsis',
      totalPages,
    ]
  }

  if (
    currentPage >=
    totalPages - 3
  ) {
    return [
      1,
      'left-ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'left-ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'right-ellipsis',
    totalPages,
  ]
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminBeautyBookings() {
  const [
    bookings,
    setBookings,
  ] =
    useState<BookingWithDetails[]>(
      [],
    )

  const [
    services,
    setServices,
  ] =
    useState<ServiceRecord[]>(
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
    search,
    setSearch,
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
    sort,
    setSort,
  ] =
    useState<SortType>(
      'latest',
    )

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1)

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      DEFAULT_PAGE_SIZE,
    )

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState<BookingWithDetails | null>(
      null,
    )

  const [
    cancelBooking,
    setCancelBooking,
  ] =
    useState<BookingWithDetails | null>(
      null,
    )

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false)

  /* =======================================================
     SERVICE MAP
  ======================================================= */

  const serviceMap =
    useMemo(
      () =>
        new Map(
          services.map(
            (service) => [
              service.id,
              service,
            ],
          ),
        ),
      [services],
    )

  /* =======================================================
     LOAD BOOKINGS
  ======================================================= */

  const loadBookings =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        try {
          const {
            data: bookingData,
            error: bookingError,
          } =
            await supabase
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
                  location_type,
                  address,
                  city,
                  pincode,
                  latitude,
                  longitude,
                  created_at
                `,
              )
              .order(
                'created_at',
                {
                  ascending: false,
                },
              )

          if (bookingError) {
            throw bookingError
          }

          const safeBookings =
            (bookingData ??
              []) as Booking[]

          if (
            safeBookings.length ===
            0
          ) {
            setBookings([])
            setServices([])
            return
          }

          const bookingIds =
            safeBookings.map(
              (booking) =>
                booking.id,
            )

          const [
            itemsResponse,
            peopleResponse,
          ] =
            await Promise.all([
              supabase
                .from(
                  'booking_items',
                )
                .select(
                  `
                    id,
                    booking_id,
                    service_id,
                    service_name,
                    price,
                    duration_minutes,
                    person_id
                  `,
                )
                .in(
                  'booking_id',
                  bookingIds,
                ),

              supabase
                .from(
                  'booking_people',
                )
                .select(
                  `
                    id,
                    booking_id,
                    name,
                    phone,
                    email
                  `,
                )
                .in(
                  'booking_id',
                  bookingIds,
                ),
            ])

          if (
            itemsResponse.error
          ) {
            throw itemsResponse.error
          }

          if (
            peopleResponse.error
          ) {
            throw peopleResponse.error
          }

          const items =
            (itemsResponse.data ??
              []) as BookingItem[]

          const people =
            (peopleResponse.data ??
              []) as BookingPerson[]

          const serviceIds = [
            ...new Set(
              items
                .map(
                  (item) =>
                    item.service_id,
                )
                .filter(Boolean),
            ),
          ]

          let serviceRecords:
            ServiceRecord[] =
            []

          if (
            serviceIds.length > 0
          ) {
            const {
              data: serviceData,
              error: serviceError,
            } =
              await supabase
                .from('services')
                .select(
                  `
                    id,
                    name,
                    price,
                    duration_minutes,
                    image_url
                  `,
                )
                .in(
                  'id',
                  serviceIds,
                )

            if (serviceError) {
              throw serviceError
            }

            serviceRecords =
              (serviceData ??
                []) as ServiceRecord[]
          }

          const result =
            safeBookings.map(
              (booking) => ({
                ...booking,

                items:
                  items.filter(
                    (item) =>
                      item.booking_id ===
                      booking.id,
                  ),

                people:
                  people.filter(
                    (person) =>
                      person.booking_id ===
                      booking.id,
                  ),
              }),
            )

          setBookings(result)
          setServices(
            serviceRecords,
          )
        } catch (err) {
          console.error(
            'Failed to load admin beauty bookings:',
            err,
          )

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load bookings.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  /* =======================================================
     BODY LOCK
  ======================================================= */

  useEffect(() => {
    const modalOpen =
      Boolean(
        selectedBooking ||
          cancelBooking,
      )

    if (!modalOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [
    selectedBooking,
    cancelBooking,
  ])

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key !== 'Escape' ||
        actionLoading
      ) {
        return
      }

      setSelectedBooking(null)
      setCancelBooking(null)
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [actionLoading])

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts =
    useMemo(() => {
      return {
        all: bookings.length,

        upcoming:
          bookings.filter(
            isUpcoming,
          ).length,

        completed:
          bookings.filter(
            (booking) =>
              normalizeStatus(
                booking.status,
              ) === 'completed',
          ).length,

        cancelled:
          bookings.filter(
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
          ).length,
      }
    }, [bookings])

  /* =======================================================
     FILTER / SEARCH / SORT
  ======================================================= */

  const filteredBookings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      let result =
        [...bookings]

      if (
        filter ===
        'upcoming'
      ) {
        result =
          result.filter(
            isUpcoming,
          )
      }

      if (
        filter ===
        'completed'
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
        filter ===
        'cancelled'
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
                booking.items
                  .map(
                    (item) =>
                      item.service_name ||
                      serviceMap.get(
                        item.service_id,
                      )?.name ||
                      '',
                  )
                  .join(' ')

              const peopleNames =
                booking.people
                  .map(
                    (person) =>
                      person.name,
                  )
                  .join(' ')

              const searchable =
                [
                  booking.id,
                  booking.customer_name,
                  booking.customer_email,
                  booking.customer_phone,
                  booking.city,
                  booking.address,
                  serviceNames,
                  peopleNames,
                ]
                  .filter(Boolean)
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
          if (
            sort ===
            'highest'
          ) {
            return (
              toNumber(b.price) -
              toNumber(a.price)
            )
          }

          if (
            sort === 'lowest'
          ) {
            return (
              toNumber(a.price) -
              toNumber(b.price)
            )
          }

          if (
            sort === 'oldest'
          ) {
            return (
              new Date(
                a.created_at,
              ).getTime() -
              new Date(
                b.created_at,
              ).getTime()
            )
          }

          if (
            sort ===
            'appointment'
          ) {
            return (
              getAppointmentDate(
                a,
              ).getTime() -
              getAppointmentDate(
                b,
              ).getTime()
            )
          }

          return (
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime()
          )
        },
      )

      return result
    }, [
      bookings,
      filter,
      search,
      sort,
      serviceMap,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredBookings.length /
          pageSize,
      ),
    )

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    )

  const startIndex =
    (safePage - 1) *
    pageSize

  const paginatedBookings =
    filteredBookings.slice(
      startIndex,
      startIndex +
        pageSize,
    )

  const firstItem =
    filteredBookings.length ===
    0
      ? 0
      : startIndex + 1

  const lastItem =
    Math.min(
      startIndex +
        pageSize,
      filteredBookings.length,
    )

  const pageNumbers =
    buildPageNumbers(
      safePage,
      totalPages,
    )

  useEffect(() => {
    setCurrentPage(1)
  }, [
    filter,
    search,
    sort,
    pageSize,
  ])

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  async function updateBookingStatus(
    booking: BookingWithDetails,
    status:
      | 'confirmed'
      | 'completed'
      | 'cancelled',
  ) {
    if (actionLoading) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const {
        error: updateError,
      } =
        await supabase
          .from('bookings')
          .update({
            status,
          })
          .eq(
            'id',
            booking.id,
          )

      if (updateError) {
        throw updateError
      }

      setSelectedBooking(null)
      setCancelBooking(null)

      await loadBookings()
    } catch (err) {
      console.error(
        'Failed to update booking status:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update booking status.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  /* =======================================================
     SERVICE CARD
  ======================================================= */

  function renderServiceCard(
    item: BookingItem,
  ) {
    const display =
      getServiceDisplay(
        item,
        serviceMap,
      )

    return (
      <article
        className="admin-detail-service-card"
        key={item.id}
      >
        <div className="admin-detail-service-image">
          {display.imageUrl ? (
            <img
              src={
                display.imageUrl
              }
              alt={
                display.name
              }
              loading="lazy"
            />
          ) : (
            <div className="admin-detail-service-placeholder">
              <span>WF</span>
            </div>
          )}
        </div>

        <div className="admin-detail-service-content">
          <div className="admin-detail-service-title-row">
            <h4>
              {display.name}
            </h4>

            {display.hasDiscount &&
              display.discountLabel && (
                <span className="admin-detail-discount">
                  {display.discountLabel}
                </span>
              )}
          </div>

          <div className="admin-detail-service-meta">
            <Clock3 size={14} />

            <span>
              {formatDuration(
                display.duration,
              )}
            </span>
          </div>
        </div>

        <div className="admin-detail-service-price">
          {display.hasDiscount && (
            <span>
              {formatCurrency(
                display.originalPrice,
              )}
            </span>
          )}

          <strong>
            {formatCurrency(
              display.finalPrice,
            )}
          </strong>
        </div>
      </article>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="admin-beauty-bookings">
      <div className="admin-beauty-bookings-container">

        <Link
          to="/admin"
          className="admin-beauty-bookings-back"
          aria-label="Back to Dashboard"
        >
          <span aria-hidden="true">
            ←
          </span>

          Back to Dashboard
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="admin-bookings-header">
          <div>
            <span className="admin-bookings-eyebrow">
              BOOKINGS
            </span>

            <h1>
              Beauty Bookings
            </h1>

            <p>
              Manage customer beauty
              appointments and booking
              activity.
            </p>
          </div>
        </header>

        {/* =================================================
            FILTER TABS
        ================================================= */}

        <section className="admin-booking-controls">

          <div className="admin-booking-tabs">

            <button
              type="button"
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
                {counts.all}
              </strong>
            </button>

            <button
              type="button"
              className={
                filter ===
                'upcoming'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(
                  'upcoming',
                )
              }
            >
              <span>
                Upcoming
              </span>

              <strong>
                {counts.upcoming}
              </strong>
            </button>

            <button
              type="button"
              className={
                filter ===
                'completed'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(
                  'completed',
                )
              }
            >
              <span>
                Completed
              </span>

              <strong>
                {counts.completed}
              </strong>
            </button>

            <button
              type="button"
              className={
                filter ===
                'cancelled'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(
                  'cancelled',
                )
              }
            >
              <span>
                Cancelled
              </span>

              <strong>
                {counts.cancelled}
              </strong>
            </button>

          </div>

          <div className="admin-booking-search-row">

            <label className="admin-booking-search">
              <Search
                size={18}
              />

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by customer, booking ID or service..."
                aria-label="Search bookings"
              />
            </label>

            <label className="admin-booking-sort">
              <span>
                SORT BY
              </span>

              <div>
                <select
                  value={sort}
                  onChange={(
                    event,
                  ) =>
                    setSort(
                      event.target
                        .value as SortType,
                    )
                  }
                  aria-label="Sort bookings"
                >
                  <option value="latest">
                    Latest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>

                  <option value="appointment">
                    Appointment Date
                  </option>

                  <option value="highest">
                    Amount: High to Low
                  </option>

                  <option value="lowest">
                    Amount: Low to High
                  </option>
                </select>

                <ChevronDown
                  size={16}
                />
              </div>
            </label>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="admin-bookings-error">
            <XCircle
              size={18}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                void loadBookings()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <section className="admin-bookings-state">
            <div className="admin-bookings-spinner" />

            <h2>
              Loading bookings
            </h2>

            <p>
              Fetching appointments and
              service information...
            </p>
          </section>
        ) : filteredBookings.length ===
          0 ? (
          <section className="admin-bookings-state empty">
            <div className="admin-bookings-empty-icon">
              <CalendarDays
                size={27}
              />
            </div>

            <span className="admin-bookings-eyebrow">
              APPOINTMENTS
            </span>

            <h2>
              No bookings found
            </h2>

            <p>
              No beauty bookings match
              your current search or
              filter.
            </p>
          </section>
        ) : (
          <>
            <section className="admin-bookings-list">

              {paginatedBookings.map(
                (booking) => {
                  const status =
                    normalizeStatus(
                      booking.status,
                    )

                  const duration =
                    getBookingDuration(
                      booking,
                    )

                  const peopleCount =
                    booking.people.length ||
                    1

                  const serviceCount =
                    booking.items.length

                  return (
                    <article
                      className="admin-booking-card"
                      key={booking.id}
                    >

                      {/* CARD HEADER */}

                      <div className="admin-booking-card-top">

                        <div>
                          <span>
                            BOOKING
                          </span>

                          <strong>
                            {formatBookingId(
                              booking.id,
                            )}
                          </strong>
                        </div>

                        <span
                          className={`admin-booking-status ${status}`}
                        >
                          <i />

                          {getStatusLabel(
                            booking.status,
                          )}
                        </span>

                      </div>

                      {/* CUSTOMER */}

                      <div className="admin-booking-customer">

                        <div className="admin-booking-avatar">
                          <UserRound
                            size={21}
                          />
                        </div>

                        <div className="admin-booking-customer-content">
                          <span>
                            CUSTOMER
                          </span>

                          <h2>
                            {booking.customer_name ||
                              'Customer'}
                          </h2>

                          <p>
                            {booking.customer_email ||
                              'Email not available'}
                          </p>

                          {booking.customer_phone && (
                            <a
                              href={`tel:${booking.customer_phone}`}
                              className="admin-booking-phone"
                            >
                              <Phone
                                size={13}
                              />

                              {
                                booking.customer_phone
                              }
                            </a>
                          )}
                        </div>

                      </div>

                      {/* META */}

                      <div className="admin-booking-meta">

                        <div>
                          <CalendarDays
                            size={18}
                          />

                          <div>
                            <span>
                              DATE
                            </span>

                            <strong>
                              {formatDate(
                                booking.booking_date,
                              )}
                            </strong>
                          </div>
                        </div>

                        <div>
                          <Clock3
                            size={18}
                          />

                          <div>
                            <span>
                              TIME
                            </span>

                            <strong>
                              {formatTime(
                                booking.booking_time,
                              )}
                            </strong>
                          </div>
                        </div>

                        <a
                          className="admin-booking-location-link"
                          href={getMapUrl(
                            booking,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin
                            size={18}
                          />

                          <div>
                            <span>
                              LOCATION
                            </span>

                            <strong>
                              {getLocationLabel(
                                booking,
                              )}
                            </strong>

                            <small>
                              {getLocationSecondary(
                                booking,
                              )}
                            </small>
                          </div>

                          <ExternalLink
                            size={13}
                          />
                        </a>

                      </div>

                      {/* QUICK SUMMARY */}

                      <div className="admin-booking-quick-summary">

                        <div>
                          <Users
                            size={16}
                          />

                          <span>
                            {peopleCount}{' '}
                            {peopleCount ===
                            1
                              ? 'Person'
                              : 'People'}
                          </span>
                        </div>

                        <div>
                          <Clock3
                            size={16}
                          />

                          <span>
                            {formatDuration(
                              duration,
                            )}
                          </span>
                        </div>

                        <div>
                          <span>
                            {serviceCount}{' '}
                            {serviceCount ===
                            1
                              ? 'service'
                              : 'services'}
                          </span>
                        </div>

                      </div>

                      {/* FOOTER */}

                      <div className="admin-booking-card-footer">

                        <div className="admin-booking-total">
                          <span>
                            TOTAL AMOUNT
                          </span>

                          <strong>
                            {formatCurrency(
                              booking.price,
                            )}
                          </strong>
                        </div>

                        <div className="admin-booking-actions">

                          <button
                            type="button"
                            className="admin-booking-details-button"
                            onClick={() =>
                              setSelectedBooking(
                                booking,
                              )
                            }
                          >
                            View Details
                          </button>

                          {status ===
                            'pending' && (
                            <button
                              type="button"
                              className="admin-booking-confirm-button"
                              disabled={
                                actionLoading
                              }
                              onClick={() =>
                                void updateBookingStatus(
                                  booking,
                                  'confirmed',
                                )
                              }
                            >
                              <CheckCircle2
                                size={15}
                              />

                              Confirm
                            </button>
                          )}

                          {status ===
                            'confirmed' && (
                            <button
                              type="button"
                              className="admin-booking-complete-button"
                              disabled={
                                actionLoading
                              }
                              onClick={() =>
                                void updateBookingStatus(
                                  booking,
                                  'completed',
                                )
                              }
                            >
                              <CheckCircle2
                                size={15}
                              />

                              Complete
                            </button>
                          )}

                          {(status ===
                            'pending' ||
                            status ===
                              'confirmed') && (
                            <button
                              type="button"
                              className="admin-booking-cancel-button"
                              disabled={
                                actionLoading
                              }
                              onClick={() =>
                                setCancelBooking(
                                  booking,
                                )
                              }
                            >
                              <XCircle
                                size={15}
                              />

                              Cancel
                            </button>
                          )}

                        </div>

                      </div>

                    </article>
                  )
                },
              )}

            </section>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <footer className="admin-bookings-pagination">

              <div className="admin-pagination-info">
                Showing{' '}
                <strong>
                  {firstItem}
                </strong>
                {' – '}
                <strong>
                  {lastItem}
                </strong>
                {' of '}
                <strong>
                  {
                    filteredBookings.length
                  }
                </strong>{' '}
                bookings
              </div>

              <div className="admin-pagination-controls">

                <button
                  type="button"
                  disabled={
                    safePage === 1
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
                  (page) => {
                    if (
                      typeof page !==
                      'number'
                    ) {
                      return (
                        <span
                          key={page}
                          className="admin-pagination-ellipsis"
                        >
                          …
                        </span>
                      )
                    }

                    return (
                      <button
                        type="button"
                        key={page}
                        className={
                          page ===
                          safePage
                            ? 'active'
                            : ''
                        }
                        aria-current={
                          page ===
                          safePage
                            ? 'page'
                            : undefined
                        }
                        onClick={() =>
                          setCurrentPage(
                            page,
                          )
                        }
                      >
                        {page}
                      </button>
                    )
                  },
                )}

                <button
                  type="button"
                  disabled={
                    safePage ===
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

              <label className="admin-pagination-per-page">
                <span>
                  Show
                </span>

                <select
                  value={pageSize}
                  onChange={(
                    event,
                  ) =>
                    setPageSize(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                  aria-label="Bookings per page"
                >
                  {PAGE_SIZE_OPTIONS.map(
                    (size) => (
                      <option
                        value={size}
                        key={size}
                      >
                        {size}
                      </option>
                    ),
                  )}
                </select>

                <span>
                  per page
                </span>
              </label>

            </footer>
          </>
        )}
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedBooking && (
        <div
          className="admin-booking-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedBooking(null)
            }
          }}
        >
          <section
            className="admin-booking-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-booking-details-title"
          >

            {/* MODAL HEADER */}

            <header className="admin-details-modal-header">

              <div>
                <span>
                  BOOKING DETAILS
                </span>

                <h2 id="admin-booking-details-title">
                  {formatBookingId(
                    selectedBooking.id,
                  )}
                </h2>

                <p>
                  Booked on{' '}
                  {formatDate(
                    selectedBooking.created_at.slice(
                      0,
                      10,
                    ),
                  )}
                </p>
              </div>

              <div className="admin-details-modal-header-right">

                <span
                  className={`admin-booking-status ${normalizeStatus(
                    selectedBooking.status,
                  )}`}
                >
                  <i />

                  {getStatusLabel(
                    selectedBooking.status,
                  )}
                </span>

                <button
                  type="button"
                  className="admin-booking-modal-close"
                  onClick={() =>
                    setSelectedBooking(
                      null,
                    )
                  }
                  aria-label="Close booking details"
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

            </header>

            <div className="admin-details-modal-content">

              {/* =================================================
                  APPOINTMENT
              ================================================= */}

              <section className="admin-modal-section">

                <div className="admin-modal-section-heading">
                  <div>
                    <span>
                      APPOINTMENT
                    </span>

                    <h3>
                      Your scheduled visit
                    </h3>
                  </div>
                </div>

                <div className="admin-modal-appointment-grid">

                  <div className="admin-modal-detail-card">
                    <CalendarDays
                      size={19}
                    />

                    <div>
                      <span>
                        DATE
                      </span>

                      <strong>
                        {formatLongDate(
                          selectedBooking.booking_date,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-modal-detail-card">
                    <Clock3
                      size={19}
                    />

                    <div>
                      <span>
                        TIME
                      </span>

                      <strong>
                        {formatTime(
                          selectedBooking.booking_time,
                        )}
                      </strong>
                    </div>
                  </div>

                  <a
                    className="admin-modal-detail-card admin-modal-location-card"
                    href={getMapUrl(
                      selectedBooking,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin
                      size={19}
                    />

                    <div>
                      <span>
                        LOCATION
                      </span>

                      <strong>
                        {getLocationLabel(
                          selectedBooking,
                        )}
                      </strong>

                      <small>
                        {getLocationSecondary(
                          selectedBooking,
                        )}
                      </small>
                    </div>

                    <ExternalLink
                      size={14}
                    />
                  </a>

                </div>

                <a
                  className="admin-modal-address"
                  href={getMapUrl(
                    selectedBooking,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin
                    size={16}
                  />

                  <span>
                    {getLocationAddress(
                      selectedBooking,
                    )}
                  </span>

                  <ExternalLink
                    size={14}
                  />
                </a>

              </section>

              {/* =================================================
                  PEOPLE + SERVICES
              ================================================= */}

              <section className="admin-modal-section">

                <div className="admin-modal-section-heading">
                  <div>
                    <span>
                      PEOPLE & SERVICES
                    </span>

                    <h3>
                      Appointment breakdown
                    </h3>
                  </div>

                  <strong>
                    {selectedBooking.people.length ||
                      1}{' '}
                    {selectedBooking.people.length ===
                    1
                      ? 'person'
                      : 'people'}
                  </strong>
                </div>

                <div className="admin-modal-people-list">

                  {selectedBooking.people.length >
                  0 ? (
                    selectedBooking.people.map(
                      (
                        person,
                        index,
                      ) => {
                        const personItems =
                          getPersonItems(
                            selectedBooking,
                            person.id,
                          )

                        const personDuration =
                          getPersonDuration(
                            selectedBooking,
                            person.id,
                          )

                        const personTotal =
                          personItems.reduce(
                            (
                              total,
                              item,
                            ) =>
                              total +
                              toNumber(
                                item.price,
                              ),
                            0,
                          )

                        return (
                          <article
                            className="admin-person-booking-card"
                            key={
                              person.id
                            }
                          >

                            <header className="admin-person-booking-header">

                              <div className="admin-person-avatar">
                                <UserRound
                                  size={19}
                                />
                              </div>

                              <div className="admin-person-booking-info">

                                <span>
                                  PERSON{' '}
                                  {String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </span>

                                <h4>
                                  {person.name ||
                                    `Person ${
                                      index +
                                      1
                                    }`}
                                </h4>

                                {person.email && (
                                  <p>
                                    {
                                      person.email
                                    }
                                  </p>
                                )}

                                {person.phone && (
                                  <a
                                    href={`tel:${person.phone}`}
                                  >
                                    <Phone
                                      size={13}
                                    />

                                    {
                                      person.phone
                                    }
                                  </a>
                                )}

                              </div>

                              <div className="admin-person-total">
                                <span>
                                  PERSON TOTAL
                                </span>

                                <strong>
                                  {formatCurrency(
                                    personTotal,
                                  )}
                                </strong>
                              </div>

                            </header>

                            <div className="admin-person-services">

                              {personItems.length >
                              0 ? (
                                personItems.map(
                                  (
                                    item,
                                  ) =>
                                    renderServiceCard(
                                      item,
                                    ),
                                )
                              ) : (
                                <div className="admin-booking-no-services">
                                  No services assigned
                                  to this person.
                                </div>
                              )}

                            </div>

                            <footer className="admin-person-booking-footer">

                              <div>
                                <Clock3
                                  size={15}
                                />

                                <span>
                                  Service duration
                                </span>

                                <strong>
                                  {formatDuration(
                                    personDuration,
                                  )}
                                </strong>
                              </div>

                              <span>
                                {
                                  personItems.length
                                }{' '}
                                {personItems.length ===
                                1
                                  ? 'service'
                                  : 'services'}
                              </span>

                            </footer>

                          </article>
                        )
                      },
                    )
                  ) : (
                    <div className="admin-person-booking-card">
                      <div className="admin-booking-no-services">
                        Customer details unavailable.
                      </div>
                    </div>
                  )}

                </div>

              </section>

              {/* =================================================
                  TOTAL
              ================================================= */}

              <section className="admin-modal-total-card">

                <div>
                  <span>
                    PEOPLE
                  </span>

                  <strong>
                    {selectedBooking.people.length ||
                      1}
                  </strong>
                </div>

                <div>
                  <span>
                    TOTAL DURATION
                  </span>

                  <strong>
                    {formatDuration(
                      getBookingDuration(
                        selectedBooking,
                      ),
                    )}
                  </strong>
                </div>

                <div className="total-highlight">
                  <span>
                    TOTAL AMOUNT
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedBooking.price,
                    )}
                  </strong>
                </div>

              </section>

              {/* =================================================
                  NOTES
              ================================================= */}

              {selectedBooking.notes && (
                <section className="admin-modal-notes">
                  <span>
                    CUSTOMER NOTES
                  </span>

                  <p>
                    {selectedBooking.notes}
                  </p>
                </section>
              )}

            </div>

            {/* =================================================
                MODAL ACTIONS
            ================================================= */}

            <footer className="admin-details-modal-actions">

              {normalizeStatus(
                selectedBooking.status,
              ) === 'pending' && (
                <button
                  type="button"
                  className="admin-booking-confirm-button"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    void updateBookingStatus(
                      selectedBooking,
                      'confirmed',
                    )
                  }
                >
                  <CheckCircle2
                    size={16}
                  />

                  {actionLoading
                    ? 'Confirming...'
                    : 'Confirm Booking'}
                </button>
              )}

              {normalizeStatus(
                selectedBooking.status,
              ) === 'confirmed' && (
                <button
                  type="button"
                  className="admin-booking-complete-button"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    void updateBookingStatus(
                      selectedBooking,
                      'completed',
                    )
                  }
                >
                  <CheckCircle2
                    size={16}
                  />

                  {actionLoading
                    ? 'Updating...'
                    : 'Mark Completed'}
                </button>
              )}

              {(normalizeStatus(
                selectedBooking.status,
              ) === 'pending' ||
                normalizeStatus(
                  selectedBooking.status,
                ) ===
                  'confirmed') && (
                <button
                  type="button"
                  className="admin-booking-cancel-button"
                  disabled={
                    actionLoading
                  }
                  onClick={() => {
                    setSelectedBooking(
                      null,
                    )

                    setCancelBooking(
                      selectedBooking,
                    )
                  }}
                >
                  <XCircle
                    size={16}
                  />

                  Cancel Booking
                </button>
              )}

            </footer>

          </section>
        </div>
      )}

      {/* =====================================================
          CANCEL MODAL
      ===================================================== */}

      {cancelBooking && (
        <div
          className="admin-booking-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget &&
              !actionLoading
            ) {
              setCancelBooking(
                null,
              )
            }
          }}
        >
          <section
            className="admin-booking-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-cancel-booking-title"
          >

            <button
              type="button"
              className="admin-booking-modal-close"
              onClick={() =>
                setCancelBooking(
                  null,
                )
              }
              disabled={
                actionLoading
              }
              aria-label="Close cancellation dialog"
            >
              <X
                size={18}
              />
            </button>

            <div className="admin-booking-cancel-icon">
              <XCircle
                size={25}
              />
            </div>

            <span className="admin-bookings-eyebrow cancel">
              CANCEL APPOINTMENT
            </span>

            <h2 id="admin-cancel-booking-title">
              Cancel this booking?
            </h2>

            <p>
              Are you sure you want to
              cancel this appointment?
              The customer will see the
              updated status.
            </p>

            <div className="admin-booking-cancel-summary">

              <div>
                <span>
                  CUSTOMER
                </span>

                <strong>
                  {cancelBooking.customer_name ||
                    'Customer'}
                </strong>
              </div>

              <div>
                <span>
                  APPOINTMENT
                </span>

                <strong>
                  {formatDate(
                    cancelBooking.booking_date,
                  )}
                </strong>

                <small>
                  {formatTime(
                    cancelBooking.booking_time,
                  )}
                </small>
              </div>

              <div>
                <span>
                  TOTAL
                </span>

                <strong>
                  {formatCurrency(
                    cancelBooking.price,
                  )}
                </strong>
              </div>

            </div>

            <div className="admin-booking-cancel-actions">

              <button
                type="button"
                className="admin-booking-keep-button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  setCancelBooking(
                    null,
                  )
                }
              >
                Keep Booking
              </button>

              <button
                type="button"
                className="admin-booking-cancel-confirm-button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  void updateBookingStatus(
                    cancelBooking,
                    'cancelled',
                  )
                }
              >
                <XCircle
                  size={16}
                />

                {actionLoading
                  ? 'Cancelling...'
                  : 'Cancel Booking'}
              </button>

            </div>

          </section>
        </div>
      )}

    </main>
  )
}

export default AdminBeautyBookings