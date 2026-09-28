import './CustomerFashionEnquiry.css'

function FashionEnquiry() {
  const phoneNumber = '8838894677'

  const whatsappMessage = encodeURIComponent(
    'Hello, I would like to enquire about a custom fashion design.'
  )

  return (
    <main className="customer-fashion-enquiry">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="customer-fashion-enquiry-hero">
        <div className="customer-fashion-enquiry-hero-content">

          <span className="customer-fashion-enquiry-eyebrow">
            CUSTOM FASHION
          </span>

          <h1>
            Your Design,
            <span>Made Just For You</span>
          </h1>

          <p>
            Looking for a custom design made especially for you?
            Please contact us directly to discuss your design,
            customization, and booking requirements.
          </p>

          <div className="customer-fashion-enquiry-actions">

            <a
              href={`https://wa.me/91${phoneNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="customer-fashion-enquiry-whatsapp"
            >
              WhatsApp Us
            </a>

            <a
              href={`tel:${phoneNumber}`}
              className="customer-fashion-enquiry-call"
            >
              Call Us
            </a>

          </div>

        </div>
      </section>


      {/* =====================================================
          CUSTOMIZATION AVAILABLE
      ===================================================== */}

      <section className="customer-fashion-enquiry-customization">

        <div className="customer-fashion-enquiry-heading">

          <span>
            CUSTOMIZATION AVAILABLE
          </span>

          <h2>
            Create Something
            <em>Unique</em>
          </h2>

          <p>
            We provide different types of fashion customization.
            If you have a specific design requirement, please
            contact us and discuss it with our team.
          </p>

        </div>


        <div className="customer-fashion-enquiry-grid">

          <article className="customer-fashion-enquiry-card">
            <span>01</span>

            <h3>
              Aari Work
            </h3>

            <p>
              Beautiful handcrafted Aari work and embroidery
              customization for your special outfits.
            </p>
          </article>


          <article className="customer-fashion-enquiry-card">
            <span>02</span>

            <h3>
              Custom Blouse
            </h3>

            <p>
              Personalized blouse designs created according
              to your style, measurements, and occasion.
            </p>
          </article>


          <article className="customer-fashion-enquiry-card">
            <span>03</span>

            <h3>
              Custom Lehenga
            </h3>

            <p>
              Customized lehenga designs created around your
              preferred style and special occasion.
            </p>
          </article>


          <article className="customer-fashion-enquiry-card">
            <span>04</span>

            <h3>
              Other Customization
            </h3>

            <p>
              Have another custom fashion requirement?
              Contact us and discuss your idea with our team.
            </p>
          </article>

        </div>

      </section>


      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section className="customer-fashion-enquiry-contact">

        <div className="customer-fashion-enquiry-contact-card">

          <span className="customer-fashion-enquiry-contact-eyebrow">
            CONTACT INFO
          </span>

          <h2>
            Need a Custom
            <span>Design?</span>
          </h2>

          <p>
            Please contact us directly to book or enquire about
            your customization requirements.
          </p>


          <div className="customer-fashion-enquiry-phone">

            <small>
              DIRECT / WHATSAPP
            </small>

            <a href={`tel:${phoneNumber}`}>
              8838894677
            </a>

          </div>


          <div className="customer-fashion-enquiry-contact-actions">

            <a
              href={`https://wa.me/91${phoneNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="customer-fashion-enquiry-contact-whatsapp"
            >
              Chat on WhatsApp
            </a>

            <a
              href={`tel:${phoneNumber}`}
              className="customer-fashion-enquiry-contact-call"
            >
              Call 8838894677
            </a>

          </div>


          <p className="customer-fashion-enquiry-note">
            To book or enquire about your custom design,
            please contact us directly on WhatsApp or by phone.
          </p>

        </div>

      </section>

    </main>
  )
}

export default FashionEnquiry