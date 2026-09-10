import {
  CalendarDays,
  Clock3,
  Edit3,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from 'lucide-react'

import type {
  BookingPerson,
  BookingService,
} from '../Booking'
import type { BookingLocation } from '../../../../lib/bookingFlow'

import './ReviewStep.css'

/* =========================================================
   TYPES
========================================================= */

export type BookingFlowMode =
  | 'booking'
  | 'enquiry'

export type EnquiryContactPreference =
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'

type ReviewPerson = {
  person: BookingPerson
  services: BookingService[]
  subtotal: number
}

type ReviewStepProps = {
  mode?: BookingFlowMode

  people: ReviewPerson[]

  date: string

  time: string

  location?: BookingLocation

  address?: string

  city?: string

  pincode?: string
  serviceMap?: Map<string, BookingService>

  contactPreference?: EnquiryContactPreference

  subtotal: number

  discountAmount: number

  total: number

  onEditStep: (
    step: 1 | 2 | 3 | 4,
  ) => void
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  value: number,
): string {
  return `₹${Math.round(
    value,
  ).toLocaleString('en-IN')}`
}

/* =========================================================
   DURATION
========================================================= */

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
    Math.floor(minutes / 60)

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

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string,
): string {
  if (!value) {
    return 'Not selected'
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

/* =========================================================
   TIME
========================================================= */

function formatTime(
  value: string,
): string {
  if (!value) {
    return 'Not selected'
  }

  const [
    hour,
    minute,
  ] = value
    .split(':')
    .map(Number)

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return value
  }

  const date =
    new Date()

  date.setHours(
    hour,
    minute,
    0,
    0,
  )

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )
}

/* =========================================================
   CONTACT PREFERENCE
========================================================= */

function getContactPreferenceLabel(
  preference?: EnquiryContactPreference,
): string {
  switch (preference) {
    case 'email':
      return 'Email'

    case 'whatsapp':
      return 'WhatsApp'

    case 'call':
      return 'Phone Call'

    case 'message':
      return 'Message'

    case 'personal_home_enquiry':
      return 'Personal / Home Enquiry'

    default:
      return 'Not selected'
  }
}

