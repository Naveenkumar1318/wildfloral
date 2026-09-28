import { useEffect } from 'react'
import './Ai_FashionEnquiry.css'

interface Ai_FashionEnquiryProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hideFloatingButton?: boolean
}

function Ai_FashionEnquiry({
  isOpen,
  onOpenChange,
  hideFloatingButton = false,
}: Ai_FashionEnquiryProps) {
  const phoneNumber = '8838894677'

  const whatsappMessage = encodeURIComponent(
    'Hello, I would like to enquire about AI-assisted custom fashion design and customization.',
  )

  /* =====================================================
     CLOSE WITH ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onOpenChange])

  return (
    <>
      {/* =====================================================
          FLOATING AI BUTTON
      ===================================================== */}

      {!isOpen && !hideFloatingButton && (
        <button
          type="button"
          className="ai-fashion-float-button"
          onClick={() => onOpenChange(true)}
          aria-label="Open AI Fashion Assistant"
        >
          <span className="ai-fashion-float-icon">
            ✦
          </span>

          <span className="ai-fashion-float-text">
            <strong>AI Fashion</strong>

            <small>Design Assistant</small>
          </span>
        </button>
      )}

      {/* =====================================================
          AI DRAWER
      ===================================================== */}

      {isOpen && (
        <>
          <button
            type="button"
            className="ai-fashion-backdrop"
            onClick={() => onOpenChange(false)}
            aria-label="Close AI Fashion Assistant"
          />

          <aside
            className="ai-fashion-drawer"
            id="ai-fashion-assistant"
            role="dialog"
            aria-modal="true"
            aria-label="AI Fashion Assistant"
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <header className="ai-fashion-drawer-header">
              <div className="ai-fashion-drawer-brand">

                <div className="ai-fashion-drawer-logo">
                  ✦
                </div>

                <div className="ai-fashion-drawer-title">
                  <span>
                    AI FASHION
                  </span>

                  <h2>
                    Design Assistant
                  </h2>

                  <small>
                    Under development
                  </small>
                </div>

              </div>

              <button
                type="button"
                className="ai-fashion-close-button"
                onClick={() => onOpenChange(false)}
                aria-label="Close AI Fashion Assistant"
              >
                ×
              </button>
            </header>

            {/* =================================================
                BODY
            ================================================= */}

            <div className="ai-fashion-drawer-body">

              {/* INTRO MESSAGE */}

              <div className="ai-fashion-message-row">

                <div className="ai-fashion-message-avatar">
                  ✦
                </div>

                <div className="ai-fashion-message ai-fashion-message-primary">

                  <span className="ai-fashion-message-label">
                    AI Fashion Assistant
                  </span>

                  <p>
                    Hello! 👋
                  </p>

                  <p>
                    I will soon help you explore custom fashion
                    designs, styling ideas, fabrics, colours,
                    embroidery, and personalization options.
                  </p>

                </div>

              </div>

              {/* DEVELOPMENT NOTICE */}

              <div className="ai-fashion-development-card">

                <div className="ai-fashion-development-icon">
                  ✨
                </div>

                <div>
                  <h3>
                    AI Assistant Coming Soon
                  </h3>

                  <p>
                    Our AI fashion assistant is currently under
                    development. We are working on it to provide
                    faster and smarter design assistance.
                  </p>
                </div>

              </div>

              {/* CUSTOMIZATION */}

              <div className="ai-fashion-customization">

                <span className="ai-fashion-section-label">
                  WHAT CAN YOU CUSTOMIZE?
                </span>

                <div className="ai-fashion-customization-grid">

                  <div className="ai-fashion-customization-item">
                    <span>01</span>
                    <strong>Aari Work</strong>
                  </div>

                  <div className="ai-fashion-customization-item">
                    <span>02</span>
                    <strong>Custom Blouse</strong>
                  </div>

                  <div className="ai-fashion-customization-item">
                    <span>03</span>
                    <strong>Custom Lehenga</strong>
                  </div>

                  <div className="ai-fashion-customization-item">
                    <span>04</span>
                    <strong>Other Designs</strong>
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="ai-fashion-drawer-footer">

              <span className="ai-fashion-help-text">
                Need help now?
              </span>

              <div className="ai-fashion-contact-actions">

                <a
                  href={`https://wa.me/91${phoneNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-fashion-whatsapp-button"
                >
                  WhatsApp Us
                </a>

                <a
                  href={`tel:${phoneNumber}`}
                  className="ai-fashion-call-button"
                >
                  Call Us
                </a>

              </div>

              <small className="ai-fashion-phone-note">
                Direct / WhatsApp: {phoneNumber}
              </small>

            </footer>

          </aside>
        </>
      )}
    </>
  )
}

export default Ai_FashionEnquiry