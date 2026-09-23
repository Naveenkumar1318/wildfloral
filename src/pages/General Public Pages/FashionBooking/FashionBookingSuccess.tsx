import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clearFashionCart } from '../../../lib/fashionCart'
import './FashionBookingSuccess.css'

function FashionBookingSuccess() {
  const { orderId } = useParams<{ orderId: string }>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    clearFashionCart()
  }, [])

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' • ' + new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  function handleCopyOrderId() {
    if (!orderId) return
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="fashion-booking-success-page">
      <section className="fashion-success-screen">
        {/* TOP CELEBRATION GRAPHIC */}
        <div className="fashion-success-hero-graphic">
          <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="35" r="4" fill="#F59E0B" />
            <rect x="145" y="25" width="8" height="8" rx="2" fill="#8B5CF6" transform="rotate(25 145 25)" />
            <rect x="35" y="85" width="7" height="7" rx="1.5" fill="#3B82F6" transform="rotate(-15 35 85)" />
            <circle cx="155" cy="75" r="3.5" fill="#10B981" />
            <polygon points="80,10 84,18 76,18" fill="#EC4899" />
            <polygon points="105,15 110,22 101,23" fill="#F59E0B" />
            <rect x="130" y="105" width="6" height="6" rx="1" fill="#3B82F6" />

            <path d="M90 25C90 25 125 32 125 65C125 95 90 115 90 115C90 115 55 95 55 65C55 32 90 25 90 25Z" fill="#10B981" />
            <path d="M75 66L85 76L105 54" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="fashion-success-title">
          Order Confirmed
        </h1>

        <p className="fashion-success-subtitle">
          Your fashion order has been successfully placed & confirmed
        </p>

        <div className="fashion-reference-container">
          <span className="fashion-reference-label">Order Reference</span>
          <div className="fashion-reference-box">
            <div className="fashion-reference-number-row">
              <strong className="fashion-reference-code">
                {orderId || 'WF-' + Date.now()}
              </strong>
              <button
                type="button"
                className="fashion-copy-icon-btn"
                onClick={handleCopyOrderId}
                title="Copy reference number"
                aria-label="Copy reference number"
              >
                {copied ? '✓' : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <span className="fashion-reference-timestamp">
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="fashion-info-banner">
          <div className="fashion-info-icon">
            ⓘ
          </div>
          <p className="fashion-info-text">
            Use this order reference to track your fashion order status anytime in the <strong>‘My Orders’</strong> section.
          </p>
        </div>

        <div className="fashion-success-actions-group">
          <Link
            to="/account/bookings/fashion"
            className="fashion-btn-primary-navy"
          >
            Go to My Orders
          </Link>

          <Link
            to="/fashion"
            className="fashion-btn-secondary-outline"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  )
}

export default FashionBookingSuccess