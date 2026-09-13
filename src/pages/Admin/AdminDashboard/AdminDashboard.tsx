import { Link } from 'react-router-dom'

import beautyImage from '../../../assets/wildfloral/beauty.png'
import fashionImage from '../../../assets/wildfloral/fashion.png'

import './AdminDashboard.css'

function AdminDashboard() {
  return (
    <main className="admin-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="admin-dashboard-header">

        <div className="admin-dashboard-header-content">

          <span className="admin-dashboard-eyebrow">
            WILDFLORAL
          </span>

          <h1>
            Manage your
            <span>business.</span>
          </h1>

        </div>

        <p className="admin-dashboard-intro">
          Select an area to manage bookings, enquiries,
          services, customers, and business activity.
        </p>

      </section>


      {/* =====================================================
          ADMIN AREAS
      ===================================================== */}

      <section className="admin-dashboard-areas">

        {/* =================================================
            BEAUTY
        ================================================= */}

        <Link
          to="/admin/beauty"
          className="admin-area-card"
        >

          <div className="admin-area-image-wrapper">

            <img
              src={beautyImage}
              alt="Beauty administration"
              className="admin-area-image"
            />

            <div className="admin-area-image-overlay" />

          </div>


          {/* TOP */}

          <div className="admin-area-top">

            <span className="admin-area-number">
              01
            </span>

            <span className="admin-area-category">
              BEAUTY
            </span>

          </div>


          {/* BOTTOM */}

          <div className="admin-area-bottom">

            <div className="admin-area-content">

              <span className="admin-area-eyebrow">
                ADMIN AREA
              </span>

              <h2>
                Beauty
              </h2>

              <p>
                Manage beauty services, bookings,
                enquiries, offers, and customers.
              </p>

            </div>


            <span className="admin-area-arrow">
              →
            </span>

          </div>

        </Link>


        {/* =================================================
            FASHION
        ================================================= */}

        <Link
          to="/admin/fashion"
          className="admin-area-card"
        >

          <div className="admin-area-image-wrapper">

            <img
              src={fashionImage}
              alt="Fashion administration"
              className="admin-area-image"
            />

            <div className="admin-area-image-overlay" />

          </div>


          {/* TOP */}

          <div className="admin-area-top">

            <span className="admin-area-number">
              02
            </span>

            <span className="admin-area-category">
              FASHION
            </span>

          </div>


          {/* BOTTOM */}

          <div className="admin-area-bottom">

            <div className="admin-area-content">

              <span className="admin-area-eyebrow">
                ADMIN AREA
              </span>

              <h2>
                Fashion
              </h2>

              <p>
                Manage fashion designs, orders,
                enquiries, measurements, and activity.
              </p>

            </div>


            <span className="admin-area-arrow">
              →
            </span>

          </div>

        </Link>

      </section>

    </main>
  )
}

export default AdminDashboard