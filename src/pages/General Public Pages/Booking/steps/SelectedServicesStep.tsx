import {
  ArrowRight,
  Clock3,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'

import type {
  BookingService,
} from '../Booking'

import './SelectedServicesStep.css'


type SelectedServicesStepProps = {
  loading: boolean

  selectedServiceIds: string[]

  serviceMap: Map<
    string,
    BookingService
  >

  onRemoveService: (
    serviceId: string,
  ) => void

  onAddService: () => void
}


function formatCurrency(
  value: number,
): string {
  return `₹${Math.round(
    value,
  ).toLocaleString('en-IN')}`
}


function formatDuration(
  minutes: number,
): string {
  if (
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return '0 min'
  }

  const hours =
    Math.floor(
      minutes / 60,
    )

  const remaining =
    minutes % 60

  if (!hours) {
    return `${remaining} min`
  }

  if (!remaining) {
    return `${hours} hr`
  }

  return `${hours} hr ${remaining} min`
}


function SelectedServicesStep({
  loading,
  selectedServiceIds,
  serviceMap,
  onRemoveService,
  onAddService,
}: SelectedServicesStepProps) {

  const services =
    selectedServiceIds
      .map(
        (id) =>
          serviceMap.get(id),
      )
      .filter(
        (
          service,
        ): service is BookingService =>
          Boolean(service),
      )


  const totalDuration =
    services.reduce(
      (
        total,
        service,
      ) =>
        total +
        Number(
          service.durationMinutes,
        ),
      0,
    )


  const totalPrice =
    services.reduce(
      (
        total,
        service,
      ) =>
        total +
        Number(
          service.price,
        ),
      0,
    )


  return (
    <section className="selected-services-panel">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="selected-services-header">

        <div className="selected-services-heading">

          <div className="selected-services-eyebrow">

            <span className="selected-services-eyebrow-line" />

            STEP 01

            <span className="selected-services-eyebrow-dot" />

          </div>

          <h2>
            Your selected
            <em>
              services.
            </em>
          </h2>

          <p>
            Review your beauty services
            before continuing with your
            appointment details.
          </p>

        </div>


        {services.length > 0 && (
          <div className="selected-services-mini-summary">

            <div className="selected-services-mini-item">

              <span>
                SERVICES
              </span>

              <strong>
                {services.length}
              </strong>

            </div>

            <div className="selected-services-mini-divider" />

            <div className="selected-services-mini-item">

              <span>
                DURATION
              </span>

              <strong>
                {formatDuration(
                  totalDuration,
                )}
              </strong>

            </div>

          </div>
        )}

      </div>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="selected-services-loading">

          <div className="selected-services-spinner" />

          <div>
            <strong>
              Preparing your services
            </strong>

            <span>
              Please wait a moment...
            </span>
          </div>

        </div>
      ) : services.length === 0 ? (

        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="selected-services-empty">

          <div className="selected-services-empty-icon">
            <Sparkles
              size={23}
            />
          </div>

          <h3>
            No services selected
          </h3>

          <p>
            Choose a beauty or fashion
            service to begin your
            appointment.
          </p>

          <button
            type="button"
            className="selected-services-empty-button"
            onClick={
              onAddService
            }
          >
            <span>
              Explore Services
            </span>

            <ArrowRight
              size={15}
            />
          </button>

        </div>

      ) : (

        /* =================================================
           SERVICE CARDS
        ================================================= */

        <div className="selected-services-list">

          {services.map(
            (
              service,
              index,
            ) => (

              <article
                className="selected-service-card"
                key={service.id}
              >

                {/* IMAGE */}

                <div className="selected-service-image">

                  {service.imageUrl ? (
                    <img
                      src={
                        service.imageUrl
                      }
                      alt={
                        service.name
                      }
                    />
                  ) : (
                    <div className="selected-service-image-placeholder">
                      <span>
                        WF
                      </span>
                    </div>
                  )}

                  <div className="selected-service-image-overlay" />

                  <span className="selected-service-number">
                    0{index + 1}
                  </span>

                  <span className="selected-service-image-label">
                    WILDFLORAL
                  </span>

                </div>


                {/* CONTENT */}

                <div className="selected-service-content">

                  <div className="selected-service-top">

                    <div className="selected-service-category">

                      <span className="selected-service-category-line" />

                      <span>
                        {service.category ||
                          'Beauty Service'}
                      </span>

                    </div>


                    <button
                      type="button"
                      className="selected-service-remove"
                      onClick={() =>
                        onRemoveService(
                          service.id,
                        )
                      }
                      aria-label={`Remove ${service.name}`}
                    >
                      <X
                        size={14}
                        strokeWidth={1.8}
                      />
                    </button>

                  </div>


                  <div className="selected-service-main">

                    <h3>
                      {service.name}
                    </h3>

                    {service.description && (
                      <p>
                        {
                          service.description
                        }
                      </p>
                    )}

                  </div>


                  <div className="selected-service-bottom">

                    <div className="selected-service-duration">

                      <span className="selected-service-meta-icon">
                        <Clock3
                          size={13}
                        />
                      </span>

                      <div>

                        <span>
                          DURATION
                        </span>

                        <strong>
                          {formatDuration(
                            service.durationMinutes,
                          )}
                        </strong>

                      </div>

                    </div>


                    <div className="selected-service-price">

  {service.discountAmount > 0 && (
    <span className="selected-service-price-label">
      {service.discountLabel}
    </span>
  )}

  <div className="selected-service-price-values">

    {service.discountAmount > 0 && (
      <span className="selected-service-original-price">
        {formatCurrency(
          service.originalPrice,
        )}
      </span>
    )}

    <strong>
      {formatCurrency(
        service.offerPrice,
      )}
    </strong>

  </div>

</div>

                  </div>

                </div>

              </article>
            ),
          )}

        </div>
      )}


      {/* =================================================
          ADD SERVICE
      ================================================= */}

      <button
        type="button"
        className="selected-services-add"
        onClick={
          onAddService
        }
      >

        <span className="selected-services-add-icon">
          <Plus
            size={17}
            strokeWidth={1.8}
          />
        </span>

        <span className="selected-services-add-copy">

          <strong>
            Add another service
          </strong>

          <small>
            Explore more beauty & fashion services
          </small>

        </span>

        <ArrowRight
          className="selected-services-add-arrow"
          size={17}
        />

      </button>


      {/* =================================================
          BOTTOM SUMMARY
      ================================================= */}

      {services.length > 0 && (
        <div className="selected-services-footer">

          <div className="selected-services-footer-copy">

            <span>
              YOUR SELECTION
            </span>

            <strong>
              {services.length}{' '}
              {services.length ===
              1
                ? 'service'
                : 'services'}{' '}
              selected
            </strong>

          </div>


          <div className="selected-services-footer-total">

            <span>
              ESTIMATED TOTAL
            </span>

            <strong>
              {formatCurrency(
                totalPrice,
              )}
            </strong>

          </div>

        </div>
      )}

    </section>
  )
}

export default SelectedServicesStep