import {
  CalendarDays,
  Clock3,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Home,
} from 'lucide-react'

import type {
  BookingPerson,
  BookingService,
} from '../Booking'

type BookingFlowMode =
  | 'booking'
  | 'enquiry'

type EnquiryContactPreference =
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'

type PersonTotal = {
  person: BookingPerson
  services: BookingService[]
  subtotal: number
}

type BookingSummaryProps = {
  mode?: BookingFlowMode

  people: PersonTotal[]

  selectedServiceCount: number
  totalDuration: number

  subtotal: number
  discount: number
  grandTotal: number

  date: string
  time: string

  location?: 'studio' | 'home'
  address?: string
  city?: string
  pincode?: string

  contactPreference?: EnquiryContactPreference
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  value: number,
): string {
  const safeValue =
    Number.isFinite(value)
      ? value
      : 0

  return `₹${Math.round(
    safeValue,
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

  const totalMinutes =
    Math.round(minutes)

  const hours =
    Math.floor(
      totalMinutes / 60,
    )

  const remainingMinutes =
    totalMinutes % 60

  if (hours === 0) {
    return `${remainingMinutes} min`
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
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

  const date = new Date(
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

  const parts = value
    .split(':')
    .map(Number)

  const hour = parts[0]
  const minute = parts[1]

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return value
  }

  const date = new Date()

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
      return <Mail size={15} />

    case 'whatsapp':
      return (
        <MessageCircle
          size={15}
        />
      )

    case 'call':
      return <Phone size={15} />

    case 'message':
      return (
        <MessageCircle
          size={15}
        />
      )

    case 'personal_home_enquiry':
      return <Home size={15} />

    default:
      return (
        <MessageCircle
          size={15}
        />
      )
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function BookingSummary({
  mode = 'booking',

  people,

  selectedServiceCount,
  totalDuration,

  subtotal,
  discount,
  grandTotal,

  date,
  time,

  location,
  address,
  city,
  pincode,

  contactPreference,
}: BookingSummaryProps) {
  const isEnquiry =
    mode === 'enquiry'

  const safePeople =
    Array.isArray(people)
      ? people
      : []

  const safeServiceCount =
    Number.isFinite(
      selectedServiceCount,
    )
      ? selectedServiceCount
      : 0

  const safeDuration =
    Number.isFinite(
      totalDuration,
    )
      ? totalDuration
      : 0

  const safeSubtotal =
    Number.isFinite(subtotal)
      ? subtotal
      : 0

  const safeDiscount =
    Number.isFinite(discount)
      ? discount
      : 0

  const safeGrandTotal =
    Number.isFinite(grandTotal)
      ? grandTotal
      : 0

  const safeAddress =
    address?.trim() || ''

  const safeCity =
    city?.trim() || ''

  const safePincode =
    pincode?.trim() || ''

  return (
    <aside className="booking-summary">

      <div className="booking-summary-inner">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="booking-summary-top">

          <span>
            {isEnquiry
              ? 'YOUR ENQUIRY'
              : 'YOUR APPOINTMENT'}
          </span>

          <h2>
            {isEnquiry
              ? 'Enquiry'
              : 'Appointment'}

            <em>
              {' '}
              summary.
            </em>
          </h2>

        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="booking-summary-stats">

          <div>
            <strong>
              {safePeople.length}
            </strong>

            <span>
              People
            </span>
          </div>

          <div>
            <strong>
              {safeServiceCount}
            </strong>

            <span>
              Services
            </span>
          </div>

          <div>
            <strong>
              {formatDuration(
                safeDuration,
              )}
            </strong>

            <span>
              Duration
            </span>
          </div>

        </div>

        <div className="booking-summary-divider" />

        {/* =====================================================
            PEOPLE
        ===================================================== */}

        <div className="booking-summary-people">

          {safePeople.length === 0 ? (
            <div className="booking-summary-empty">
              No people added yet.
            </div>
          ) : (
            safePeople.map(
              (
                item,
                index,
              ) => {

                const personName =
                  item.person.name
                    ?.trim() ||
                  `Person ${
                    index + 1
                  }`

                const personServices =
                  Array.isArray(
                    item.services,
                  )
                    ? item.services
                    : []

                return (
                  <div
                    className="booking-summary-person"
                    key={
                      item.person.id ||
                      `person-${index}`
                    }
                  >

                    {/* PERSON */}

                    <div className="booking-summary-person-heading">

                      <div className="booking-summary-avatar">
                        {personName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <span>
                          PERSON{' '}
                          {index + 1}
                        </span>

                        <strong>
                          {personName}
                        </strong>

                      </div>

                    </div>

                    {/* SERVICES */}

                    <div className="booking-summary-service-lines">

                      {personServices.length ===
                      0 ? (
                        <span className="booking-summary-no-services">
                          No services selected
                        </span>
                      ) : (
                        personServices.map(
                          (
                            service,
                          ) => (
                            <div
                              key={
                                service.id
                              }
                            >

                              <span>
                                {
                                  service.name
                                }
                              </span>

                              <div className="booking-summary-service-price">

                                {service.discountAmount >
                                  0 && (
                                  <span className="booking-summary-original-price">
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
                                  <small className="booking-summary-discount">
                                    {
                                      service.discountLabel
                                    }
                                  </small>
                                )}

                              </div>

                            </div>
                          ),
                        )
                      )}

                    </div>

                    {/* PERSON TOTAL */}

                    <div className="booking-summary-person-total">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          item.subtotal,
                        )}
                      </strong>

                    </div>

                  </div>
                )
              },
            )
          )}

        </div>

        <div className="booking-summary-divider" />

        {/* =====================================================
            DATE & TIME
        ===================================================== */}

        <div className="booking-summary-appointment">

          {/* DATE */}

          <div
            className={
              date
                ? 'selected'
                : 'not-selected'
            }
          >

            <CalendarDays
              size={15}
            />

            <span>
              {formatDate(date)}
            </span>

          </div>

          {/* TIME */}

          <div
            className={
              time
                ? 'selected'
                : 'not-selected'
            }
          >

            <Clock3
              size={15}
            />

            <span>
              {formatTime(time)}
            </span>

          </div>

          {/* BOOKING LOCATION */}

          {!isEnquiry && (
            <div className="selected">

              <MapPin
                size={15}
              />

              <span>
                {location ===
                'studio'
                  ? 'WildFloral Studio'
                  : 'Home Service'}
              </span>

            </div>
          )}

          {/* ENQUIRY CONTACT */}

          {isEnquiry && (
            <div className="selected">

              {getContactPreferenceIcon(
                contactPreference,
              )}

              <span>
                {getContactPreferenceLabel(
                  contactPreference,
                )}
              </span>

            </div>
          )}

        </div>

        {/* =====================================================
            HOME LOCATION
        ===================================================== */}

        {!isEnquiry &&
          location === 'home' &&
          (safeAddress ||
            safeCity ||
            safePincode) && (
            <div className="booking-summary-home-location">

              <MapPin
                size={14}
              />

              <div>

                {safeAddress && (
                  <span>
                    {safeAddress}
                  </span>
                )}

                {(safeCity ||
                  safePincode) && (
                  <small>
                    {[
                      safeCity,
                      safePincode,
                    ]
                      .filter(Boolean)
                      .join(
                        ' - ',
                      )}
                  </small>
                )}

              </div>

            </div>
          )}

        <div className="booking-summary-divider" />

        {/* =====================================================
            TOTAL
        ===================================================== */}

        <div className="booking-summary-total-line">

          <span>
            Subtotal
          </span>

          <strong>
            {formatCurrency(
              safeSubtotal,
            )}
          </strong>

        </div>

        {safeDiscount > 0 && (
          <div className="booking-summary-total-line discount">

            <span>
              Discount
            </span>

            <strong>
              −{' '}
              {formatCurrency(
                safeDiscount,
              )}
            </strong>

          </div>
        )}

        <div className="booking-summary-grand-total">

          <span>
            {isEnquiry
              ? 'Estimated total'
              : 'Estimated total'}
          </span>

          <strong>
            {formatCurrency(
              safeGrandTotal,
            )}
          </strong>

        </div>

        {/* =====================================================
            DURATION
        ===================================================== */}

        <div className="booking-summary-footer">

          <Clock3
            size={15}
          />

          <span>
            Total service duration:{' '}

            <strong>
              {formatDuration(
                safeDuration,
              )}
            </strong>
          </span>

        </div>

      </div>

    </aside>
  )
}

export default BookingSummary