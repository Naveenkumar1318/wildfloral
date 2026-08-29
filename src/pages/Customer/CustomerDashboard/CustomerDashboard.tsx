import './CustomerDashboard.css'

function Dashboard() {
  return (
    <main className="customer-dashboard">
      <section className="customer-dashboard-welcome">
        <span className="customer-dashboard-eyebrow">
          WILDFLORAL
        </span>

        <h1>
          Welcome to your
          <span>account.</span>
        </h1>

        <p>
          Manage your appointments, bookings,
          and personal details from your
          WildFloral account.
        </p>
      </section>

      <section className="customer-dashboard-cards">
        <article className="customer-dashboard-card">
          <span className="customer-dashboard-card-number">
            01
          </span>

          <h2>
            My Bookings
          </h2>

          <p>
            View and manage your upcoming
            beauty and fashion appointments.
          </p>
        </article>

        <article className="customer-dashboard-card">
          <span className="customer-dashboard-card-number">
            02
          </span>

          <h2>
            Profile
          </h2>

          <p>
            Manage your personal information
            and account details.
          </p>
        </article>

        <article className="customer-dashboard-card">
          <span className="customer-dashboard-card-number">
            03
          </span>

          <h2>
            Need Help?
          </h2>

          <p>
            Contact WildFloral for assistance
            with your appointments or services.
          </p>
        </article>
      </section>
    </main>
  )
}

export default Dashboard