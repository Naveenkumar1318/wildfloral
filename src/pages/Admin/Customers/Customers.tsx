import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import { supabase } from '../../../lib/supabase'

import './Customers.css'

type Customer = {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  bookingCount: number
  totalSpend: number
  lastBookingDate: string | null
}

type CustomerBooking = {
  id: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  status: string
}

const ITEMS_PER_PAGE = 10

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
}

function formatDate(value: string | null) {
  if (!value) return 'No bookings'

  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  const [hours, minutes] = value
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()

  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function titleCaseStatus(status: string) {
  return status
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function getInitials(
  name: string,
  email: string,
) {
  const value =
    name.trim() || email.split('@')[0]

  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join('')
}

function getStatusClass(status: string) {
  return status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

function Customers() {
  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [roleFilter, setRoleFilter] =
    useState('customer')

  const [page, setPage] = useState(1)

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null)

  const [customerBookings, setCustomerBookings] =
    useState<CustomerBooking[]>([])

  const [loadingBookings, setLoadingBookings] =
    useState(false)

  useEffect(() => {
    void loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    setError('')

    try {
      const [
        profilesResponse,
        bookingsResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            `
              id,
              email,
              full_name,
              role,
              created_at
            `,
          )
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('bookings')
          .select(
            `
              id,
              customer_id,
              booking_date,
              booking_time,
              price,
              status,
              services (
                name
              )
            `,
          )
          .order('booking_date', {
            ascending: false,
          }),
      ])

      if (profilesResponse.error) {
        throw new Error(
          profilesResponse.error.message,
        )
      }

      if (bookingsResponse.error) {
        throw new Error(
          bookingsResponse.error.message,
        )
      }

      const bookingRows =
        (bookingsResponse.data ?? []) as Array<{
          id: string
          customer_id: string
          booking_date: string
          booking_time: string
          price: number
          status: string
          services:
            | { name: string }
            | { name: string }[]
            | null
        }>

      const customerMap =
        new Map<
          string,
          {
            count: number
            spend: number
            lastDate: string | null
          }
        >()

      bookingRows.forEach((booking) => {
        const current =
          customerMap.get(
            booking.customer_id,
          ) ?? {
            count: 0,
            spend: 0,
            lastDate: null,
          }

        current.count += 1
        current.spend += Number(
          booking.price,
        )

        if (
          !current.lastDate ||
          booking.booking_date >
            current.lastDate
        ) {
          current.lastDate =
            booking.booking_date
        }

        customerMap.set(
          booking.customer_id,
          current,
        )
      })

      const customerRows =
        (profilesResponse.data ?? [])
          .filter(
            (profile) =>
              profile.role === 'customer',
          )
          .map((profile) => {
            const stats =
              customerMap.get(profile.id)

            return {
              id: profile.id,
              email: profile.email ?? '',
              full_name:
                profile.full_name ||
                profile.email?.split('@')[0] ||
                'Customer',
              role: profile.role,
              created_at:
                profile.created_at,
              bookingCount:
                stats?.count ?? 0,
              totalSpend:
                stats?.spend ?? 0,
              lastBookingDate:
                stats?.lastDate ?? null,
            }
          })

      setCustomers(customerRows)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load customers.',
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.full_name
          .toLowerCase()
          .includes(query) ||
        customer.email
          .toLowerCase()
          .includes(query)

      const matchesRole =
        roleFilter === 'All' ||
        customer.role === roleFilter

      return (
        matchesSearch &&
        matchesRole
      )
    })
  }, [
    customers,
    search,
    roleFilter,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        ITEMS_PER_PAGE,
    ),
  )

  const visibleCustomers =
    filteredCustomers.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    )

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter])

  async function openCustomer(
    customer: Customer,
  ) {
    setSelectedCustomer(customer)
    setCustomerBookings([])
    setLoadingBookings(true)

    const { data, error: bookingError } =
      await supabase
        .from('bookings')
        .select(
          `
            id,
            booking_date,
            booking_time,
            price,
            status,
            services (
              name
            )
          `,
        )
        .eq('customer_id', customer.id)
        .order('booking_date', {
          ascending: false,
        })

    if (bookingError) {
      setError(bookingError.message)
      setLoadingBookings(false)
      return
    }

    const rows =
      (data ?? []) as Array<{
        id: string
        booking_date: string
        booking_time: string
        price: number
        status: string
        services:
          | { name: string }
          | { name: string }[]
          | null
      }>

    setCustomerBookings(
      rows.map((booking) => {
        const service =
          Array.isArray(
            booking.services,
          )
            ? booking.services[0]
            : booking.services

        return {
          id: booking.id,
          serviceName:
            service?.name ??
            'Service unavailable',
          bookingDate:
            booking.booking_date,
          bookingTime:
            booking.booking_time,
          price: Number(
            booking.price,
          ),
          status: booking.status,
        }
      }),
    )

    setLoadingBookings(false)
  }

  const totalRevenue = customers.reduce(
    (total, customer) =>
      total + customer.totalSpend,
    0,
  )

  const totalBookings = customers.reduce(
    (total, customer) =>
      total + customer.bookingCount,
    0,
  )

  return (
    <main className="admin-customers">
      <div className="admin-customers-shell">
        <header className="admin-customers-hero">
          <div>
            <span className="admin-customers-eyebrow">
              WILDFLORAL · ADMINISTRATION
            </span>

            <h1>
              Customers
              <span>Know your clients.</span>
            </h1>

            <p>
              View customer relationships,
              appointment history, and booking
              value from one place.
            </p>
          </div>

          <div className="admin-customers-actions">
            <Link
              to="/admin"
              className="admin-customers-back"
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() =>
                void loadCustomers()
              }
              disabled={loading}
            >
              {loading
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-customers-error">
            <strong>
              Customer data unavailable.
            </strong>

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="admin-customers-stats">
          <article>
            <span>Customers</span>
            <strong>
              {loading
                ? '—'
                : customers.length}
            </strong>
            <small>
              Registered customer profiles
            </small>
          </article>

          <article>
            <span>Bookings</span>
            <strong>
              {loading
                ? '—'
                : totalBookings}
            </strong>
            <small>
              Appointments across customers
            </small>
          </article>

          <article>
            <span>Customer value</span>
            <strong>
              {loading
                ? '—'
                : formatCurrency(
                    totalRevenue,
                  )}
            </strong>
            <small>
              Total booking value
            </small>
          </article>
        </section>

        <section className="admin-customers-panel">
          <div className="admin-customers-panel-head">
            <div>
              <span>CLIENT DIRECTORY</span>
              <h2>All customers</h2>
            </div>

            <span>
              {filteredCustomers.length} shown
            </span>
          </div>

          <div className="admin-customers-filters">
            <label>
              <span>Search customers</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by name or email..."
              />
            </label>

            <label>
              <span>Role</span>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value,
                  )
                }
              >
                <option value="customer">
                  Customers
                </option>

                <option value="All">
                  All profiles
                </option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="admin-customers-empty">
              <span>CLIENT DIRECTORY</span>
              <h3>
                Loading customer profiles.
              </h3>
            </div>
          ) : visibleCustomers.length ===
            0 ? (
            <div className="admin-customers-empty">
              <span>CLIENT DIRECTORY</span>

              <h3>
                No customers found.
              </h3>

              <p>
                Try another search or clear
                your filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('customer')
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="admin-customers-table-wrap">
                <table className="admin-customers-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Bookings</th>
                      <th>Total spend</th>
                      <th>Last booking</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {visibleCustomers.map(
                      (customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="admin-customer-person">
                              <div className="admin-customer-avatar">
                                {getInitials(
                                  customer.full_name,
                                  customer.email,
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    customer.full_name
                                  }
                                </strong>

                                <span>
                                  {
                                    customer.email
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {
                                customer.bookingCount
                              }
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                customer.totalSpend,
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="admin-customer-muted">
                              {formatDate(
                                customer.lastBookingDate,
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="admin-customer-muted">
                              {formatDate(
                                customer.created_at.split(
                                  'T',
                                )[0],
                              )}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-customer-view"
                              onClick={() =>
                                void openCustomer(
                                  customer,
                                )
                              }
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="admin-customers-pagination">
                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <div>
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                        )
                      }
                    >
                      ←
                    </button>

                    {Array.from(
                      {
                        length: totalPages,
                      },
                      (_, index) =>
                        index + 1,
                    ).map(
                      (pageNumber) => (
                        <button
                          type="button"
                          key={pageNumber}
                          className={
                            pageNumber ===
                            page
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            setPage(
                              pageNumber,
                            )
                          }
                        >
                          {pageNumber}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      disabled={
                        page ===
                        totalPages
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1,
                          ),
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selectedCustomer && (
        <div
          className="admin-customer-drawer-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedCustomer(null)
            }
          }}
        >
          <aside className="admin-customer-drawer">
            <header>
              <div>
                <span>CUSTOMER PROFILE</span>
                <h2>
                  Customer details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(null)
                }
              >
                ×
              </button>
            </header>

            <div className="admin-customer-profile">
              <div className="admin-customer-large-avatar">
                {getInitials(
                  selectedCustomer.full_name,
                  selectedCustomer.email,
                )}
              </div>

              <h3>
                {selectedCustomer.full_name}
              </h3>

              <p>
                {selectedCustomer.email}
              </p>
            </div>

            <div className="admin-customer-detail-stats">
              <article>
                <span>Bookings</span>
                <strong>
                  {
                    selectedCustomer.bookingCount
                  }
                </strong>
              </article>

              <article>
                <span>Total spend</span>
                <strong>
                  {formatCurrency(
                    selectedCustomer.totalSpend,
                  )}
                </strong>
              </article>

              <article>
                <span>Last booking</span>
                <strong>
                  {formatDate(
                    selectedCustomer.lastBookingDate,
                  )}
                </strong>
              </article>
            </div>

            <section className="admin-customer-history">
              <div className="admin-customer-history-head">
                <span>BOOKING HISTORY</span>
                <strong>
                  {
                    customerBookings.length
                  } appointments
                </strong>
              </div>

              {loadingBookings ? (
                <div className="admin-customer-history-empty">
                  Loading booking history...
                </div>
              ) : customerBookings.length ===
                0 ? (
                <div className="admin-customer-history-empty">
                  <strong>
                    No bookings yet.
                  </strong>

                  <span>
                    This customer has not
                    booked a service.
                  </span>
                </div>
              ) : (
                <div className="admin-customer-history-list">
                  {customerBookings.map(
                    (booking) => (
                      <article
                        key={booking.id}
                      >
                        <div>
                          <strong>
                            {
                              booking.serviceName
                            }
                          </strong>

                          <span>
                            {formatDate(
                              booking.bookingDate,
                            )}{' '}
                            ·{' '}
                            {formatTime(
                              booking.bookingTime,
                            )}
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatCurrency(
                              booking.price,
                            )}
                          </strong>

                          <span
                            className={`admin-customer-status ${getStatusClass(
                              booking.status,
                            )}`}
                          >
                            {titleCaseStatus(
                              booking.status,
                            )}
                          </span>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Customers