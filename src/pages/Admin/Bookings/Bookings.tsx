import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Search,
  CalendarDays,
  Clock3,
  UserRound,
  Mail,
  Phone,
  X,
  Check,
  XCircle,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'

import { supabase } from '../../../lib/supabase'

import './Bookings.css'


type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'


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

  status: BookingStatus

  created_at: string

  service?: {
    id: string
    name: string
    category: string | null
    image_url: string | null
  } | null
}


type StatusFilter =
  | 'all'
  | BookingStatus


function formatDate(
  value: string,
) {
  if (!value) {
    return '-'
  }

  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}


function formatTime(
  value: string,
) {
  if (!value) {
    return '-'
  }

  const [
    hourString,
    minute,
  ] = value.split(':')

  const hour =
    Number(hourString)

  const suffix =
    hour >= 12 ? 'PM' : 'AM'

  const displayHour =
    hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}


function formatPrice(
  value: number,
) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
  )}`
}


function getStatusLabel(
  status: BookingStatus,
) {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'

    case 'completed':
      return 'Completed'

    case 'cancelled':
      return 'Cancelled'

    default:
      return 'Pending'
  }
}


function Bookings() {
  const [
    bookings,
    setBookings,
  ] = useState<Booking[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>('all')

  const [
    dateFilter,
    setDateFilter,
  ] = useState('')

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState<Booking | null>(null)

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null,
  )


  useEffect(() => {
    void loadBookings()
  }, [])


  async function loadBookings(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    const {
      data,
      error: bookingsError,
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
          created_at,
          service:services (
            id,
            name,
            category,
            image_url
          )
        `,
      )
      .order(
        'booking_date',
        {
          ascending: true,
        },
      )
      .order(
        'booking_time',
        {
          ascending: true,
        },
      )


    if (bookingsError) {
      setError(
        bookingsError.message ||
          'Unable to load bookings.',
      )

      setBookings([])

      setLoading(false)

      setRefreshing(false)

      return
    }


    const normalizedBookings =
      (data || []).map(
        (item: any) => ({
          ...item,

          price: Number(
            item.price || 0,
          ),

          service:
            Array.isArray(
              item.service,
            )
              ? item.service[0] ||
                null
              : item.service ||
                null,
        }),
      ) as Booking[]


    setBookings(
      normalizedBookings,
    )

    setLoading(false)

    setRefreshing(false)
  }


  const filteredBookings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()


      return bookings.filter(
        (booking) => {
          const matchesSearch =
            !query ||
            booking.customer_name
              .toLowerCase()
              .includes(query) ||
            booking.customer_email
              .toLowerCase()
              .includes(query) ||
            (
              booking.customer_phone ||
              ''
            )
              .toLowerCase()
              .includes(query) ||
            (
              booking.service
                ?.name || ''
            )
              .toLowerCase()
              .includes(query)


          const matchesStatus =
            statusFilter === 'all' ||
            booking.status ===
              statusFilter


          const matchesDate =
            !dateFilter ||
            booking.booking_date ===
              dateFilter


          return (
            matchesSearch &&
            matchesStatus &&
            matchesDate
          )
        },
      )
    }, [
      bookings,
      search,
      statusFilter,
      dateFilter,
    ])


  const statistics =
    useMemo(() => {
      const pending =
        bookings.filter(
          (booking) =>
            booking.status ===
            'pending',
        ).length


      const confirmed =
        bookings.filter(
          (booking) =>
            booking.status ===
            'confirmed',
        ).length


      const completed =
        bookings.filter(
          (booking) =>
            booking.status ===
            'completed',
        ).length


      const revenue =
        bookings
          .filter(
            (booking) =>
              booking.status ===
              'completed',
          )
          .reduce(
            (
              total,
              booking,
            ) =>
              total +
              Number(
                booking.price || 0,
              ),
            0,
          )


      return {
        total: bookings.length,
        pending,
        confirmed,
        completed,
        revenue,
      }
    }, [bookings])


  async function updateStatus(
    bookingId: string,
    status: BookingStatus,
  ) {
    setUpdatingId(bookingId)

    setError('')


    const {
      error: updateError,
    } = await supabase
      .from('bookings')
      .update({
        status,
      })
      .eq('id', bookingId)


    if (updateError) {
      setError(
        updateError.message ||
          'Unable to update booking.',
      )

      setUpdatingId(null)

      return
    }


    setBookings(
      (current) =>
        current.map(
          (booking) =>
            booking.id ===
            bookingId
              ? {
                  ...booking,
                  status,
                }
              : booking,
        ),
    )


    setSelectedBooking(
      (current) =>
        current &&
        current.id ===
          bookingId
          ? {
              ...current,
              status,
            }
          : current,
    )


    setUpdatingId(null)
  }


  async function deleteBooking(
    bookingId: string,
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this booking?',
      )


    if (!confirmed) {
      return
    }


    setUpdatingId(bookingId)

    setError('')


    const {
      error: deleteError,
    } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)


    if (deleteError) {
      setError(
        deleteError.message ||
          'Unable to delete booking.',
      )

      setUpdatingId(null)

      return
    }


    setBookings(
      (current) =>
        current.filter(
          (booking) =>
            booking.id !==
            bookingId,
        ),
    )


    if (
      selectedBooking?.id ===
      bookingId
    ) {
      setSelectedBooking(null)
    }


    setUpdatingId(null)
  }


  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setDateFilter('')
  }


  const hasFilters =
    Boolean(
      search ||
        dateFilter ||
        statusFilter !==
          'all',
    )


  return (
    <main className="admin-bookings">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="admin-bookings-header">

        <div>

          <span className="admin-bookings-eyebrow">
            APPOINTMENTS
          </span>

          <h1>
            Bookings
          </h1>

          <p>
            Manage appointments and
            customer requests.
          </p>

        </div>


        <button
          type="button"
          className="admin-bookings-refresh"
          onClick={() =>
            void loadBookings(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? 'spinning'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing'
            : 'Refresh'}
        </button>

      </header>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="admin-bookings-stats">

        <article className="admin-booking-stat">

          <span className="admin-booking-stat-icon">
            <CalendarDays
              size={20}
            />
          </span>

          <div>
            <span>
              Total Bookings
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>

        </article>


        <article className="admin-booking-stat">

          <span className="admin-booking-stat-icon pending">
            <Clock3
              size={20}
            />
          </span>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {statistics.pending}
            </strong>
          </div>

        </article>


        <article className="admin-booking-stat">

          <span className="admin-booking-stat-icon confirmed">
            <Check
              size={20}
            />
          </span>

          <div>
            <span>
              Confirmed
            </span>

            <strong>
              {statistics.confirmed}
            </strong>
          </div>

        </article>


        <article className="admin-booking-stat">

          <span className="admin-booking-stat-icon completed">
            <Check
              size={20}
            />
          </span>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {statistics.completed}
            </strong>
          </div>

        </article>


        <article className="admin-booking-stat revenue">

          <span className="admin-booking-stat-icon">
            ₹
          </span>

          <div>
            <span>
              Completed Revenue
            </span>

            <strong>
              {formatPrice(
                statistics.revenue,
              )}
            </strong>
          </div>

        </article>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="admin-bookings-error"
          role="alert"
        >
          <XCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            aria-label="Close error"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <section className="admin-bookings-toolbar">

        <div className="admin-bookings-search">

          <Search
            size={18}
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search customer or service..."
            aria-label="Search bookings"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch('')
              }
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

        </div>


        <div className="admin-bookings-filter">

          <span>
            Status
          </span>

          <div className="admin-select-wrap">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
            >
              <option value="all">
                All bookings
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <ChevronDown
              size={16}
            />

          </div>

        </div>


        <div className="admin-bookings-filter">

          <span>
            Date
          </span>

          <div className="admin-date-wrap">

            <CalendarDays
              size={16}
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        {hasFilters && (
          <button
            type="button"
            className="admin-clear-filters"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>
        )}

      </section>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="admin-bookings-card">

        <div className="admin-bookings-card-header">

          <div>

            <h2>
              Appointment Requests
            </h2>

            <span>
              {filteredBookings.length}{' '}
              booking
              {filteredBookings.length !==
              1
                ? 's'
                : ''}
            </span>

          </div>

        </div>


        {loading ? (
          <div className="admin-bookings-loading">

            <div className="admin-bookings-spinner" />

            <span>
              Loading bookings...
            </span>

          </div>
        ) : filteredBookings.length ===
          0 ? (
          <div className="admin-bookings-empty">

            <div className="admin-bookings-empty-icon">
              <CalendarDays
                size={25}
              />
            </div>

            <h3>
              No bookings found
            </h3>

            <p>
              {hasFilters
                ? 'Try changing your filters or search.'
                : 'New appointment requests will appear here.'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
              >
                Clear filters
              </button>
            )}

          </div>
        ) : (
          <div className="admin-bookings-table-wrap">

            <table className="admin-bookings-table">

              <thead>

                <tr>

                  <th>
                    Customer
                  </th>

                  <th>
                    Service
                  </th>

                  <th>
                    Appointment
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredBookings.map(
                  (booking) => (
                    <tr
                      key={
                        booking.id
                      }
                    >

                      {/* CUSTOMER */}

                      <td>

                        <button
                          type="button"
                          className="admin-booking-customer"
                          onClick={() =>
                            setSelectedBooking(
                              booking,
                            )
                          }
                        >

                          <span className="admin-customer-avatar">
                            {booking.customer_name
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                          </span>

                          <span>

                            <strong>
                              {
                                booking.customer_name
                              }
                            </strong>

                            <small>
                              {
                                booking.customer_email
                              }
                            </small>

                          </span>

                        </button>

                      </td>


                      {/* SERVICE */}

                      <td>

                        <div className="admin-booking-service">

                          <div className="admin-booking-service-image">

                            {booking
                              .service
                              ?.image_url ? (
                              <img
                                src={
                                  booking
                                    .service
                                    .image_url
                                }
                                alt=""
                              />
                            ) : (
                              <CalendarDays
                                size={17}
                              />
                            )}

                          </div>

                          <div>

                            <strong>
                              {
                                booking
                                  .service
                                  ?.name
                              }
                            </strong>

                            <span>
                              {
                                booking
                                  .service
                                  ?.category ||
                                'Service'
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* APPOINTMENT */}

                      <td>

                        <div className="admin-booking-date">

                          <strong>
                            {formatDate(
                              booking.booking_date,
                            )}
                          </strong>

                          <span>
                            <Clock3
                              size={14}
                            />

                            {formatTime(
                              booking.booking_time,
                            )}
                          </span>

                        </div>

                      </td>


                      {/* PRICE */}

                      <td>

                        <strong className="admin-booking-price">
                          {formatPrice(
                            booking.price,
                          )}
                        </strong>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`admin-booking-status ${booking.status}`}
                        >
                          <i />

                          {getStatusLabel(
                            booking.status,
                          )}
                        </span>

                      </td>


                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-view-booking"
                          onClick={() =>
                            setSelectedBooking(
                              booking,
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* =====================================================
          DETAIL DRAWER
      ===================================================== */}

      {selectedBooking && (
        <div
          className="admin-booking-modal-backdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedBooking(
                null,
              )
            }
          }}
        >

          <aside className="admin-booking-drawer">

            <div className="admin-booking-drawer-header">

              <div>

                <span>
                  BOOKING DETAILS
                </span>

                <h2>
                  Appointment
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null,
                  )
                }
                aria-label="Close booking details"
              >
                <X size={20} />
              </button>

            </div>


            <div className="admin-booking-drawer-body">

              {/* SERVICE */}

              <div className="admin-detail-service">

                <div className="admin-detail-service-image">

                  {selectedBooking
                    .service
                    ?.image_url ? (
                    <img
                      src={
                        selectedBooking
                          .service
                          .image_url
                      }
                      alt=""
                    />
                  ) : (
                    <CalendarDays
                      size={25}
                    />
                  )}

                </div>

                <div>

                  <span>
                    {
                      selectedBooking
                        .service
                        ?.category ||
                      'SERVICE'
                    }
                  </span>

                  <h3>
                    {
                      selectedBooking
                        .service
                        ?.name ||
                      'Selected Service'
                    }
                  </h3>

                </div>

              </div>


              {/* APPOINTMENT */}

              <div className="admin-detail-section">

                <span className="admin-detail-label">
                  APPOINTMENT
                </span>

                <div className="admin-detail-grid">

                  <div>

                    <CalendarDays
                      size={17}
                    />

                    <span>
                      <small>
                        Date
                      </small>

                      <strong>
                        {formatDate(
                          selectedBooking.booking_date,
                        )}
                      </strong>
                    </span>

                  </div>


                  <div>

                    <Clock3
                      size={17}
                    />

                    <span>
                      <small>
                        Time
                      </small>

                      <strong>
                        {formatTime(
                          selectedBooking.booking_time,
                        )}
                      </strong>
                    </span>

                  </div>

                </div>

              </div>


              {/* CUSTOMER */}

              <div className="admin-detail-section">

                <span className="admin-detail-label">
                  CUSTOMER
                </span>

                <div className="admin-detail-contact">

                  <div>
                    <UserRound
                      size={17}
                    />

                    <span>
                      {
                        selectedBooking.customer_name
                      }
                    </span>
                  </div>


                  <div>
                    <Mail
                      size={17}
                    />

                    <span>
                      {
                        selectedBooking.customer_email
                      }
                    </span>
                  </div>


                  {selectedBooking.customer_phone && (
                    <div>
                      <Phone
                        size={17}
                      />

                      <span>
                        {
                          selectedBooking.customer_phone
                        }
                      </span>
                    </div>
                  )}

                </div>

              </div>


              {/* NOTES */}

              {selectedBooking.notes && (
                <div className="admin-detail-section">

                  <span className="admin-detail-label">
                    CUSTOMER NOTES
                  </span>

                  <p className="admin-detail-notes">
                    {
                      selectedBooking.notes
                    }
                  </p>

                </div>
              )}


              {/* PRICE */}

              <div className="admin-detail-total">

                <span>
                  Total Amount
                </span>

                <strong>
                  {formatPrice(
                    selectedBooking.price,
                  )}
                </strong>

              </div>


              {/* STATUS */}

              <div className="admin-detail-section">

                <span className="admin-detail-label">
                  UPDATE STATUS
                </span>

                <div className="admin-status-actions">

                  <button
                    type="button"
                    className={
                      selectedBooking.status ===
                      'pending'
                        ? 'active pending'
                        : 'pending'
                    }
                    disabled={
                      updatingId ===
                      selectedBooking.id
                    }
                    onClick={() =>
                      void updateStatus(
                        selectedBooking.id,
                        'pending',
                      )
                    }
                  >
                    Pending
                  </button>


                  <button
                    type="button"
                    className={
                      selectedBooking.status ===
                      'confirmed'
                        ? 'active confirmed'
                        : 'confirmed'
                    }
                    disabled={
                      updatingId ===
                      selectedBooking.id
                    }
                    onClick={() =>
                      void updateStatus(
                        selectedBooking.id,
                        'confirmed',
                      )
                    }
                  >
                    Confirm
                  </button>


                  <button
                    type="button"
                    className={
                      selectedBooking.status ===
                      'completed'
                        ? 'active completed'
                        : 'completed'
                    }
                    disabled={
                      updatingId ===
                      selectedBooking.id
                    }
                    onClick={() =>
                      void updateStatus(
                        selectedBooking.id,
                        'completed',
                      )
                    }
                  >
                    Complete
                  </button>


                  <button
                    type="button"
                    className={
                      selectedBooking.status ===
                      'cancelled'
                        ? 'active cancelled'
                        : 'cancelled'
                    }
                    disabled={
                      updatingId ===
                      selectedBooking.id
                    }
                    onClick={() =>
                      void updateStatus(
                        selectedBooking.id,
                        'cancelled',
                      )
                    }
                  >
                    Cancel
                  </button>

                </div>

              </div>

            </div>


            <div className="admin-booking-drawer-footer">

              <button
                type="button"
                className="admin-delete-booking"
                disabled={
                  updatingId ===
                  selectedBooking.id
                }
                onClick={() =>
                  void deleteBooking(
                    selectedBooking.id,
                  )
                }
              >
                Delete Booking
              </button>


              <button
                type="button"
                className="admin-close-booking"
                onClick={() =>
                  setSelectedBooking(
                    null,
                  )
                }
              >
                Close
              </button>

            </div>

          </aside>

        </div>
      )}

    </main>
  )
}


export default Bookings