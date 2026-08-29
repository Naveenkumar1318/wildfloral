import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router'

import { supabase } from '../../lib/supabase'
import { assets } from '../../assets/assets'

import './Booking.css'

type Service = {
  id: string
  category: string | null
  name: string
  description: string | null
  duration_minutes: number
  price: number
  image_url: string | null
}

type Profile = {
  id: string
  full_name: string | null
  email: string | null
}

type Offer = {
  id: string
  title: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  promo_code: string | null
  starts_at: string | null
  ends_at: string | null
  service_id: string | null
}

type LocationType = 'studio' | 'home'

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]

function getTodayKey() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value: string) {
  if (!value) return 'Not selected'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRange(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const start = new Date()
  start.setHours(hours, minutes, 0, 0)

  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  return `${formatTime(value)} – ${end.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 12 4 4L19 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19 12H6m6-6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="10"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 20c.7-3.3 2.8-5 6.5-5s5.8 1.7 6.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m20 13-7 7L4 11V4h7l9 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

function Booking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const firstMissingRef = useRef<HTMLInputElement | null>(null)

  const [services, setServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState<LocationType>('studio')
  const [address, setAddress] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [discountCode, setDiscountCode] = useState('')
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)
  const [discountMessage, setDiscountMessage] = useState('')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')

  const minDate = useMemo(() => getTodayKey(), [])

  useEffect(() => {
    const servicesParam = searchParams.get('services')
    const serviceParam = searchParams.get('service')

    let ids: string[] = []

    if (servicesParam) {
      ids = servicesParam.split(',').map((id) => id.trim()).filter(Boolean)
    } else if (serviceParam) {
      ids = [serviceParam]
    }

    setSelectedIds(Array.from(new Set(ids)))
  }, [searchParams])

  useEffect(() => {
    let mounted = true

    async function loadBookingData() {
      setLoading(true)
      setError('')

      const [{ data: authData }, serviceResult, offerResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('services')
          .select(`
            id,
            category,
            name,
            description,
            duration_minutes,
            price,
            image_url
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('offers')
          .select(`
            id,
            title,
            discount_type,
            discount_value,
            promo_code,
            starts_at,
            ends_at,
            service_id
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ])

      if (!mounted) return

      if (serviceResult.error) {
        setError(serviceResult.error.message)
        setLoading(false)
        return
      }

      setServices(
        (serviceResult.data ?? []).map((service) => ({
          id: service.id,
          category: service.category,
          name: service.name,
          description: service.description,
          duration_minutes: Number(service.duration_minutes),
          price: Number(service.price),
          image_url: service.image_url,
        })),
      )

      if (!offerResult.error) {
        const now = Date.now()

        setOffers(
          (offerResult.data ?? [])
            .filter((offer) => {
              const start = offer.starts_at
                ? new Date(offer.starts_at).getTime()
                : null
              const end = offer.ends_at
                ? new Date(offer.ends_at).getTime()
                : null

              return (
                (start === null || start <= now) &&
                (end === null || end >= now)
              )
            })
            .map((offer) => ({
              id: offer.id,
              title: offer.title,
              discount_type: offer.discount_type,
              discount_value: Number(offer.discount_value),
              promo_code: offer.promo_code,
              starts_at: offer.starts_at,
              ends_at: offer.ends_at,
              service_id: offer.service_id,
            })),
        )
      }

      const user = authData.user

      if (user) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', user.id)
          .maybeSingle()

        const nextProfile: Profile = currentProfile ?? {
          id: user.id,
          full_name: null,
          email: user.email ?? null,
        }

        setProfile(nextProfile)
        setName(nextProfile.full_name ?? '')
        setEmail(nextProfile.email ?? user.email ?? '')
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    void loadBookingData()

    return () => {
      mounted = false
    }
  }, [])

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  )

  const subtotal = useMemo(
    () => selectedServices.reduce((sum, service) => sum + service.price, 0),
    [selectedServices],
  )

  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0

    if (appliedOffer.discount_type === 'percentage') {
      return Math.min(
        subtotal,
        Math.round(subtotal * (appliedOffer.discount_value / 100)),
      )
    }

    return Math.min(subtotal, appliedOffer.discount_value)
  }, [appliedOffer, subtotal])

  const totalPrice = Math.max(0, subtotal - discountAmount)

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + service.duration_minutes,
        0,
      ),
    [selectedServices],
  )

  const upcomingDates = useMemo(() => {
    const dates: Date[] = []

    for (let index = 0; index < 14; index += 1) {
      const dateValue = new Date()
      dateValue.setHours(0, 0, 0, 0)
      dateValue.setDate(dateValue.getDate() + index)
      dates.push(dateValue)
    }

    return dates
  }, [])

  function updateUrl(ids: string[]) {
    const params = new URLSearchParams(searchParams)
    params.delete('service')
    params.delete('services')

    if (ids.length) {
      params.set('services', ids.join(','))
    }

    const query = params.toString()
    navigate(query ? `/booking?${query}` : '/booking', {
      replace: true,
    })
  }

  function toggleService(serviceId: string) {
    setError('')

    const nextIds = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId]

    setSelectedIds(nextIds)
    updateUrl(nextIds)
  }

  function removeService(serviceId: string) {
    const nextIds = selectedIds.filter((id) => id !== serviceId)
    setSelectedIds(nextIds)
    updateUrl(nextIds)
    setError('')
  }

  function applyDiscount() {
    setDiscountMessage('')
    setAppliedOffer(null)

    const code = discountCode.trim().toLowerCase()

    if (!code) {
      setDiscountMessage('Enter a discount code first.')
      return
    }

    const offer = offers.find(
      (item) => item.promo_code?.trim().toLowerCase() === code,
    )

    if (!offer) {
      setDiscountMessage('This discount code is invalid or expired.')
      return
    }

    if (
      offer.service_id &&
      !selectedServices.some((service) => service.id === offer.service_id)
    ) {
      setDiscountMessage('This code does not apply to the selected service.')
      return
    }

    setAppliedOffer(offer)
    setDiscountMessage(
      offer.discount_type === 'percentage'
        ? `${offer.discount_value}% discount applied.`
        : `${formatCurrency(offer.discount_value)} discount applied.`,
    )
  }

  function validateStepOne() {
    if (!selectedServices.length) {
      setError('Please select at least one service.')
      setStep(1)
      return false
    }

    if (!date) {
      setError('Please select an appointment date.')
      setStep(1)
      return false
    }

    if (!time) {
      setError('Please select a time range.')
      setStep(1)
      return false
    }

    if (location === 'home' && !address.trim()) {
      setError('Please enter your home service address.')
      setStep(1)
      return false
    }

    return true
  }

  function continueStepOne() {
    setError('')

    if (!validateStepOne()) return

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueStepTwo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      firstMissingRef.current?.focus()
      return
    }

    if (!phone.trim()) {
      setError('Please enter your mobile number.')
      firstMissingRef.current?.focus()
      return
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(phone.trim())) {
      setError('Please enter a valid mobile number.')
      firstMissingRef.current?.focus()
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      firstMissingRef.current?.focus()
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      firstMissingRef.current?.focus()
      return
    }

    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueStepThree() {
    setError('')

    if (!validateStepOne()) return

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setStep(2)
      setError('Please complete your required contact details.')
      return
    }

    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirm() {
    setError('')

    if (!profile) {
      const redirect =
        `${window.location.pathname}${window.location.search}`

      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    if (!validateStepOne()) return

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setStep(2)
      setError('Please complete your required contact details.')
      return
    }

    setSubmitting(true)

    try {
      const { data: existingBookings, error: availabilityError } =
        await supabase
          .from('bookings')
          .select('id')
          .eq('booking_date', date)
          .eq('booking_time', time)
          .in('status', ['pending', 'confirmed'])
          .limit(1)

      if (availabilityError) {
        setError('Unable to check this slot. Please try again.')
        return
      }

      if ((existingBookings ?? []).length > 0) {
        setStep(1)
        setError('This slot is already booked. Please choose another time.')
        return
      }

      const bookingNotes = [
        location === 'home'
          ? `HOME SERVICE ADDRESS:\n${address.trim()}`
          : 'LOCATION: WildFloral Studio',
        appliedOffer
          ? `DISCOUNT CODE: ${appliedOffer.promo_code ?? discountCode.trim()}\nDISCOUNT AMOUNT: ${formatCurrency(discountAmount)}`
          : '',
        notes.trim() ? `CUSTOMER NOTES:\n${notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const firstService = selectedServices[0]

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: profile.id,
          service_id: firstService.id,
          booking_date: date,
          booking_time: time,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          notes: bookingNotes || null,
          price: totalPrice,
          status: 'pending',
        })
        .select('id')
        .single()

      if (bookingError || !booking) {
        setError(
          bookingError?.message ??
            'Unable to create your appointment. Please try again.',
        )
        return
      }

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(
          selectedServices.map((service) => ({
            booking_id: booking.id,
            service_id: service.id,
            service_name: service.name,
            price: service.price,
            duration_minutes: service.duration_minutes,
          })),
        )

      if (itemsError) {
        setError(
          'The appointment was created, but the selected service details could not be saved. Please contact the studio.',
        )
        return
      }

      setBookingId(booking.id)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submitError) {
      console.error('Booking error:', submitError)
      setError('Something went wrong while creating your appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  function goBack() {
    setError('')
    setStep((current) => Math.max(1, current - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetBooking() {
    setSelectedIds([])
    setDate('')
    setTime('')
    setLocation('studio')
    setAddress('')
    setNotes('')
    setDiscountCode('')
    setAppliedOffer(null)
    setDiscountMessage('')
    setStep(1)
    setSuccess(false)
    setBookingId('')
    navigate('/booking', { replace: true })
  }

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-loading">
          <span />
          <strong>Preparing your experience</strong>
          <small>Loading services and appointment options</small>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="booking-page booking-success-page">
        <section className="booking-success-card">
          <span className="booking-success-mark">
            <CheckIcon />
          </span>

          <span className="booking-eyebrow">APPOINTMENT REQUESTED</span>

          <h1>
            Your experience is
            <span>beautifully planned.</span>
          </h1>

          <p>
            Your appointment request has been received. The studio will review
            the request and update your booking status.
          </p>

          <div className="booking-success-summary">
            <div>
              <span>Reference</span>
              <strong>{bookingId.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{formatDate(date)}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{formatRange(time)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>
                {location === 'studio' ? 'WildFloral Studio' : 'Home Service'}
              </strong>
            </div>
          </div>

          <div className="booking-success-actions">
            <Link to="/account/bookings" className="booking-primary-button">
              View My Bookings
              <ArrowIcon />
            </Link>

            <button
              type="button"
              className="booking-outline-button"
              onClick={resetBooking}
            >
              Book Another Service
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <span className="booking-eyebrow">WILDFLORAL APPOINTMENTS</span>

        <h1>
          Book your
          <span>perfect experience.</span>
        </h1>

        <p>
          Select your services, choose your preferred date and time, add your
          details, and review everything before confirming.
        </p>
      </header>

      <div className="booking-progress" aria-label="Booking progress">
        {[
          ['01', 'Experience'],
          ['02', 'Your details'],
          ['03', 'Discount'],
          ['04', 'Preview'],
        ].map(([number, label], index) => (
          <button
            type="button"
            key={number}
            className={step >= index + 1 ? 'active' : ''}
            disabled={index + 1 >= step}
            onClick={() => {
              if (index + 1 < step) {
                setStep(index + 1)
                setError('')
              }
            }}
          >
            <span>{number}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      {error && (
        <div className="booking-error" role="alert">
          {error}
        </div>
      )}

      <div className="booking-layout">
        <div className="booking-main">
          {step === 1 && (
            <>
              <section className="booking-panel">
                <div className="booking-panel-heading">
                  <span className="booking-number">01</span>
                  <div>
                    <span>YOUR EXPERIENCE</span>
                    <h2>Choose your services</h2>
                    <p>
                      Select one or more services for the same appointment.
                    </p>
                  </div>
                </div>

                <div className="booking-service-list">
                  {services.length === 0 ? (
                    <div className="booking-empty">
                      No services are currently available.
                    </div>
                  ) : (
                    services.map((service) => {
                      const selected = selectedIds.includes(service.id)

                      return (
                        <button
                          type="button"
                          key={service.id}
                          className={
                            selected
                              ? 'booking-service-option active'
                              : 'booking-service-option'
                          }
                          onClick={() => toggleService(service.id)}
                        >
                          <div className="booking-service-image">
                            <img
                              src={service.image_url || assets.hero}
                              alt=""
                            />
                          </div>

                          <div className="booking-service-info">
                            <span>{service.category || 'Beauty'}</span>
                            <strong>{service.name}</strong>
                            <small>
                              {service.duration_minutes} min ·{' '}
                              {formatCurrency(service.price)}
                            </small>
                          </div>

                          <span className="booking-service-check">
                            {selected ? <CheckIcon /> : '+'}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="booking-panel">
                <div className="booking-panel-heading">
                  <span className="booking-number">02</span>
                  <div>
                    <span>WHEN</span>
                    <h2>Choose your date</h2>
                    <p>Select a day that works for you.</p>
                  </div>
                </div>

                <div className="booking-calendar-toolbar">
                  <label htmlFor="booking-calendar">
                    <CalendarIcon />
                    Calendar
                  </label>

                  <input
                    id="booking-calendar"
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value)
                      setTime('')
                      setError('')
                    }}
                  />
                </div>

                <div className="booking-date-list">
                  {upcomingDates.map((dateObject) => {
                    const value = getDateKey(dateObject)
                    const selected = date === value

                    return (
                      <button
                        type="button"
                        key={value}
                        className={
                          selected
                            ? 'booking-date-option active'
                            : 'booking-date-option'
                        }
                        onClick={() => {
                          setDate(value)
                          setTime('')
                          setError('')
                        }}
                      >
                        <span>
                          {dateObject.toLocaleDateString('en-IN', {
                            weekday: 'short',
                          })}
                        </span>
                        <strong>{dateObject.getDate()}</strong>
                        <small>
                          {dateObject.toLocaleDateString('en-IN', {
                            month: 'short',
                          })}
                        </small>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="booking-panel">
                <div className="booking-panel-heading">
                  <span className="booking-number">03</span>
                  <div>
                    <span>WHEN</span>
                    <h2>Choose a time range</h2>
                    <p>Appointments are offered in one-hour ranges.</p>
                  </div>
                </div>

                <div className="booking-time-list">
                  {TIME_SLOTS.map((slot) => {
                    const selected = time === slot

                    return (
                      <button
                        type="button"
                        key={slot}
                        className={
                          selected
                            ? 'booking-time-option active'
                            : 'booking-time-option'
                        }
                        onClick={() => {
                          setTime(slot)
                          setError('')
                        }}
                      >
                        <ClockIcon />
                        <span>{formatRange(slot)}</span>
                        {selected && <CheckIcon />}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="booking-panel">
                <div className="booking-panel-heading">
                  <span className="booking-number">04</span>
                  <div>
                    <span>WHERE</span>
                    <h2>Choose location</h2>
                    <p>Choose our studio or request a home service.</p>
                  </div>
                </div>

                <div className="booking-location-options">
                  <button
                    type="button"
                    className={
                      location === 'studio'
                        ? 'booking-location-option active'
                        : 'booking-location-option'
                    }
                    onClick={() => {
                      setLocation('studio')
                      setAddress('')
                    }}
                  >
                    <LocationIcon />
                    <span>
                      <strong>WildFloral Studio</strong>
                      <small>Premium studio experience</small>
                    </span>
                    {location === 'studio' && <CheckIcon />}
                  </button>

                  <button
                    type="button"
                    className={
                      location === 'home'
                        ? 'booking-location-option active'
                        : 'booking-location-option'
                    }
                    onClick={() => setLocation('home')}
                  >
                    <LocationIcon />
                    <span>
                      <strong>Home Service</strong>
                      <small>We'll come to you</small>
                    </span>
                    {location === 'home' && <CheckIcon />}
                  </button>
                </div>

                {location === 'home' && (
                  <div className="booking-address-field">
                    <label htmlFor="booking-address">
                      Home service address *
                    </label>
                    <textarea
                      id="booking-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Enter your complete address"
                      rows={4}
                    />
                  </div>
                )}
              </section>

              <button
                type="button"
                className="booking-primary-button booking-continue-button"
                onClick={continueStepOne}
              >
                Continue to your details
                <ArrowIcon />
              </button>
            </>
          )}

          {step === 2 && (
            <section className="booking-panel">
              <div className="booking-panel-heading">
                <span className="booking-number">05</span>
                <div>
                  <span>YOUR DETAILS</span>
                  <h2>Tell us about you</h2>
                  <p>Your saved account details are filled automatically.</p>
                </div>
              </div>

              <div className="booking-account-note">
                <UserIcon />
                <div>
                  <strong>
                    {profile
                      ? 'Your account is connected'
                      : 'Login is required at confirmation'}
                  </strong>
                  <span>
                    {profile
                      ? 'You can edit these details if needed.'
                      : 'You can prepare the booking now and sign in when you confirm it.'}
                  </span>
                </div>
              </div>

              <form
                className="booking-details-form"
                onSubmit={continueStepTwo}
              >
                <div className="booking-form-grid">
                  <div className="booking-field">
                    <label htmlFor="booking-name">Full name *</label>
                    <input
                      ref={firstMissingRef}
                      id="booking-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-phone">Mobile number *</label>
                    <input
                      id="booking-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="booking-field">
                  <label htmlFor="booking-email">Email address *</label>
                  <input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="booking-notes">Special requirements</label>
                  <textarea
                    id="booking-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={5}
                    placeholder="Tell us about your occasion, preferred style, or any special requirements."
                  />
                </div>

                <div className="booking-form-actions">
                  <button
                    type="button"
                    className="booking-outline-button"
                    onClick={goBack}
                  >
                    <BackIcon />
                    Back
                  </button>

                  <button
                    type="submit"
                    className="booking-primary-button"
                  >
                    Continue
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 3 && (
            <section className="booking-panel">
              <div className="booking-panel-heading">
                <span className="booking-number">06</span>
                <div>
                  <span>SAVINGS</span>
                  <h2>Apply a discount</h2>
                  <p>Apply an active WildFloral promotional code.</p>
                </div>
              </div>

              <div className="booking-discount-input">
                <TagIcon />
                <input
                  value={discountCode}
                  onChange={(event) => {
                    setDiscountCode(event.target.value)
                    setDiscountMessage('')
                  }}
                  placeholder="Enter promo code"
                />
                <button type="button" onClick={applyDiscount}>
                  Apply
                </button>
              </div>

              {discountMessage && (
                <p
                  className={
                    appliedOffer
                      ? 'booking-discount-message success'
                      : 'booking-discount-message'
                  }
                >
                  {discountMessage}
                </p>
              )}

              {offers.filter((offer) => offer.promo_code).length > 0 && (
                <div className="booking-offers">
                  <span>AVAILABLE OFFERS</span>
                  <div>
                    {offers
                      .filter((offer) => offer.promo_code)
                      .slice(0, 4)
                      .map((offer) => (
                        <button
                          type="button"
                          key={offer.id}
                          onClick={() => {
                            setDiscountCode(offer.promo_code ?? '')
                            setDiscountMessage('')
                          }}
                        >
                          <strong>{offer.promo_code}</strong>
                          <small>
                            {offer.discount_type === 'percentage'
                              ? `${offer.discount_value}% off`
                              : `${formatCurrency(offer.discount_value)} off`}
                          </small>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="booking-price-breakdown">
                <div>
                  <span>Services subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="discount">
                  <span>Discount</span>
                  <strong>− {formatCurrency(discountAmount)}</strong>
                </div>
                <div className="total">
                  <span>Total</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
              </div>

              <div className="booking-form-actions">
                <button
                  type="button"
                  className="booking-outline-button"
                  onClick={goBack}
                >
                  <BackIcon />
                  Back
                </button>

                <button
                  type="button"
                  className="booking-primary-button"
                  onClick={continueStepThree}
                >
                  Preview booking
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="booking-panel booking-confirm-panel">
              <div className="booking-panel-heading">
                <span className="booking-number">07</span>
                <div>
                  <span>FINAL REVIEW</span>
                  <h2>Review your appointment</h2>
                  <p>Everything is ready. Check the details before confirming.</p>
                </div>
              </div>

              <div className="booking-review-services">
                <div className="booking-review-heading">
                  <span>YOUR SERVICES</span>
                  <button type="button" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>

                {selectedServices.map((service) => (
                  <article key={service.id}>
                    <div className="booking-review-image">
                      <img
                        src={service.image_url || assets.hero}
                        alt=""
                      />
                    </div>
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        {service.duration_minutes} min ·{' '}
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="booking-review-grid">
                <div>
                  <span>Date</span>
                  <strong>{formatDate(date)}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{formatRange(time)}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>
                    {location === 'studio'
                      ? 'WildFloral Studio'
                      : 'Home Service'}
                  </strong>
                </div>
                <div>
                  <span>Total duration</span>
                  <strong>{totalDuration} min</strong>
                </div>
                <div>
                  <span>Customer</span>
                  <strong>{name}</strong>
                </div>
                <div>
                  <span>Mobile</span>
                  <strong>{phone}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{email}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
              </div>

              {location === 'home' && (
                <div className="booking-review-note">
                  <span>HOME SERVICE ADDRESS</span>
                  <p>{address}</p>
                </div>
              )}

              {notes.trim() && (
                <div className="booking-review-note">
                  <span>YOUR REQUIREMENTS</span>
                  <p>{notes}</p>
                </div>
              )}

              <div className="booking-final-total">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>− {formatCurrency(discountAmount)}</strong>
                </div>
                <div>
                  <span>Payable total</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
              </div>

              <div className="booking-confirm-note">
                <UserIcon />
                <div>
                  <strong>
                    {profile
                      ? 'Ready to confirm your appointment'
                      : 'Secure login required'}
                  </strong>
                  <span>
                    {profile
                      ? 'Your appointment will start as Pending and can be updated by the studio.'
                      : 'Your selection is preserved. Sign in or register before the appointment can be created.'}
                  </span>
                </div>
              </div>

              <div className="booking-form-actions">
                <button
                  type="button"
                  className="booking-outline-button"
                  disabled={submitting}
                  onClick={goBack}
                >
                  <BackIcon />
                  Edit
                </button>

                <button
                  type="button"
                  className="booking-primary-button"
                  disabled={submitting}
                  onClick={handleConfirm}
                >
                  {submitting ? 'Submitting...' : 'Confirm Appointment'}
                  {!submitting && <CheckIcon />}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="booking-sidebar">
          <div className="booking-summary-card">
            <div className="booking-summary-heading">
              <div>
                <span>YOUR APPOINTMENT</span>
                <h2>Booking summary</h2>
              </div>
              <CalendarIcon />
            </div>

            {selectedServices.length ? (
              <div className="booking-summary-services">
                {selectedServices.map((service) => (
                  <article key={service.id}>
                    <div className="booking-summary-image">
                      <img
                        src={service.image_url || assets.hero}
                        alt=""
                      />
                    </div>

                    <div>
                      <span>{service.category || 'Beauty'}</span>
                      <strong>{service.name}</strong>
                      <small>
                        {service.duration_minutes} min ·{' '}
                        {formatCurrency(service.price)}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      aria-label={`Remove ${service.name}`}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="booking-summary-empty">
                Select a service to start your appointment.
              </div>
            )}

            <div className="booking-summary-divider" />

            <div className="booking-summary-meta">
              <div>
                <CalendarIcon />
                <span>{date ? formatDate(date) : 'Choose a date'}</span>
              </div>
              <div>
                <ClockIcon />
                <span>{time ? formatRange(time) : 'Choose a time'}</span>
              </div>
              <div>
                <LocationIcon />
                <span>
                  {location === 'studio'
                    ? 'WildFloral Studio'
                    : 'Home Service'}
                </span>
              </div>
            </div>

            <div className="booking-summary-total">
              <div>
                <span>Total duration</span>
                <strong>{totalDuration} min</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(totalPrice)}</strong>
              </div>
            </div>

            {appliedOffer && (
              <div className="booking-applied-discount">
                <TagIcon />
                <span>
                  {appliedOffer.promo_code} · {formatCurrency(discountAmount)} saved
                </span>
              </div>
            )}

            {!profile && (
              <div className="booking-login-note">
                <strong>Almost there</strong>
                <span>
                  You can select and review your appointment without logging in.
                  Login or registration is required only when you confirm.
                </span>
              </div>
            )}
          </div>

          <div className="booking-account-card">
            <span>YOUR ACCOUNT</span>
            <h3>Manage your appointments</h3>
            <p>
              After booking, you can view requests, pending appointments,
              confirmed appointments and completed visits.
            </p>

            <Link to="/account/bookings">
              View My Bookings
              <ArrowIcon />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Booking
