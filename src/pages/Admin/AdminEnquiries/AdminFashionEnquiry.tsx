import './AdminFashionEnquiry.css'

function AdminFashionEnquiry() {
  return (
    <main className="fashion-coming-soon-page">
      <section className="fashion-coming-soon-card">

        <div className="fashion-coming-soon-icon">
          ✦
        </div>

        <span className="fashion-coming-soon-badge">
          COMING SOON
        </span>

        <h1>
          Fashion Enquiries
        </h1>

        <p className="fashion-coming-soon-description">
          We are working on a dedicated fashion enquiry management
          system to help you manage customer enquiries, consultation
          requests, follow-ups, and fashion requirements.
        </p>

        <div className="fashion-coming-soon-features">

          <div className="fashion-coming-soon-feature">
            <span>01</span>

            <div>
              <strong>Customer Enquiries</strong>
              <p>
                Manage incoming fashion enquiries in one place.
              </p>
            </div>
          </div>

          <div className="fashion-coming-soon-feature">
            <span>02</span>

            <div>
              <strong>Consultation Requests</strong>
              <p>
                Track customers looking for personalized fashion
                consultations.
              </p>
            </div>
          </div>

          <div className="fashion-coming-soon-feature">
            <span>03</span>

            <div>
              <strong>Follow-ups</strong>
              <p>
                Keep track of enquiry status and customer follow-ups.
              </p>
            </div>
          </div>

        </div>

        <div className="fashion-coming-soon-footer">
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

export default AdminFashionEnquiry