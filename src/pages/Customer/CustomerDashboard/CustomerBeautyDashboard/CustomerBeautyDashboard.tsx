import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  Users,
} from 'lucide-react'

import { supabase } from "../../../../lib/supabase";
import './CustomerBeautyDashboard.css'


/* =========================================================
   TYPES
========================================================= */

type BookingStatus = string

type BookingPerson = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

type BookingItem = {
  id: string
  service_id: string
  service_name: string
  price: number
  duration_minutes: number
  person_id: string
}

type Booking = {
  id: string
  customer_id: string
  service_id: string
  booking_date: string
  booking_time: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  price: number
  status: BookingStatus
  created_at: string
  booking_items: BookingItem[]
  booking_people: BookingPerson[]
}


type EnquiryStatus = string

type EnquiryPerson = {
  id: string
  enquiry_id: string
  name: string
  phone: string | null
  email: string | null
}

type EnquiryItem = {
  id: string
  enquiry_id: string
  person_id: string
  service_id: string
  service_name: string
  duration_minutes: number
  original_price: number
  price: number
  discount_amount: number
  discount_label: string | null
}

type Enquiry = {
  id: string
  preferred_date: string
  preferred_time: string
  contact_preference: string
  notes: string | null
  subtotal: number
  discount_amount: number
  total_amount: number
  status: EnquiryStatus
  created_at: string
  people: EnquiryPerson[]
  items: EnquiryItem[]
}


type Activity = {
  id: string
  type: 'booking' | 'enquiry'
  title: string
  description: string
  date: string
  timestamp: number
}


/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(
  status: string | null | undefined,
) {
  return String(
    status ?? '',
  )
    .trim()
    .toLowerCase()
}


function getBookingDateTime(
  booking: Booking,
) {
  return new Date(
    `${booking.booking_date}T${
      booking.booking_time || '00:00:00'
    }`,
  )
}


function getEnquiryDateTime(
  enquiry: Enquiry,
) {
  return new Date(
    `${enquiry.preferred_date}T${
      enquiry.preferred_time || '00:00:00'
    }`,
  )
}


function isValidDate(
  value: Date,
) {
  return !Number.isNaN(
    value.getTime(),
  )
}


function isCompletedBooking(
  booking: Booking,
) {
  return (
    normalizeStatus(
      booking.status,
    ) === 'completed'
  )
}


function isCancelledBooking(
  booking: Booking,
) {
  const status =
    normalizeStatus(
      booking.status,
    )

  return (
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'rejected'
  )
}


function isUpcomingBooking(
  booking: Booking,
) {
  if (
    isCompletedBooking(
      booking,
    ) ||
    isCancelledBooking(
      booking,
    )
  ) {
    return false
  }

  const date =
    getBookingDateTime(
      booking,
    )

  return (
    isValidDate(date) &&
    date.getTime() >=
      Date.now()
  )
}


function isCompletedEnquiry(
  enquiry: Enquiry,
) {
  const status =
    normalizeStatus(
      enquiry.status,
    )

  return (
    status === 'closed' ||
    status === 'completed'
  )
}


function isUpcomingEnquiry(
  enquiry: Enquiry,
) {
  const status =
    normalizeStatus(
      enquiry.status,
    )

  if (
    status === 'closed' ||
    status === 'completed' ||
    status === 'rejected'
  ) {
    return false
  }

  return true
}


function formatDate(
  date: string,
) {
  if (!date) {
    return '—'
  }

  const value =
    new Date(
      `${date}T00:00:00`,
    )

  if (
    !isValidDate(
      value,
    )
  ) {
    return date
  }

  return value.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}


function formatTime(
  time: string,
) {
  if (!time) {
    return '—'
  }

  const [
    hours,
    minutes,
  ] =
    time
      .split(':')
      .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time
  }

  const value =
    new Date()

  value.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return value.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  )
}


function getBookingPersonName(
  booking: Booking,
) {
  return (
    booking.booking_people?.[0]?.name ||
    booking.customer_name ||
    'Customer'
  )
}


function getEnquiryPersonName(
  enquiry: Enquiry,
) {
  return (
    enquiry.people?.[0]?.name ||
    'Customer'
  )
}


function getBookingPersonCount(
  booking: Booking,
) {
  return (
    booking.booking_people?.length ||
    0
  )
}


function getEnquiryPersonCount(
  enquiry: Enquiry,
) {
  return (
    enquiry.people?.length ||
    0
  )
}


function getBookingServiceCount(
  booking: Booking,
) {
  return (
    booking.booking_items?.length ||
    0
  )
}


function getEnquiryServiceCount(
  enquiry: Enquiry,
) {
  return (
    enquiry.items?.length ||
    0
  )
}


function formatCount(
  value: number,
  singular: string,
  plural: string,
) {
  return `${value} ${
    value === 1
      ? singular
      : plural
  }`
}