function getContactPreferenceIcon(
  preference?: EnquiryContactPreference,
) {
  switch (preference) {
    case 'email':
      return <Mail size={20} />

    case 'whatsapp':
      return (
        <MessageCircle
          size={20}
        />
      )

    case 'call':
      return <Phone size={20} />

    case 'message':
      return (
        <MessageCircle
          size={20}
        />
      )

    case 'personal_home_enquiry':
      return <Home size={20} />

    default:
      return <MessageCircle size={20} />
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function ReviewStep({
  mode = 'booking',

  people,

  date,

  time,

  location,

  address,

  city,

  pincode,

  contactPreference,

  subtotal,

  discountAmount,

  total,

  onEditStep,
}: ReviewStepProps) {
  const isEnquiry =
    mode === 'enquiry'

  return (
    <section className="booking-panel booking-review-panel">

      {/* ===================================================
          HEADING
      =================================================== */}

      <div className="booking-panel-heading">

        <div className="booking-step-label">
          STEP 05
        </div>

        <h2>
          Review your
          <em>
            {isEnquiry
              ? ' enquiry.'
              : ' appointment.'}
          </em>
        </h2>

        <p>
          {isEnquiry
            ? 'Please check all enquiry details carefully before submitting.'
            : 'Please check all details carefully before confirming.'}
        </p>

      </div>

      <div className="booking-review-sections">

        {/* =================================================
            SERVICES
        ================================================= */}

        <section className="booking-review-section">

          <div className="booking-review-section-header">

            <div>

              <span>
                YOUR SERVICES
              </span>

              <h3>
                Selected services
              </h3>

            </div>

            <button
              type="button"
              onClick={() =>
                onEditStep(1)
              }
            >
              <Edit3 size={14} />
              Edit
            </button>

          </div>

          <div className="booking-review-people">

            {people.map(
              (item, index) => (
                <article
                  className="booking-review-person"
                  key={
                    item.person.id
                  }
                >

                  {/* PERSON */}

                  <div className="booking-review-person-heading">

                    <span>
                      <UserRound
                        size={15}
                      />
                    </span>

                    <div>

                      <small>
                        PERSON{' '}
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </small>

                      <strong>
                        {item.person.name ||
                          `Person ${index + 1}`}
                      </strong>

                    </div>

                  </div>

                  {/* SERVICES */}

                  <div className="booking-review-service-list">

                    {item.services.map(
                      (service) => (
                        <div
                          key={
                            service.id
                          }
                          className="booking-review-service"
                        >

                          <div className="booking-review-service-image">

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

                          <div>

                            <strong>
                              {service.name}
                            </strong>

                            <span>
                              {formatDuration(
                                service.durationMinutes,
                              )}
                            </span>

                          </div>

                          <div className="booking-review-service-price">

                            {service.discountAmount >
                              0 && (
                              <span className="booking-review-original-price">
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

                            {service.discountAmount >
                              0 && (
                              <small className="booking-review-discount">
                                {
                                  service.discountLabel
                                }
                              </small>
                            )}

                          </div>

                        </div>
                      ),
                    )}

                  </div>

                  {/* PERSON TOTAL */}

                  <div className="booking-review-person-total">

                    <span>
                      Person subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        item.subtotal,
                      )}
                    </strong>

                  </div>

                </article>
              ),
            )}

          </div>

        </section>

        {/* =================================================
            DATE & TIME
        ================================================= */}

        <section className="booking-review-section">

          <div className="booking-review-section-header">

            <div>

              <span>
                WHEN
              </span>

              <h3>
                {isEnquiry
                  ? 'Preferred date & time'
                  : 'Appointment time'}
              </h3>

            </div>

            <button
              type="button"
              onClick={() =>
                onEditStep(3)
              }
            >
              <Edit3 size={14} />
              Edit
            </button>

          </div>

          <div className="booking-review-info-grid">

            <div>

              <CalendarDays
                size={18}
              />

              <span>
                Date
              </span>

              <strong>
                {formatDate(date)}
              </strong>

            </div>

            <div>

              <Clock3
                size={18}
              />

              <span>
                Time
              </span>

              <strong>
                {formatTime(time)}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            BOOKING LOCATION
        ================================================= */}

        {!isEnquiry && (
          <section className="booking-review-section">

            <div className="booking-review-section-header">

              <div>

                <span>
                  WHERE
                </span>

                <h3>
                  Appointment location
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  onEditStep(4)
                }
              >
                <Edit3 size={14} />
                Edit
              </button>

            </div>

            <div className="booking-review-location">

              <div className="booking-review-location-icon">

                {location ===
                'studio' ? (
                  <MapPin size={20} />
                ) : (
                  <Home size={20} />
                )}

              </div>

              <div>

                <strong>
                  {location ===
                  'studio'
                    ? 'WildFloral Studio'
                    : 'Home Service'}
                </strong>

                {location ===
                  'home' && (
                  <span>
                    {address}

                    {city
                      ? `, ${city}`
                      : ''}

                    {pincode
                      ? ` - ${pincode}`
                      : ''}
                  </span>
                )}

                {location ===
                  'studio' && (
                  <span>
                    Studio appointment
                  </span>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            ENQUIRY CONTACT PREFERENCE
        ================================================= */}

        {isEnquiry && (
          <section className="booking-review-section">

            <div className="booking-review-section-header">

              <div>

                <span>
                  CONTACT
                </span>

                <h3>
                  Preferred contact method
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  onEditStep(4)
                }
              >
                <Edit3 size={14} />
                Edit
              </button>

            </div>

            <div className="booking-review-location">

              <div className="booking-review-location-icon">

                {getContactPreferenceIcon(
                  contactPreference,
                )}

              </div>

              <div>

                <strong>
                  {getContactPreferenceLabel(
                    contactPreference,
                  )}
                </strong>

                <span>
                  We will use your preferred
                  contact method regarding
                  this enquiry.
                </span>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            TOTAL
        ================================================= */}

        <section className="booking-review-total">

          <div>

            <span>
              Services subtotal
            </span>

            <strong>
              {formatCurrency(
                subtotal,
              )}
            </strong>

          </div>

          {discountAmount >
            0 && (
            <div className="discount">

              <span>
                Discount
              </span>

              <strong>
                −{' '}
                {formatCurrency(
                  discountAmount,
                )}
              </strong>

            </div>
          )}

          <div className="grand-total">

            <span>
              {isEnquiry
                ? 'Estimated enquiry total'
                : 'Estimated total'}
            </span>

            <strong>
              {formatCurrency(
                total,
              )}
            </strong>

          </div>

        </section>

      </div>

    </section>
  )
}

export default ReviewStep