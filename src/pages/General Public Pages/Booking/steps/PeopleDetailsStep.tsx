import {
  ArrowRight,
  Mail,
  Minus,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'

import type {
  BookingPerson,
  BookingService,
} from '../Booking'

import './PeopleDetailsStep.css'

/* =========================================================
   TYPES
========================================================= */

export type BookingPersonTotal = {
  person: BookingPerson
  services: BookingService[]
  subtotal: number
}

type PersonField =
  | 'name'
  | 'phone'
  | 'email'

type PeopleDetailsStepProps = {
  people: BookingPersonTotal[]

  onAddPerson: () => void

  onRemovePerson: (
    personId: string,
  ) => void

  onPersonField: (
    personId: string,
    field: PersonField,
    value: string,
  ) => void

  onRemoveService: (
    personId: string,
    serviceId: string,
  ) => void

  onAddService: (
    personId: string,
  ) => void
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  value: number,
): string {
  const safeValue =
    Number.isFinite(
      Number(value),
    )
      ? Number(value)
      : 0

  return `₹${Math.round(
    safeValue,
  ).toLocaleString('en-IN')}`
}

function formatDuration(
  minutes: number,
): string {
  const duration =
    Number(minutes)

  if (
    !Number.isFinite(
      duration,
    ) ||
    duration <= 0
  ) {
    return '0 min'
  }

  const hours =
    Math.floor(
      duration / 60,
    )

  const remainingMinutes =
    duration % 60

  if (hours === 0) {
    return `${remainingMinutes} min`
  }

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}

/* =========================================================
   COMPONENT
========================================================= */

function PeopleDetailsStep({
  people,
  onAddPerson,
  onRemovePerson,
  onPersonField,
  onRemoveService,
  onAddService,
}: PeopleDetailsStepProps) {
  const totalPeople =
    people.length

  const totalServices =
    people.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.services.length,
      0,
    )

  function handlePhoneChange(
    personId: string,
    value: string,
  ) {
    const digitsOnly =
      value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        )

    onPersonField(
      personId,
      'phone',
      digitsOnly,
    )
  }

  function handleNameChange(
    personId: string,
    value: string,
  ) {
    onPersonField(
      personId,
      'name',
      value,
    )
  }

  function handleEmailChange(
    personId: string,
    value: string,
  ) {
    onPersonField(
      personId,
      'email',
      value,
    )
  }

  return (
    <section
      className="people-step-panel"
      aria-labelledby="people-step-title"
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="people-step-header">

        <div className="people-step-heading">

          <div className="people-step-eyebrow">

            <span className="people-step-eyebrow-line" />

            STEP 02

            <span className="people-step-eyebrow-dot" />

          </div>

          <h2 id="people-step-title">
            Who is
            <em>
              coming?
            </em>
          </h2>

          <p>
            Add everyone attending your
            appointment and personalise
            their services individually.
          </p>

        </div>

        <div
          className="people-step-overview"
          aria-label="Booking overview"
        >

          <div className="people-overview-item">

            <span>
              PEOPLE
            </span>

            <strong>
              {totalPeople}
            </strong>

          </div>

          <div
            className="people-overview-divider"
            aria-hidden="true"
          />

          <div className="people-overview-item">

            <span>
              SERVICES
            </span>

            <strong>
              {totalServices}
            </strong>

          </div>

        </div>

      </header>

      {/* ===================================================
          PEOPLE
      =================================================== */}

      <div className="people-list">

        {people.map(
          (
            item,
            index,
          ) => {
            const personId =
              item.person.id

            const personName =
              item.person.name.trim() ||
              `Person ${index + 1}`

            const phoneLength =
              item.person.phone
                .replace(
                  /\D/g,
                  '',
                )
                .length

            return (
              <article
                className="person-card"
                key={personId}
              >

                {/* =================================================
                    PERSON HEADER
                ================================================= */}

                <header className="person-card-header">

                  <div className="person-card-identity">

                    <span className="person-card-number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>

                    <div className="person-card-name">

                      <span className="person-card-eyebrow">
                        PERSON{' '}
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <h3>
                        {personName}
                      </h3>

                    </div>

                  </div>

                  {people.length > 1 && (
                    <button
                      type="button"
                      className="person-delete-button"
                      onClick={() =>
                        onRemovePerson(
                          personId,
                        )
                      }
                      aria-label={`Remove ${personName}`}
                      title={`Remove ${personName}`}
                    >
                      <Trash2
                        size={15}
                        strokeWidth={1.8}
                      />
                    </button>
                  )}

                </header>

                {/* =================================================
                    DETAILS
                ================================================= */}

                <div className="person-details">

                  {/* NAME */}

                  <div className="person-field">

                    <label
                      htmlFor={`person-name-${personId}`}
                    >
                      Full name
                      <span>*</span>
                    </label>

                    <div className="person-input-wrap">

                      <UserRound
                        size={15}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <input
                        id={`person-name-${personId}`}
                        name={`person-name-${personId}`}
                        type="text"
                        value={
                          item.person.name
                        }
                        onChange={(event) =>
                          handleNameChange(
                            personId,
                            event.target.value,
                          )
                        }
                        placeholder="Enter full name"
                        autoComplete="name"
                        maxLength={80}
                      />

                    </div>

                  </div>

                  {/* PHONE */}

                  <div className="person-field">

                    <label
                      htmlFor={`person-phone-${personId}`}
                    >
                      Mobile number
                      <span>*</span>
                    </label>

                    <div
                      className={
                        phoneLength === 10
                          ? 'person-input-wrap valid'
                          : 'person-input-wrap'
                      }
                    >

                      <Phone
                        size={15}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <input
                        id={`person-phone-${personId}`}
                        name={`person-phone-${personId}`}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={
                          item.person.phone
                        }
                        onChange={(event) =>
                          handlePhoneChange(
                            personId,
                            event.target.value,
                          )
                        }
                        placeholder="9876543210"
                        autoComplete="tel"
                        maxLength={10}
                      />

                      {phoneLength > 0 && (
                        <span className="person-input-counter">
                          {phoneLength}/10
                        </span>
                      )}

                    </div>

                  </div>

                  {/* EMAIL */}

                  <div className="person-field person-field-full">

                    <label
                      htmlFor={`person-email-${personId}`}
                    >
                      Email address
                      <span>*</span>
                    </label>

                    <div className="person-input-wrap">

                      <Mail
                        size={15}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />

                      <input
                        id={`person-email-${personId}`}
                        name={`person-email-${personId}`}
                        type="email"
                        inputMode="email"
                        value={
                          item.person.email
                        }
                        onChange={(event) =>
                          handleEmailChange(
                            personId,
                            event.target.value,
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        spellCheck={false}
                        maxLength={120}
                      />

                    </div>

                  </div>

                </div>

                {/* =================================================
                    SERVICES
                ================================================= */}

                <section className="person-services">

                  <div className="person-services-header">

                    <div className="person-services-title">

                      <div className="person-services-label">

                        <span />

                        SERVICES

                      </div>

                      <h4>
                        Assigned services
                      </h4>

                      <p>
                        Personalise the appointment
                        for this person.
                      </p>

                    </div>

                    <div className="person-services-count">
                      <strong>
                        {item.services.length}
                      </strong>

                      <span>
                        {item.services.length === 1
                          ? 'service'
                          : 'services'}
                      </span>
                    </div>

                  </div>

                  {item.services.length ===
                  0 ? (
                    <div className="person-empty-services">

                      <div className="person-empty-icon">
                        <UserRound
                          size={17}
                        />
                      </div>

                      <div className="person-empty-copy">

                        <strong>
                          No service assigned
                        </strong>

                        <span>
                          Choose a service for this
                          person to continue.
                        </span>

                      </div>

                      <button
                        type="button"
                        className="person-empty-button"
                        onClick={() =>
                          onAddService(
                            personId,
                          )
                        }
                      >
                        Choose service
                        <ArrowRight
                          size={13}
                        />
                      </button>

                    </div>
                  ) : (
                    <div className="person-service-list">

                      {item.services.map(
                        (
                          service,
                        ) => (
                          <div
                            className="person-service-row"
                            key={service.id}
                          >

                            <div className="person-service-image">

                              {service.imageUrl ? (
                                <img
                                  src={
                                    service.imageUrl
                                  }
                                  alt=""
                                />
                              ) : (
                                <span>
                                  WF
                                </span>
                              )}

                            </div>

                            <div className="person-service-info">

                              <strong>
                                {
                                  service.name
                                }
                              </strong>

                             <div className="person-service-meta">

  <span>
    {formatDuration(
      service.durationMinutes,
    )}
  </span>

  <span>
    ·
  </span>

  {service.discountAmount > 0 && (
    <span className="person-service-original-price">
      {formatCurrency(
        service.originalPrice,
      )}
    </span>
  )}

  <strong className="person-service-offer-price">
    {formatCurrency(
      service.offerPrice,
    )}
  </strong>

  {service.discountAmount > 0 && (
    <span className="person-service-discount">
      {service.discountLabel}
    </span>
  )}

</div>

                            </div>

                            <button
                              type="button"
                              className="person-service-remove"
                              onClick={() =>
                                onRemoveService(
                                  personId,
                                  service.id,
                                )
                              }
                              aria-label={`Remove ${service.name}`}
                              title={`Remove ${service.name}`}
                            >
                              <Minus
                                size={14}
                                strokeWidth={1.8}
                              />
                            </button>

                          </div>
                        ),
                      )}

                    </div>
                  )}

                  {/* ADD SERVICE */}

                  <button
                    type="button"
                    className="person-add-service"
                    onClick={() =>
                      onAddService(
                        personId,
                      )
                    }
                  >

                    <span className="person-add-service-icon">

                      <Plus
                        size={15}
                        strokeWidth={1.8}
                      />

                    </span>

                    <span className="person-add-service-copy">

                      <strong>
                        Add another service
                      </strong>

                      <small>
                        Browse and personalise services
                      </small>

                    </span>

                    <ArrowRight
                      size={15}
                      strokeWidth={1.7}
                      className="person-add-service-arrow"
                    />

                  </button>

                </section>

                {/* =================================================
                    TOTAL
                ================================================= */}

                <footer className="person-total">

                  <div className="person-total-info">

                    <span>
                      PERSON SUBTOTAL
                    </span>

                    <strong>
                      {item.services.length}{' '}
                      {item.services.length ===
                      1
                        ? 'service'
                        : 'services'}{' '}
                      selected
                    </strong>

                  </div>

                  <div className="person-total-price">

                    <span>
                      ESTIMATED
                    </span>

                    <strong>
                      {formatCurrency(
                        item.subtotal,
                      )}
                    </strong>

                  </div>

                </footer>

              </article>
            )
          },
        )}

      </div>

      {/* ===================================================
          ADD PERSON
      =================================================== */}

      <button
        type="button"
        className="people-add-person"
        onClick={
          onAddPerson
        }
      >

        <span className="people-add-person-icon">

          <Plus
            size={17}
            strokeWidth={1.8}
          />

        </span>

        <span className="people-add-person-copy">

          <strong>
            Add another person
          </strong>

          <small>
            Booking for family, friends or guests
          </small>

        </span>

        <ArrowRight
          size={17}
          strokeWidth={1.7}
          className="people-add-person-arrow"
        />

      </button>

    </section>
  )
}

export default PeopleDetailsStep