function getBookingServices(
  booking: Booking,
) {
  const names =
    booking.booking_items
      ?.map(
        (item) =>
          item.service_name,
      )
      .filter(Boolean) ?? []

  return Array.from(
    new Set(names),
  )
}


function getEnquiryServices(
  enquiry: Enquiry,
) {
  const names =
    enquiry.items
      ?.map(
        (item) =>
          item.service_name,
      )
      .filter(Boolean) ?? []

  return Array.from(
    new Set(names),
  )
}


function getMonthKey(
  date: string,
) {
  return date.slice(
    0,
    7,
  )
}


function getCurrentMonthKey() {
  const now =
    new Date()

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(
    2,
    '0',
  )}`
}


function getMonthLabel(
  key: string,
) {
  const [
    year,
    month,
  ] =
    key
      .split('-')
      .map(Number)

  const value =
    new Date(
      year,
      month - 1,
      1,
    )

  return value.toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric',
    },
  )
}


function getAvailableMonths(
  bookings: Booking[],
  enquiries: Enquiry[],
) {
  const keys =
    new Set<string>()

  bookings.forEach(
    (
      booking,
    ) => {
      if (
        booking.booking_date
      ) {
        keys.add(
          getMonthKey(
            booking.booking_date,
          ),
        )
      }
    },
  )

  enquiries.forEach(
    (
      enquiry,
    ) => {
      if (
        enquiry.preferred_date
      ) {
        keys.add(
          getMonthKey(
            enquiry.preferred_date,
          ),
        )
      }
    },
  )

  keys.add(
    getCurrentMonthKey(),
  )

  return Array.from(
    keys,
  )
    .sort()
    .reverse()
}


function getDateParts(
  date: string,
) {
  const value =
    new Date(
      `${date}T00:00:00`,
    )

  if (
    !isValidDate(
      value,
    )
  ) {
    return {
      day: '—',
      month: '—',
    }
  }

  return {
    day: String(
      value.getDate(),
    ).padStart(
      2,
      '0',
    ),

    month:
      value.toLocaleDateString(
        'en-IN',
        {
          month: 'short',
        },
      ),
  }
}


/* =========================================================
   COMPONENT
========================================================= */

function CustomerBeautyDashboard() {

  const [
    bookings,
    setBookings,
  ] =
    useState<Booking[]>([])

  const [
    enquiries,
    setEnquiries,
  ] =
    useState<Enquiry[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      getCurrentMonthKey(),
    )


  /* =======================================================
     LOAD REAL CUSTOMER DATA
  ======================================================= */

  const loadDashboard =
    async () => {

      try {

        setLoading(
          true,
        )

        setError(
          null,
        )


        /* -----------------------------------------------
           CURRENT CUSTOMER
        ------------------------------------------------ */

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          throw new Error(
            'Unable to identify your account.',
          )
        }


        /* -----------------------------------------------
           BOOKINGS
        ------------------------------------------------ */

        const bookingsPromise =
          supabase
            .from(
              'bookings',
            )
            .select(`
              id,
              customer_id,
              service_id,
              booking_date,
              booking_time,
              customer_name,
              customer_email,
              customer_phone,
              price,
              status,
              created_at,
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
              'booking_date',
              {
                ascending:
                  false,
              },
            )


        /* -----------------------------------------------
           ENQUIRIES
        ------------------------------------------------ */

        const enquiriesPromise =
          supabase
            .from(
              'enquiries',
            )
            .select(`
              id,
              preferred_date,
              preferred_time,
              contact_preference,
              notes,
              subtotal,
              discount_amount,
              total_amount,
              status,
              created_at
            `)
            .eq(
              'customer_id',
              user.id,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )


        const [
          bookingsResult,
          enquiriesResult,
        ] =
          await Promise.all([
            bookingsPromise,
            enquiriesPromise,
          ])


        if (
          bookingsResult.error
        ) {
          throw bookingsResult.error
        }

        if (
          enquiriesResult.error
        ) {
          throw enquiriesResult.error
        }


        const bookingRows =
          (
            bookingsResult.data ??
            []
          ) as unknown as Booking[]


        const enquiryRows =
          (
            enquiriesResult.data ??
            []
          ) as unknown as Enquiry[]


        /* -----------------------------------------------
           ENQUIRY PEOPLE + ITEMS
        ------------------------------------------------ */

        if (
          enquiryRows.length >
          0
        ) {

          const enquiryIds =
            enquiryRows.map(
              (
                enquiry,
              ) =>
                enquiry.id,
            )


          const [
            peopleResult,
            itemsResult,
          ] =
            await Promise.all([

              supabase
                .from(
                  'enquiry_people',
                )
                .select(`
                  id,
                  enquiry_id,
                  name,
                  phone,
                  email
                `)
                .in(
                  'enquiry_id',
                  enquiryIds,
                ),

              supabase
                .from(
                  'enquiry_items',
                )
                .select(`
                  id,
                  enquiry_id,
                  person_id,
                  service_id,
                  service_name,
                  duration_minutes,
                  original_price,
                  price,
                  discount_amount,
                  discount_label
                `)
                .in(
                  'enquiry_id',
                  enquiryIds,
                ),
            ])


          if (
            peopleResult.error
          ) {
            throw peopleResult.error
          }

          if (
            itemsResult.error
          ) {
            throw itemsResult.error
          }


          const people =
            (
              peopleResult.data ??
              []
            ) as EnquiryPerson[]


          const items =
            (
              itemsResult.data ??
              []
            ) as EnquiryItem[]


          const combinedEnquiries =
            enquiryRows.map(
              (
                enquiry,
              ) => ({
                ...enquiry,

                people:
                  people.filter(
                    (
                      person,
                    ) =>
                      person.enquiry_id ===
                      enquiry.id,
                  ),

                items:
                  items.filter(
                    (
                      item,
                    ) =>
                      item.enquiry_id ===
                      enquiry.id,
                  ),
              }),
            )


          setBookings(
            bookingRows,
          )

          setEnquiries(
            combinedEnquiries,
          )

        } else {

          setBookings(
            bookingRows,
          )

          setEnquiries(
            [],
          )
        }

      } catch (
        loadError
      ) {

        console.error(
          'Failed to load beauty dashboard:',
          loadError,
        )

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load your beauty dashboard.',
        )

      } finally {

        setLoading(
          false,
        )
      }
    }


  useEffect(
    () => {

      void loadDashboard()

    },
    [],
  )


  /* =======================================================
     MONTHS
  ======================================================= */

  const months =
    useMemo(
      () =>
        getAvailableMonths(
          bookings,
          enquiries,
        ),
      [
        bookings,
        enquiries,
      ],
    )


  /* =======================================================
     UPCOMING
  ======================================================= */

  const upcomingBookings =
    useMemo(
      () =>
        bookings
          .filter(
            isUpcomingBooking,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getBookingDateTime(
                a,
              ).getTime() -
              getBookingDateTime(
                b,
              ).getTime(),
          ),
      [
        bookings,
      ],
    )


  const upcomingEnquiries =
    useMemo(
      () =>
        enquiries
          .filter(
            isUpcomingEnquiry,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getEnquiryDateTime(
                a,
              ).getTime() -
              getEnquiryDateTime(
                b,
              ).getTime(),
          ),
      [
        enquiries,
      ],
    )


  /* =======================================================
     COMPLETED
  ======================================================= */

  const completedBookings =
    useMemo(
      () =>
        bookings
          .filter(
            isCompletedBooking,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getBookingDateTime(
                b,
              ).getTime() -
              getBookingDateTime(
                a,
              ).getTime(),
          ),
      [
        bookings,
      ],
    )


  const completedEnquiries =
    useMemo(
      () =>
        enquiries
          .filter(
            isCompletedEnquiry,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getEnquiryDateTime(
                b,
              ).getTime() -
              getEnquiryDateTime(
                a,
              ).getTime(),
          ),
      [
        enquiries,
      ],
    )


  /* =======================================================
     MONTHLY DATA
  ======================================================= */

  const monthlyBookings =
    useMemo(
      () =>
        bookings
          .filter(
            (
              booking,
            ) =>
              getMonthKey(
                booking.booking_date,
              ) ===
              selectedMonth,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getBookingDateTime(
                a,
              ).getTime() -
              getBookingDateTime(
                b,
              ).getTime(),
          ),
      [
        bookings,
        selectedMonth,
      ],
    )


  const monthlyEnquiries =
    useMemo(
      () =>
        enquiries
          .filter(
            (
              enquiry,
            ) =>
              getMonthKey(
                enquiry.preferred_date,
              ) ===
              selectedMonth,
          )
          .sort(
            (
              a,
              b,
            ) =>
              getEnquiryDateTime(
                a,
              ).getTime() -
              getEnquiryDateTime(
                b,
              ).getTime(),
          ),
      [
        enquiries,
        selectedMonth,
      ],
    )


  /* =======================================================
     RECENT ACTIVITIES
     
     IMPORTANT:
     Only the latest 5 are displayed.
  ======================================================= */

  const activities =
    useMemo<Activity[]>(
      () => {

        const bookingActivities =
          bookings.map(
            (
              booking,
            ) => {

              const services =
                getBookingServices(
                  booking,
                )

              const status =
                normalizeStatus(
                  booking.status,
                )

              let title =
                'Booking updated'

              if (
                status ===
                'completed'
              ) {
                title =
                  'Booking completed'
              } else if (
                status ===
                'confirmed'
              ) {
                title =
                  'Booking confirmed'
              } else if (
                status ===
                'cancelled' ||
                status ===
                'canceled'
              ) {
                title =
                  'Booking cancelled'
              } else {
                title =
                  'Booking created'
              }

              return {
                id: `booking-${booking.id}`,

                type:
                  'booking' as const,

                title,

                description:
                  services.length >
                  0
                    ? services.join(
                        ', ',
                      )
                    : 'Beauty appointment',

                date:
                  booking.created_at,

                timestamp:
                  new Date(
                    booking.created_at,
                  ).getTime(),
              }
            },
          )


        const enquiryActivities =
          enquiries.map(
            (
              enquiry,
            ) => {

              const status =
                normalizeStatus(
                  enquiry.status,
                )

              let title =
                'Enquiry submitted'

              if (
                status ===
                'replied'
              ) {
                title =
                  'Enquiry replied'
              } else if (
                status ===
                'closed'
              ) {
                title =
                  'Enquiry closed'
              } else if (
                status ===
                'accepted'
              ) {
                title =
                  'Enquiry accepted'
              } else if (
                status ===
                'rejected'
              ) {
                title =
                  'Enquiry rejected'
              }

              const services =
                getEnquiryServices(
                  enquiry,
                )

              return {
                id: `enquiry-${enquiry.id}`,

                type:
                  'enquiry' as const,

                title,

                description:
                  services.length >
                  0
                    ? services.join(
                        ', ',
                      )
                    : 'Beauty enquiry',

                date:
                  enquiry.created_at,

                timestamp:
                  new Date(
                    enquiry.created_at,
                  ).getTime(),
              }
            },
          )


        return [
          ...bookingActivities,
          ...enquiryActivities,
        ]
          .sort(
            (
              a,
              b,
            ) =>
              b.timestamp -
              a.timestamp,
          )
          .slice(
            0,
            5,
          )

      },
      [
        bookings,
        enquiries,
      ],
    )


  /* =======================================================
     MONTHLY COUNTS
  ======================================================= */

  const monthlyBookingCount =
    monthlyBookings.length

  const monthlyEnquiryCount =
    monthlyEnquiries.length


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="customer-beauty-dashboard">

        <section className="customer-beauty-state-card">

          <RefreshCw
            size={28}
            className="customer-beauty-spin"
          />

          <h2>
            Loading your beauty dashboard
          </h2>

          <p>
            Please wait while we load your
            bookings and enquiries.
          </p>

        </section>

      </main>
    )
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {
    return (
      <main className="customer-beauty-dashboard">

        <section className="customer-beauty-state-card">

          <div className="customer-beauty-state-icon">
            !
          </div>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="customer-beauty-retry"
            onClick={() =>
              void loadDashboard()
            }
          >
            Try Again
          </button>

        </section>

      </main>
    )
  }


  return (
    <main className="customer-beauty-dashboard">

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="customer-beauty-header">

        <div>

          <span className="customer-beauty-eyebrow">
            WILDFLORAL / BEAUTY
          </span>

          <h1>
            Your beauty
            <span>
              dashboard.
            </span>
          </h1>

          <p>
            Manage your beauty bookings,
            enquiries, completed services,
            and recent activity from one place.
          </p>

        </div>


        <Link
          to="/booking"
          className="customer-beauty-book-button"
        >
          Book a Service
          <span>
            →
          </span>
        </Link>

      </section>


      {/* ===================================================
          SUMMARY
      =================================================== */}

      <section className="customer-beauty-summary">

        <article className="customer-beauty-summary-card">

          <div className="customer-beauty-summary-icon">
            <CalendarDays size={21} />
          </div>

          <div>

            <small>
              OVERVIEW
            </small>

            <strong>
              {bookings.length}
            </strong>

            <h2>
              Total Bookings
            </h2>

            <p>
              All your beauty appointments.
            </p>

          </div>

        </article>


        <article className="customer-beauty-summary-card">

          <div className="customer-beauty-summary-icon">
            <MessageCircle size={21} />
          </div>

          <div>

            <small>
              OVERVIEW
            </small>

            <strong>
              {enquiries.length}
            </strong>

            <h2>
              Total Enquiries
            </h2>

            <p>
              All your beauty enquiries.
            </p>

          </div>

        </article>


        <article className="customer-beauty-summary-card">

          <div className="customer-beauty-summary-icon">
            <Clock3 size={21} />
          </div>

          <div>

            <small>
              UPCOMING
            </small>

            <strong>
              {upcomingBookings.length}
            </strong>

            <h2>
              Upcoming Bookings
            </h2>

            <p>
              Appointments scheduled ahead.
            </p>

          </div>

        </article>


        <article className="customer-beauty-summary-card">

          <div className="customer-beauty-summary-icon">
            <MessageCircle size={21} />
          </div>

          <div>

            <small>
              UPCOMING
            </small>

            <strong>
              {upcomingEnquiries.length}
            </strong>

            <h2>
              Upcoming Enquiries
            </h2>

            <p>
              Active beauty enquiries.
            </p>

          </div>

        </article>

      </section>


      {/* ===================================================
          UPCOMING / COMPLETED MAIN CARD
      =================================================== */}

      <section className="customer-beauty-main-card">

        <div className="customer-beauty-main-card-header">

          <div>

            <span>
              ACTIVITY OVERVIEW
            </span>

            <h2>
              Your beauty activity
            </h2>

          </div>

          <div className="customer-beauty-main-card-label">
            <span>
              Upcoming
            </span>

            <span>
              Completed
            </span>
          </div>

        </div>


        <div className="customer-beauty-overview-columns">

          {/* =================================================
              UPCOMING
          ================================================= */}

          <div className="customer-beauty-overview-column upcoming">

            <div className="customer-beauty-column-heading">

              <div>
                <small>
                  UPCOMING
                </small>

                <h3>
                  Next appointments
                </h3>
              </div>

              <span>
                {upcomingBookings.length +
                  upcomingEnquiries.length}
              </span>

            </div>


            {/* UPCOMING BOOKINGS */}

            <article className="customer-beauty-sub-card">

              <div className="customer-beauty-sub-card-header">

                <div className="customer-beauty-sub-card-title">

                  <CalendarDays
                    size={18}
                  />

                  <div>
                    <small>
                      BOOKINGS
                    </small>

                    <h4>
                      Upcoming Bookings
                    </h4>
                  </div>

                </div>

                <strong>
                  {upcomingBookings.length}
                </strong>

              </div>


              <div className="customer-beauty-sub-list">

                {upcomingBookings.length >
                0 ? (

                  upcomingBookings
                    .slice(
                      0,
                      4,
                    )
                    .map(
                      (
                        booking,
                      ) => {

                        const date =
                          getDateParts(
                            booking.booking_date,
                          )

                        const services =
                          getBookingServices(
                            booking,
                          )

                        return (
                          <div
                            className="customer-beauty-record"
                            key={
                              booking.id
                            }
                          >

                            <div className="customer-beauty-record-date">

                              <strong>
                                {date.day}
                              </strong>

                              <span>
                                {date.month}
                              </span>

                            </div>


                            <div className="customer-beauty-record-content">

                              <h5>
                                {getBookingPersonName(
                                  booking,
                                )}
                              </h5>

                              <p>
                                {services.length >
                                0
                                  ? services.join(
                                      ', ',
                                    )
                                  : 'Beauty service'}
                              </p>

                              <div className="customer-beauty-record-meta">

                                <span>
                                  <Users
                                    size={13}
                                  />

                                  {formatCount(
                                    getBookingPersonCount(
                                      booking,
                                    ),
                                    'Person',
                                    'People',
                                  )}
                                </span>

                                <span>
                                  {formatCount(
                                    getBookingServiceCount(
                                      booking,
                                    ),
                                    'Service',
                                    'Services',
                                  )}
                                </span>

                                <span>
                                  {formatTime(
                                    booking.booking_time,
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>
                        )
                      },
                    )

                ) : (

                  <div className="customer-beauty-empty">
                    <Clock3 size={20} />

                    <strong>
                      No upcoming bookings
                    </strong>

                    <span>
                      Your next appointment will
                      appear here.
                    </span>
                  </div>

                )}

              </div>


              <Link
                to="/account/bookings/beauty"
                className="customer-beauty-sub-link"
              >
                View All Bookings
                <span>
                  →
                </span>
              </Link>

            </article>


            {/* UPCOMING ENQUIRIES */}

            <article className="customer-beauty-sub-card">

              <div className="customer-beauty-sub-card-header">

                <div className="customer-beauty-sub-card-title">

                  <MessageCircle
                    size={18}
                  />

                  <div>
                    <small>
                      COMMUNICATION
                    </small>

                    <h4>
                      Upcoming Enquiries
                    </h4>
                  </div>

                </div>

                <strong>
                  {upcomingEnquiries.length}
                </strong>

              </div>


              <div className="customer-beauty-sub-list">

                {upcomingEnquiries.length >
                0 ? (

                  upcomingEnquiries
                    .slice(
                      0,
                      4,
                    )
                    .map(
                      (
                        enquiry,
                      ) => {

                        const date =
                          getDateParts(
                            enquiry.preferred_date,
                          )

                        const services =
                          getEnquiryServices(
                            enquiry,
                          )

                        return (
                          <div
                            className="customer-beauty-record"
                            key={
                              enquiry.id
                            }
                          >

                            <div className="customer-beauty-record-date">

                              <strong>
                                {date.day}
                              </strong>

                              <span>
                                {date.month}
                              </span>

                            </div>


                            <div className="customer-beauty-record-content">

                              <h5>
                                {getEnquiryPersonName(
                                  enquiry,
                                )}
                              </h5>

                              <p>
                                {services.length >
                                0
                                  ? services.join(
                                      ', ',
                                    )
                                  : 'Beauty enquiry'}
                              </p>

                              <div className="customer-beauty-record-meta">

                                <span>
                                  <Users
                                    size={13}
                                  />

                                  {formatCount(
                                    getEnquiryPersonCount(
                                      enquiry,
                                    ),
                                    'Person',
                                    'People',
                                  )}
                                </span>

                                <span>
                                  {formatCount(
                                    getEnquiryServiceCount(
                                      enquiry,
                                    ),
                                    'Service',
                                    'Services',
                                  )}
                                </span>

                                <span>
                                  {formatTime(
                                    enquiry.preferred_time,
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>
                        )
                      },
                    )

                ) : (

                  <div className="customer-beauty-empty">
                    <MessageCircle size={20} />

                    <strong>
                      No active enquiries
                    </strong>

                    <span>
                      Your active enquiries will
                      appear here.
                    </span>
                  </div>

                )}

              </div>


              <Link
                to="/account/enquiries/beauty"
                className="customer-beauty-sub-link"
              >
                View All Enquiries
                <span>
                  →
                </span>
              </Link>

            </article>

          </div>


          {/* =================================================
              COMPLETED
          ================================================= */}

          <div className="customer-beauty-overview-column completed">

            <div className="customer-beauty-column-heading">

              <div>
                <small>
                  COMPLETED
                </small>

                <h3>
                  Finished activity
                </h3>
              </div>

              <span>
                {completedBookings.length +
                  completedEnquiries.length}
              </span>

            </div>


            {/* COMPLETED BOOKINGS */}

            <article className="customer-beauty-sub-card">

              <div className="customer-beauty-sub-card-header">

                <div className="customer-beauty-sub-card-title">

                  <CheckCircle2
                    size={18}
                  />

                  <div>
                    <small>
                      SERVICES
                    </small>

                    <h4>
                      Completed Services
                    </h4>
                  </div>

                </div>

                <strong>
                  {completedBookings.length}
                </strong>

              </div>


              <div className="customer-beauty-sub-list">

                {completedBookings.length >
                0 ? (

                  completedBookings
                    .slice(
                      0,
                      4,
                    )
                    .map(
                      (
                        booking,
                      ) => {

                        const date =
                          getDateParts(
                            booking.booking_date,
                          )

                        const services =
                          getBookingServices(
                            booking,
                          )

                        return (
                          <div
                            className="customer-beauty-record"
                            key={
                              booking.id
                            }
                          >

                            <div className="customer-beauty-record-date completed">

                              <strong>
                                {date.day}
                              </strong>

                              <span>
                                {date.month}
                              </span>

                            </div>


                            <div className="customer-beauty-record-content">

                              <h5>
                                {getBookingPersonName(
                                  booking,
                                )}
                              </h5>

                              <p>
                                {services.length >
                                0
                                  ? services.join(
                                      ', ',
                                    )
                                  : 'Beauty service'}
                              </p>

                              <div className="customer-beauty-record-meta">

                                <span>
                                  <Users
                                    size={13}
                                  />

                                  {formatCount(
                                    getBookingPersonCount(
                                      booking,
                                    ),
                                    'Person',
                                    'People',
                                  )}
                                </span>

                                <span>
                                  {formatCount(
                                    getBookingServiceCount(
                                      booking,
                                    ),
                                    'Service',
                                    'Services',
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>
                        )
                      },
                    )

                ) : (

                  <div className="customer-beauty-empty">
                    <CheckCircle2 size={20} />

                    <strong>
                      No completed services
                    </strong>

                    <span>
                      Completed appointments will
                      appear here.
                    </span>
                  </div>

                )}

              </div>


              <Link
                to="/account/bookings/beauty"
                className="customer-beauty-sub-link"
              >
                View Booking History
                <span>
                  →
                </span>
              </Link>

            </article>


            {/* COMPLETED ENQUIRIES */}

            <article className="customer-beauty-sub-card">

              <div className="customer-beauty-sub-card-header">

                <div className="customer-beauty-sub-card-title">

                  <CheckCircle2
                    size={18}
                  />

                  <div>
                    <small>
                      COMMUNICATION
                    </small>

                    <h4>
                      Completed Enquiries
                    </h4>
                  </div>

                </div>

                <strong>
                  {completedEnquiries.length}
                </strong>

              </div>


              <div className="customer-beauty-sub-list">

                {completedEnquiries.length >
                0 ? (

                  completedEnquiries
                    .slice(
                      0,
                      4,
                    )
                    .map(
                      (
                        enquiry,
                      ) => {

                        const date =
                          getDateParts(
                            enquiry.preferred_date,
                          )

                        const services =
                          getEnquiryServices(
                            enquiry,
                          )

                        return (
                          <div
                            className="customer-beauty-record"
                            key={
                              enquiry.id
                            }
                          >

                            <div className="customer-beauty-record-date completed">

                              <strong>
                                {date.day}
                              </strong>

                              <span>
                                {date.month}
                              </span>

                            </div>


                            <div className="customer-beauty-record-content">

                              <h5>
                                {getEnquiryPersonName(
                                  enquiry,
                                )}
                              </h5>

                              <p>
                                {services.length >
                                0
                                  ? services.join(
                                      ', ',
                                    )
                                  : 'Beauty enquiry'}
                              </p>

                              <div className="customer-beauty-record-meta">

                                <span>
                                  <Users
                                    size={13}
                                  />

                                  {formatCount(
                                    getEnquiryPersonCount(
                                      enquiry,
                                    ),
                                    'Person',
                                    'People',
                                  )}
                                </span>

                                <span>
                                  {formatCount(
                                    getEnquiryServiceCount(
                                      enquiry,
                                    ),
                                    'Service',
                                    'Services',
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>
                        )
                      },
                    )

                ) : (

                  <div className="customer-beauty-empty">
                    <CheckCircle2 size={20} />

                    <strong>
                      No completed enquiries
                    </strong>

                    <span>
                      Completed enquiries will
                      appear here.
                    </span>
                  </div>

                )}

              </div>


              <Link
                to="/account/enquiries/beauty"
                className="customer-beauty-sub-link"
              >
                View Enquiry History
                <span>
                  →
                </span>
              </Link>

            </article>

          </div>

        </div>

      </section>


      {/* ===================================================
          MONTHLY ACTIVITY
      =================================================== */}

      <section className="customer-beauty-monthly-card">

        <div className="customer-beauty-monthly-header">

          <div>

            <span>
              MONTHLY ACTIVITY
            </span>

            <h2>
              Activity by month
            </h2>

            <p>
              View your past, current, and upcoming
              beauty activity by month.
            </p>

          </div>


          <div className="customer-beauty-month-controls">

            <select
              value={
                selectedMonth
              }
              onChange={(
                event,
              ) =>
                setSelectedMonth(
                  event.target.value,
                )
              }
              aria-label="Select month"
            >

              {months.map(
                (
                  month,
                ) => (
                  <option
                    key={
                      month
                    }
                    value={
                      month
                    }
                  >
                    {getMonthLabel(
                      month,
                    )}
                  </option>
                ),
              )}

            </select>


            <Link
              to="/account/bookings/beauty"
              className="customer-beauty-month-view-all"
            >
              View All
              <span>
                →
              </span>
            </Link>

          </div>

        </div>


        <div className="customer-beauty-month-summary">

          <div>
            <CalendarDays size={18} />

            <span>
              Bookings
            </span>

            <strong>
              {monthlyBookingCount}
            </strong>
          </div>


          <div>
            <MessageCircle size={18} />

            <span>
              Enquiries
            </span>

            <strong>
              {monthlyEnquiryCount}
            </strong>
          </div>


          <div>
            <Users size={18} />

            <span>
              Total People
            </span>

            <strong>
              {
                monthlyBookings.reduce(
                  (
                    total,
                    booking,
                  ) =>
                    total +
                    getBookingPersonCount(
                      booking,
                    ),
                  0,
                ) +
                monthlyEnquiries.reduce(
                  (
                    total,
                    enquiry,
                  ) =>
                    total +
                    getEnquiryPersonCount(
                      enquiry,
                    ),
                  0,
                )
              }
            </strong>
          </div>

        </div>


        <div className="customer-beauty-month-grid">

          {/* MONTH BOOKINGS */}

          <article className="customer-beauty-month-sub-card">

            <div className="customer-beauty-month-sub-header">

              <div>
                <small>
                  BOOKINGS
                </small>

                <h3>
                  {getMonthLabel(
                    selectedMonth,
                  )}
                </h3>
              </div>

              <strong>
                {monthlyBookingCount}
              </strong>

            </div>


            <div className="customer-beauty-month-list">

              {monthlyBookings.length >
              0 ? (

                monthlyBookings
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    (
                      booking,
                    ) => {

                      const date =
                        getDateParts(
                          booking.booking_date,
                        )

                      const services =
                        getBookingServices(
                          booking,
                        )

                      const completed =
                        isCompletedBooking(
                          booking,
                        )

                      return (
                        <div
                          className="customer-beauty-month-record"
                          key={
                            booking.id
                          }
                        >

                          <div className="customer-beauty-month-date">

                            <strong>
                              {date.day}
                            </strong>

                            <span>
                              {date.month}
                            </span>

                          </div>


                          <div className="customer-beauty-month-info">

                            <strong>
                              {getBookingPersonName(
                                booking,
                              )}
                            </strong>

                            <span>
                              {services.length >
                              0
                                ? services.join(
                                    ', ',
                                  )
                                : 'Beauty service'}
                            </span>

                            <small>
                              {formatCount(
                                getBookingPersonCount(
                                  booking,
                                ),
                                'Person',
                                'People',
                              )}
                              {' • '}
                              {formatCount(
                                getBookingServiceCount(
                                  booking,
                                ),
                                'Service',
                                'Services',
                              )}
                              {' • '}
                              {formatTime(
                                booking.booking_time,
                              )}
                            </small>

                          </div>


                          <span
                            className={`customer-beauty-month-status ${
                              completed
                                ? 'completed'
                                : 'upcoming'
                            }`}
                          >
                            {completed
                              ? 'Completed'
                              : 'Upcoming'}
                          </span>

                        </div>
                      )
                    },
                  )

              ) : (

                <div className="customer-beauty-month-empty">
                  No bookings found for this month.
                </div>

              )}

            </div>

          </article>


          {/* MONTH ENQUIRIES */}

          <article className="customer-beauty-month-sub-card">

            <div className="customer-beauty-month-sub-header">

              <div>
                <small>
                  ENQUIRIES
                </small>

                <h3>
                  {getMonthLabel(
                    selectedMonth,
                  )}
                </h3>
              </div>

              <strong>
                {monthlyEnquiryCount}
              </strong>

            </div>


            <div className="customer-beauty-month-list">

              {monthlyEnquiries.length >
              0 ? (

                monthlyEnquiries
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    (
                      enquiry,
                    ) => {

                      const date =
                        getDateParts(
                          enquiry.preferred_date,
                        )

                      const services =
                        getEnquiryServices(
                          enquiry,
                        )

                      const completed =
                        isCompletedEnquiry(
                          enquiry,
                        )

                      return (
                        <div
                          className="customer-beauty-month-record"
                          key={
                            enquiry.id
                          }
                        >

                          <div className="customer-beauty-month-date">

                            <strong>
                              {date.day}
                            </strong>

                            <span>
                              {date.month}
                            </span>

                          </div>


                          <div className="customer-beauty-month-info">

                            <strong>
                              {getEnquiryPersonName(
                                enquiry,
                              )}
                            </strong>

                            <span>
                              {services.length >
                              0
                                ? services.join(
                                    ', ',
                                  )
                                : 'Beauty enquiry'}
                            </span>

                            <small>
                              {formatCount(
                                getEnquiryPersonCount(
                                  enquiry,
                                ),
                                'Person',
                                'People',
                              )}
                              {' • '}
                              {formatCount(
                                getEnquiryServiceCount(
                                  enquiry,
                                ),
                                'Service',
                                'Services',
                              )}
                              {' • '}
                              {formatTime(
                                enquiry.preferred_time,
                              )}
                            </small>

                          </div>


                          <span
                            className={`customer-beauty-month-status ${
                              completed
                                ? 'completed'
                                : 'upcoming'
                            }`}
                          >
                            {completed
                              ? 'Completed'
                              : 'Active'}
                          </span>

                        </div>
                      )
                    },
                  )

              ) : (

                <div className="customer-beauty-month-empty">
                  No enquiries found for this month.
                </div>

              )}

            </div>

          </article>

        </div>

      </section>


      {/* ===================================================
          RECENT ACTIVITIES
      =================================================== */}

      <section className="customer-beauty-recent-card">

        <div className="customer-beauty-recent-header">

          <div>

            <span>
              LATEST
            </span>

            <h2>
              Recent Activities
            </h2>

            <p>
              Your five most recent beauty activities.
            </p>

          </div>

          <span className="customer-beauty-recent-count">
            {activities.length}
            {' '}
            {activities.length === 1
              ? 'Activity'
              : 'Activities'}
          </span>

        </div>


        <div className="customer-beauty-activity-list">

          {activities.length >
          0 ? (

            activities.map(
              (
                activity,
                index,
              ) => (

                <article
                  className="customer-beauty-activity-item"
                  key={
                    activity.id
                  }
                >

                  <span className="customer-beauty-activity-number">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>


                  <span className="customer-beauty-activity-icon">

                    {activity.type ===
                    'booking' ? (
                      <CalendarDays
                        size={17}
                      />
                    ) : (
                      <MessageCircle
                        size={17}
                      />
                    )}

                  </span>


                  <div className="customer-beauty-activity-content">

                    <small>
                      {activity.type ===
                      'booking'
                        ? 'BOOKING'
                        : 'ENQUIRY'}
                    </small>

                    <h3>
                      {activity.title}
                    </h3>

                    <p>
                      {activity.description}
                    </p>

                  </div>


                  <time>
                    {formatDate(
                      activity.date.slice(
                        0,
                        10,
                      ),
                    )}
                  </time>

                </article>

              ),
            )

          ) : (

            <div className="customer-beauty-empty large">
              <Clock3 size={22} />

              <strong>
                No recent activity
              </strong>

              <span>
                Your latest beauty activity will
                appear here.
              </span>
            </div>

          )}

        </div>

      </section>


      {/* ===================================================
          BACK
      =================================================== */}

      <div className="customer-beauty-back">

        <Link to="/account">
          ← Back to Customer Dashboard
        </Link>

      </div>

    </main>
  )
}


export default CustomerBeautyDashboard