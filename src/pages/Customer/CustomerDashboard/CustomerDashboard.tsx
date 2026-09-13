import { Link } from 'react-router-dom'
import beautyImage from '../../../assets/wildfloral/beauty.png'
import fashionImage from '../../../assets/wildfloral/fashion.png'
import './CustomerDashboard.css'

function CustomerDashboard() {
  return (
    <main className="customer-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="customer-dashboard-header">

        <div className="customer-dashboard-header-content">

          <span className="customer-dashboard-eyebrow">
            WILDFLORAL
          </span>

          <h1>
            Your personal
            <span>experience.</span>
          </h1>

        </div>

        <p className="customer-dashboard-header-description">
          Choose your experience and manage everything
          from one place.
        </p>

      </section>


      {/* =====================================================
          EXPERIENCE CARDS
      ===================================================== */}

      <section className="customer-dashboard-experiences">

        {/* =================================================
            BEAUTY CARD
        ================================================= */}

        <Link
          to="/customer/beauty"
          className="customer-experience-card"
        >

          <div className="customer-experience-image-wrapper">

            <img
              src={beautyImage}
              alt="WildFloral beauty services"
              className="customer-experience-image"
            />

          </div>

          <div className="customer-experience-overlay"></div>


          {/* TOP */}

          <div className="customer-experience-top">

            <span className="customer-experience-number">
              01
            </span>

            <span className="customer-experience-label">
              BEAUTY
            </span>

          </div>


          {/* CENTER */}

          <div className="customer-experience-center">

            <span className="customer-experience-category">
              CUSTOMER AREA
            </span>

            <h2>
              Beauty
            </h2>

            <p>
              Services & Appointments
            </p>

          </div>


          {/* BOTTOM */}

          <div className="customer-experience-bottom">

            <span>
              Explore beauty
            </span>

            <span className="customer-experience-arrow">
              →
            </span>

          </div>

        </Link>


        {/* =================================================
            FASHION CARD
        ================================================= */}

        <Link
          to="/customer/fashion"
          className="customer-experience-card"
        >

          <div className="customer-experience-image-wrapper">

            <img
              src={fashionImage}
              alt="WildFloral fashion design services"
              className="customer-experience-image"
            />

          </div>

          <div className="customer-experience-overlay"></div>


          {/* TOP */}

          <div className="customer-experience-top">

            <span className="customer-experience-number">
              02
            </span>

            <span className="customer-experience-label">
              FASHION
            </span>

          </div>


          {/* CENTER */}

          <div className="customer-experience-center">

            <span className="customer-experience-category">
              CUSTOMER AREA
            </span>

            <h2>
              Fashion
            </h2>

            <p>
              Designs & Orders
            </p>

          </div>


          {/* BOTTOM */}

          <div className="customer-experience-bottom">

            <span>
              Explore fashion
            </span>

            <span className="customer-experience-arrow">
              →
            </span>

          </div>

        </Link>

      </section>

    </main>
  )
}

export default CustomerDashboard