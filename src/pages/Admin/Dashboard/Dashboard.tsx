import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../../lib/supabase'
import './Dashboard.css'

type DashboardBooking = {
  id: string
  customerName: string
  customerEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  status: string
  createdAt: string
}

type DashboardStats = {
  totalBookings: number
  pendingBookings: number
  activeServices: number
  customers: number
  todayBookings: number
  todayRevenue: number
  monthRevenue: number
}

const EMPTY_STATS: DashboardStats = {
  totalBookings: 0,
  pendingBookings: 0,
  activeServices: 0,
  customers: 0,
  todayBookings: 0,
  todayRevenue: 0,
  monthRevenue: 0,
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

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

function getTodayKey() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthStartKey() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

function getStatusClass(status: string) {
  return status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

function titleCaseStatus(status: string) {
  return status
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase()

  if (
    normalized.includes('cancel') ||
    normalized.includes('reject')
  ) {
    return 'negative'
  }

  if (
    normalized.includes('complete') ||
    normalized.includes('confirm') ||
    normalized.includes('approve')
  ) {
    return 'positive'
  }

  return 'pending'
}

function Dashboard() {
  const [stats, setStats] =
    useState<DashboardStats>(EMPTY_STATS)

  const [recentBookings, setRecentBookings] =
    useState<DashboardBooking[]>([])

  const [upcomingBookings, setUpcomingBookings] =
    useState<DashboardBooking[]>([])

  const [statusBreakdown, setStatusBreakdown] =
    useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todayKey = useMemo(getTodayKey, [])
  const monthStartKey = useMemo(getMonthStartKey, [])

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [
        bookingsResponse,
        servicesResponse,
        customersResponse,
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            id,
            customer_name,
            customer_email,
            booking_date,
            booking_time,
            price,
            status,
            created_at,
            services (
              name
            )
          `)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('services')
          .select('id, is_active', {
            count: 'exact',
          }),

        supabase
          .from('profiles')
          .select('id', {
            count: 'exact',
            head: true,
          }),
      ])

      if (bookingsResponse.error) {
        throw new Error(
          `Bookings: ${bookingsResponse.error.message}`,
        )
      }

      if (servicesResponse.error) {
        throw new Error(
          `Services: ${servicesResponse.error.message}`,
        )
      }

      if (customersResponse.error) {
        throw new Error(
          `Customers: ${customersResponse.error.message}`,
        )
      }

      const rows = (bookingsResponse.data ?? []) as Array<{
        id: string
        customer_name: string
        customer_email: string
        booking_date: string
        booking_time: string
        price: number
        status: string
        created_at: string
        services:
          | { name: string }
          | { name: string }[]
          | null
      }>

      const bookings = rows.map((row) => {
        const relatedService = Array.isArray(
          row.services,
        )
          ? row.services[0]
          : row.services

        return {
          id: row.id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          serviceName:
            relatedService?.name ?? 'Service unavailable',
          bookingDate: row.booking_date,
          bookingTime: row.booking_time,
          price: Number(row.price),
          status: row.status,
          createdAt: row.created_at,
        }
      })

      const todayBookings = bookings.filter(
        (booking) => booking.bookingDate === todayKey,
      )

      const monthBookings = bookings.filter(
        (booking) =>
          booking.bookingDate >= monthStartKey &&
          booking.bookingDate <= todayKey,
      )

      const upcoming = bookings
        .filter(
          (booking) =>
            booking.bookingDate >= todayKey &&
            !booking.status
              .toLowerCase()
              .includes('cancel'),
        )
        .sort((a, b) =>
          `${a.bookingDate} ${a.bookingTime}`.localeCompare(
            `${b.bookingDate} ${b.bookingTime}`,
          ),
        )
        .slice(0, 5)

      const breakdown: Record<string, number> = {}

      bookings.forEach((booking) => {
        const status = booking.status.toLowerCase()

        breakdown[status] =
          (breakdown[status] ?? 0) + 1
      })

      setRecentBookings(bookings.slice(0, 6))
      setUpcomingBookings(upcoming)
      setStatusBreakdown(breakdown)

      setStats({
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(
          (booking) =>
            booking.status.toLowerCase() === 'pending',
        ).length,
        activeServices: (
          servicesResponse.data ?? []
        ).filter(
          (service: { is_active: boolean }) =>
            service.is_active,
        ).length,
        customers: customersResponse.count ?? 0,
        todayBookings: todayBookings.length,
        todayRevenue: todayBookings.reduce(
          (total, booking) =>
            total + booking.price,
          0,
        ),
        monthRevenue: monthBookings.reduce(
          (total, booking) =>
            total + booking.price,
          0,
        ),
      })
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load dashboard data.',
      )
    } finally {
      setLoading(false)
    }
  }

  const maxStatusCount = Math.max(
    1,
    ...Object.values(statusBreakdown),
  )

  return (
    <main className="admin-dashboard">
      <div className="admin-dashboard-shell">
        <header className="admin-dashboard-hero">
          <div>
            <span className="admin-dashboard-eyebrow">
              WILDFLORAL · ADMINISTRATION
            </span>

            <h1>
              Good morning,
              <span>Admin.</span>
            </h1>

            <p>
              A clear view of today's appointments,
              catalogue activity, and business performance.
            </p>
          </div>

          <div className="admin-dashboard-hero-actions">
            <button
              type="button"
              className="admin-dashboard-refresh"
              onClick={() => void loadDashboard()}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <Link
              to="/"
              className="admin-dashboard-website"
            >
              View Website
            </Link>
          </div>
        </header>

        {error && (
          <div
            className="admin-dashboard-error"
            role="alert"
          >
            <strong>Dashboard data unavailable.</strong>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void loadDashboard()}
            >
              Try Again
            </button>
          </div>
        )}

        <section className="admin-dashboard-stat-grid">
          <article className="admin-dashboard-stat">
            <span>Total bookings</span>
            <strong>
              {loading ? '—' : stats.totalBookings}
            </strong>
            <small>
              All appointments in the system
            </small>
          </article>

          <article className="admin-dashboard-stat accent">
            <span>Pending</span>
            <strong>
              {loading ? '—' : stats.pendingBookings}
            </strong>
            <small>
              Appointments awaiting attention
            </small>
          </article>

          <article className="admin-dashboard-stat">
            <span>Customers</span>
            <strong>
              {loading ? '—' : stats.customers}
            </strong>
            <small>
              Profiles currently registered
            </small>
          </article>

          <article className="admin-dashboard-stat">
            <span>Active services</span>
            <strong>
              {loading ? '—' : stats.activeServices}
            </strong>
            <small>
              Experiences visible in catalogue
            </small>
          </article>
        </section>

        <section className="admin-dashboard-primary-grid">
          <article className="admin-dashboard-performance">
            <div className="admin-dashboard-section-head">
              <div>
                <span>BUSINESS PULSE</span>
                <h2>Appointments & revenue</h2>
              </div>

              <span className="admin-dashboard-period">
                Current month
              </span>
            </div>

            <div className="admin-dashboard-performance-grid">
              <div className="admin-dashboard-big-metric">
                <small>Month revenue</small>

                <strong>
                  {loading
                    ? '—'
                    : formatCurrency(
                        stats.monthRevenue,
                      )}
                </strong>

                <span>
                  Based on booking value
                </span>
              </div>

              <div className="admin-dashboard-big-metric">
                <small>Today's bookings</small>

                <strong>
                  {loading
                    ? '—'
                    : stats.todayBookings}
                </strong>

                <span>
                  Appointments scheduled today
                </span>
              </div>

              <div className="admin-dashboard-big-metric">
                <small>Today's value</small>

                <strong>
                  {loading
                    ? '—'
                    : formatCurrency(
                        stats.todayRevenue,
                      )}
                </strong>

                <span>
                  Booking value for today
                </span>
              </div>
            </div>

            <div className="admin-dashboard-status-chart">
              <div className="admin-dashboard-chart-head">
                <span>BOOKING STATUS</span>
                <span>
                  {stats.totalBookings} total
                </span>
              </div>

              {Object.keys(statusBreakdown).length ===
              0 ? (
                <div className="admin-dashboard-chart-empty">
                  No booking activity yet.
                </div>
              ) : (
                Object.entries(statusBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div
                      className="admin-dashboard-status-row"
                      key={status}
                    >
                      <div className="admin-dashboard-status-label">
                        <span
                          className={`admin-status-dot ${getStatusTone(
                            status,
                          )}`}
                        />

                        <span>
                          {titleCaseStatus(status)}
                        </span>
                      </div>

                      <div className="admin-dashboard-status-track">
                        <span
                          style={{
                            width: `${Math.max(
                              4,
                              (count /
                                maxStatusCount) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>

                      <strong>{count}</strong>
                    </div>
                  ))
              )}
            </div>
          </article>

          <aside className="admin-dashboard-quick-panel">
            <div className="admin-dashboard-section-head">
              <div>
                <span>SHORTCUTS</span>
                <h2>Quick actions</h2>
              </div>
            </div>

            <div className="admin-dashboard-actions">
              <Link
                to="/admin/services"
                className="admin-dashboard-action"
              >
                <span className="admin-action-icon">
                  +
                </span>

                <span>
                  <strong>
                    Manage services
                  </strong>

                  <small>
                    Add, edit or publish services
                  </small>
                </span>

                <b>→</b>
              </Link>

              <Link
                to="/admin/services"
                className="admin-dashboard-action"
              >
                <span className="admin-action-icon">
                  +
                </span>

                <span>
                  <strong>
                    Manage categories
                  </strong>

                  <small>
                    Organise your catalogue
                  </small>
                </span>

                <b>→</b>
              </Link>

              <Link
                to="/admin/bookings"
                className="admin-dashboard-action"
              >
                <span className="admin-action-icon">
                  →
                </span>

                <span>
                  <strong>
                    Review bookings
                  </strong>

                  <small>
                    Check appointments and status
                  </small>
                </span>

                <b>→</b>
              </Link>

              <Link
                to="/admin/portfolio"
                className="admin-dashboard-action"
              >
                <span className="admin-action-icon">
                  +
                </span>

                <span>
                  <strong>
                    Update portfolio
                  </strong>

                  <small>
                    Keep your work showcase fresh
                  </small>
                </span>

                <b>→</b>
              </Link>
            </div>
          </aside>
        </section>

        <section className="admin-dashboard-content-grid">
          <article className="admin-dashboard-list-panel">
            <div className="admin-dashboard-section-head">
              <div>
                <span>RECENT ACTIVITY</span>
                <h2>Latest bookings</h2>
              </div>

              <Link to="/admin/bookings">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="admin-dashboard-list-empty">
                Loading bookings...
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="admin-dashboard-list-empty">
                <strong>
                  No bookings yet
                </strong>

                <span>
                  New client appointments will appear here.
                </span>
              </div>
            ) : (
              <div className="admin-dashboard-booking-list">
                {recentBookings.map((booking) => (
                  <article
                    className="admin-dashboard-booking"
                    key={booking.id}
                  >
                    <div className="admin-dashboard-booking-avatar">
                      {booking.customerName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="admin-dashboard-booking-main">
                      <strong>
                        {booking.customerName}
                      </strong>

                      <span>
                        {booking.serviceName}
                      </span>
                    </div>

                    <div className="admin-dashboard-booking-date">
                      <strong>
                        {formatDate(
                          booking.bookingDate,
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          booking.bookingTime,
                        )}
                      </span>
                    </div>

                    <div className="admin-dashboard-booking-price">
                      <strong>
                        {formatCurrency(
                          booking.price,
                        )}
                      </strong>

                      <span
                        className={`admin-booking-status ${getStatusClass(
                          booking.status,
                        )}`}
                      >
                        {titleCaseStatus(
                          booking.status,
                        )}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="admin-dashboard-list-panel">
            <div className="admin-dashboard-section-head">
              <div>
                <span>UP NEXT</span>
                <h2>Upcoming appointments</h2>
              </div>
            </div>

            {loading ? (
              <div className="admin-dashboard-list-empty">
                Loading appointments...
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="admin-dashboard-list-empty">
                <strong>
                  Your schedule is clear.
                </strong>

                <span>
                  Upcoming appointments will appear here.
                </span>
              </div>
            ) : (
              <div className="admin-dashboard-upcoming-list">
                {upcomingBookings.map((booking) => (
                  <article
                    className="admin-dashboard-upcoming"
                    key={booking.id}
                  >
                    <div className="admin-dashboard-upcoming-time">
                      <strong>
                        {formatTime(
                          booking.bookingTime,
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          booking.bookingDate,
                        )}
                      </span>
                    </div>

                    <div className="admin-dashboard-upcoming-divider" />

                    <div className="admin-dashboard-upcoming-main">
                      <strong>
                        {booking.serviceName}
                      </strong>

                      <span>
                        {booking.customerName}
                      </span>
                    </div>

                    <span
                      className={`admin-booking-status ${getStatusClass(
                        booking.status,
                      )}`}
                    >
                      {titleCaseStatus(
                        booking.status,
                      )}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        <footer className="admin-dashboard-footer">
          <span>
            WILDFLORAL ADMINISTRATION
          </span>

          <span>
            Dashboard data is sourced from your current
            Supabase catalogue and bookings.
          </span>
        </footer>
      </div>
    </main>
  )
}

export default Dashboard