import './AdminFashionOPCustomer.css'

function AdminFashionOPCustomer() {
  return (
    <main className="fashion-op-coming-soon-page">
      <section className="fashion-op-coming-soon-card">

        <div className="fashion-op-coming-soon-icon">
          ✦
        </div>

        <span className="fashion-op-coming-soon-badge">
          COMING SOON
        </span>

        <h1>
          Fashion OP Customers
        </h1>

        <p className="fashion-op-coming-soon-description">
          We are building a dedicated customer management system
          for fashion customers handled directly by the studio.
          Customer profiles, measurements, requirements, and
          fashion order history will be managed here.
        </p>

        <div className="fashion-op-coming-soon-features">

          <div className="fashion-op-coming-soon-feature">
            <span>01</span>

            <div>
              <strong>Customer Profiles</strong>
              <p>
                Manage customer information and fashion preferences.
              </p>
            </div>
          </div>

          <div className="fashion-op-coming-soon-feature">
            <span>02</span>

            <div>
              <strong>Measurements</strong>
              <p>
                Maintain customer measurements for personalized
                fashion services.
              </p>
            </div>
          </div>

          <div className="fashion-op-coming-soon-feature">
            <span>03</span>

            <div>
              <strong>Order History</strong>
              <p>
                View fashion orders and previous customer requirements.
              </p>
            </div>
          </div>

        </div>

        <div className="fashion-op-coming-soon-footer">
          <span></span>
          <p>
            This feature is currently under development.
          </p>
          <span></span>
        </div>

      </section>
    </main>
  )
}

export default AdminFashionOPCustomer