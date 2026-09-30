import React from 'react'
import { MapPin, Clock, Phone, Sparkles, Scissors } from 'lucide-react'
import './BusinessAtAGlance.css'

export const BusinessAtAGlance: React.FC = () => {
  return (
    <section className="wf-glance-section" aria-labelledby="wf-glance-title">
      <div className="wf-glance-container">
        <div className="wf-glance-header">
          <div className="wf-glance-badge">
            <Sparkles size={14} />
            <span>AT A GLANCE</span>
          </div>
          <h2 id="wf-glance-title" className="wf-glance-title">
            WildFloral Studio Overview
          </h2>
          <p className="wf-glance-subtitle">
            Essential facts about our luxury beauty sanctum and haute fashion atelier in Hosur.
          </p>
        </div>

        <div className="wf-glance-grid">
          {/* Card 1: Business Type & Services */}
          <div className="wf-glance-card">
            <div className="wf-glance-icon-wrap">
              <Scissors size={20} />
            </div>
            <div className="wf-glance-content">
              <span className="wf-glance-label">STUDIO ESSENCE</span>
              <h3 className="wf-glance-value">Beauty &amp; Fashion Destination</h3>
              <p className="wf-glance-detail">
                Bridal makeup, hair therapy, facial treatments, bespoke haute couture, and elevated doorstep experiences.
              </p>
            </div>
          </div>

          {/* Card 2: Location */}
          <div className="wf-glance-card">
            <div className="wf-glance-icon-wrap">
              <MapPin size={20} />
            </div>
            <div className="wf-glance-content">
              <span className="wf-glance-label">LOCATION</span>
              <h3 className="wf-glance-value">Hosur, Tamil Nadu</h3>
              <p className="wf-glance-detail">
                3-1/2, Neela Mega Nagar, 1st Cross, Hosur, Tamil Nadu, 635109, India.
              </p>
            </div>
          </div>

          {/* Card 3: Operating Hours */}
          <div className="wf-glance-card">
            <div className="wf-glance-icon-wrap">
              <Clock size={20} />
            </div>
            <div className="wf-glance-content">
              <span className="wf-glance-label">HOURS</span>
              <h3 className="wf-glance-value">Mon – Sun: 09:00 – 21:00</h3>
              <p className="wf-glance-detail">
                Open 7 days a week from 9:00 AM to 9:00 PM. Walk-ins &amp; prior reservations welcomed.
              </p>
            </div>
          </div>

          {/* Card 4: Booking & Contact */}
          <div className="wf-glance-card">
            <div className="wf-glance-icon-wrap">
              <Phone size={20} />
            </div>
            <div className="wf-glance-content">
              <span className="wf-glance-label">DIRECT CONTACT &amp; BOOKING</span>
              <h3 className="wf-glance-value">+91 8838894677</h3>
              <p className="wf-glance-detail">
                Direct phone, WhatsApp consultations, and instant online appointment scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
