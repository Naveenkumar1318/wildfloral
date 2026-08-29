import { Link } from 'react-router'
import './AdminDashboard.css'

function AdminDashboard() {
  return (
    <main className="admin-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow">
            WILDFLORAL ADMINISTRATION
          </span>

          <h1>
            Welcome
            <span>back.</span>
          </h1>

          <p>
            Manage your beauty and fashion services,
            bookings, and customer experience from one place.
          </p>
        </div>

        <Link
          to="/"
          className="admin-dashboard-website-button"
        >
          View Website
        </Link>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="admin-dashboard-stats">

        <article className="admin-dashboard-stat-card">
          <span className="admin-dashboard-stat-label">
            TODAY
          </span>

          <strong>04</strong>

          <p>
            Upcoming appointments
          </p>
        </article>

        <article className="admin-dashboard-stat-card">
          <span className="admin-dashboard-stat-label">
            BOOKINGS
          </span>

          <strong>12</strong>

          <p>
            Total bookings
          </p>
        </article>

        <article className="admin-dashboard-stat-card">
          <span className="admin-dashboard-stat-label">
            PENDING
          </span>

          <strong>03</strong>

          <p>
            Awaiting confirmation
          </p>
        </article>

        <article className="admin-dashboard-stat-card">
          <span className="admin-dashboard-stat-label">
            CUSTOMERS
          </span>

          <strong>28</strong>

          <p>
            Registered customers
          </p>
        </article>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="admin-dashboard-section">

        <div className="admin-dashboard-section-heading">
          <div>
            <span className="admin-dashboard-eyebrow">
              QUICK ACTIONS
            </span>

            <h2>
              Manage your
              <span>studio.</span>
            </h2>
          </div>
        </div>

        <div className="admin-dashboard-actions">

          <Link
            to="/admin/services"
            className="admin-dashboard-action-card"
          >
            <span className="admin-dashboard-action-number">
              01
            </span>

            <div>
              <h3>
                Manage Services
              </h3>

              <p>
                Add, edit, and manage your beauty
                and fashion services.
              </p>
            </div>

            <span className="admin-dashboard-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/admin/bookings"
            className="admin-dashboard-action-card"
          >
            <span className="admin-dashboard-action-number">
              02
            </span>

            <div>
              <h3>
                Manage Bookings
              </h3>

              <p>
                Review upcoming appointments and
                booking requests.
              </p>
            </div>

            <span className="admin-dashboard-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/admin/customers"
            className="admin-dashboard-action-card"
          >
            <span className="admin-dashboard-action-number">
              03
            </span>

            <div>
              <h3>
                View Customers
              </h3>

              <p>
                View customer information and
                appointment history.
              </p>
            </div>

            <span className="admin-dashboard-action-arrow">
              →
            </span>
          </Link>

        </div>

      </section>

      {/* =====================================================
          UPCOMING APPOINTMENTS
      ===================================================== */}

      <section className="admin-dashboard-section">

        <div className="admin-dashboard-section-heading admin-dashboard-appointments-heading">
          <div>
            <span className="admin-dashboard-eyebrow">
              NEXT EXPERIENCE
            </span>

            <h2>
              Upcoming
              <span>appointments.</span>
            </h2>
          </div>

          <Link
            to="/admin/bookings"
            className="admin-dashboard-view-link"
          >
            View all bookings →
          </Link>
        </div>

        <div className="admin-dashboard-appointment-list">

          <article className="admin-dashboard-appointment">
            <div className="admin-dashboard-appointment-date">
              <strong>28</strong>
              <span>AUG</span>
            </div>

            <div className="admin-dashboard-appointment-info">
              <h3>
                Bridal Makeup
              </h3>

              <p>
                Customer appointment · 10:00 AM
              </p>
            </div>

            <span className="admin-dashboard-status confirmed">
              Confirmed
            </span>
          </article>

          <article className="admin-dashboard-appointment">
            <div className="admin-dashboard-appointment-date">
              <strong>29</strong>
              <span>AUG</span>
            </div>

            <div className="admin-dashboard-appointment-info">
              <h3>
                Hair Styling
              </h3>

              <p>
                Customer appointment · 02:30 PM
              </p>
            </div>

            <span className="admin-dashboard-status pending">
              Pending
            </span>
          </article>

          <article className="admin-dashboard-appointment">
            <div className="admin-dashboard-appointment-date">
              <strong>30</strong>
              <span>AUG</span>
            </div>

            <div className="admin-dashboard-appointment-info">
              <h3>
                Custom Fashion Design
              </h3>

              <p>
                Consultation · 11:00 AM
              </p>
            </div>

            <span className="admin-dashboard-status confirmed">
              Confirmed
            </span>
          </article>

        </div>

      </section>

    </main>
  )
}

export default AdminDashboard