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

import { supabase } from '../../../lib/supabase'
import { assets } from '../../../assets/assets'

import './Enquiry.css'

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
  category_id: string | null
}

type BookingHistory = {
  id: string
  booking_date: string
  booking_time: string
  status: string
  price: number
  service_name: string
}

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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function formatShortDate(value: string) {
  if (!value) return '—'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

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

  return `${start.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })} – ${end.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
}

function titleCaseStatus(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === 'confirmed') return 'confirmed'
  if (normalized === 'completed') return 'completed'
  if (normalized === 'cancelled') return 'cancelled'
  if (normalized === 'pending' || normalized === 'requested') {
    return 'pending'
  }

  return 'pending'
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
        strokeLinejoin="round"
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
      <circle
        cx="8"
        cy="8"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

function Enquiry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const serviceSectionRef = useRef<HTMLElement | null>(null)

  const [services, setServices] = useState<Service[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [history, setHistory] = useState<BookingHistory[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [discountMessage, setDiscountMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState('')

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

    async function loadData() {
      setLoading(true)
      setError('')

      const [{ data: userData }, serviceResult, offerResult] = await Promise.all([
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
            service_id,
            category_id
          `)
          .eq('is_active', true)
          .lte('starts_at', new Date().toISOString())
          .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
          .order('created_at', { ascending: false }),
      ])

      if (!mounted) return

      if (serviceResult.error) {
        setError(serviceResult.error.message)
        setLoading(false)
        return
      }

      setServices(
        (serviceResult.data ?? []).map((row) => ({
          id: row.id,
          category: row.category,
          name: row.name,
          description: row.description,
          duration_minutes: Number(row.duration_minutes),
          price: Number(row.price),
          image_url: row.image_url,
        })),
      )

      setOffers(
        (offerResult.data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          discount_type: row.discount_type,
          discount_value: Number(row.discount_value),
          promo_code: row.promo_code,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          service_id: row.service_id,
          category_id: row.category_id,
        })),
      )

      const user = userData.user

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

        setHistoryLoading(true)

        const { data: bookingRows } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_time,
            status,
            price,
            services (
              name
            )
          `)
          .eq('customer_id', user.id)
          .order('booking_date', { ascending: false })
          .order('booking_time', { ascending: false })
          .limit(5)

        if (mounted) {
          setHistory(
            (bookingRows ?? []).map((row) => {
              const serviceRelation = Array.isArray(row.services)
                ? row.services[0]
                : row.services

              return {
                id: row.id,
                booking_date: row.booking_date,
                booking_time: row.booking_time,
                status: row.status,
                price: Number(row.price),
                service_name: serviceRelation?.name ?? 'Beauty service',
              }
            }),
          )
          setHistoryLoading(false)
        }
      }

      setLoading(false)
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [])

  const selectedServices = useMemo(
    () =>
      services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  )

  const subtotal = useMemo(
    () => selectedServices.reduce((total, service) => total + service.price, 0),
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

  const total = Math.max(0, subtotal - discountAmount)

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (totalValue, service) => totalValue + service.duration_minutes,
        0,
      ),
    [selectedServices],
  )

  const calendarDays = useMemo(() => {
    const days: Date[] = []

    for (let index = 0; index < 14; index += 1) {
      const dateValue = new Date()
      dateValue.setHours(0, 0, 0, 0)
      dateValue.setDate(dateValue.getDate() + index)
      days.push(dateValue)
    }

    return days
  }, [])

  function scrollToFirstMissing() {
    window.setTimeout(() => {
      firstFieldRef.current?.focus()
      firstFieldRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 80)
  }

  function setSelectedService(serviceId: string) {
    setError('')

    setSelectedIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  function removeService(serviceId: string) {
    setSelectedIds((current) => current.filter((id) => id !== serviceId))
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

    const matched = offers.find(
      (offer) => offer.promo_code?.trim().toLowerCase() === code,
    )

    if (!matched) {
      setDiscountMessage('This discount code is not valid or is no longer active.')
      return
    }

    const serviceEligible =
      !matched.service_id ||
      selectedServices.some((service) => service.id === matched.service_id)

    if (!serviceEligible) {
      setDiscountMessage('This code does not apply to the selected service.')
      return
    }

    setAppliedOffer(matched)
    setDiscountMessage(
      matched.discount_type === 'percentage'
        ? `${matched.discount_value}% discount applied.`
        : `${formatCurrency(matched.discount_value)} discount applied.`,
    )
  }

  function validateStepOne() {
    if (selectedServices.length === 0) {
      setError('Please select at least one service.')
      serviceSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return false
    }

    if (!date) {
      setError('Please select your preferred date.')
      setStep(1)
      return false
    }

    if (!time) {
      setError('Please select your preferred time slot.')
      setStep(1)
      return false
    }

    return true
  }

  function continueFromStepOne() {
    setError('')

    if (!validateStepOne()) return

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueFromStepTwo() {
    setError('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      scrollToFirstMissing()
      return
    }

    if (!phone.trim()) {
      setError('Please enter your mobile number.')
      scrollToFirstMissing()
      return
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(phone.trim())) {
      setError('Please enter a valid mobile number.')
      scrollToFirstMissing()
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      scrollToFirstMissing()
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      scrollToFirstMissing()
      return
    }

    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueFromStepThree() {
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

  async function confirmEnquiry(event?: FormEvent) {
    event?.preventDefault()
    setError('')

    if (!profile) {
      const redirect = `${window.location.pathname}${window.location.search}`
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
      const { data: existingBookings, error: availabilityError } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_date', date)
        .eq('booking_time', time)
        .in('status', ['pending', 'confirmed'])
        .limit(1)

      if (availabilityError) {
        setError(availabilityError.message)
        return
      }

      if ((existingBookings ?? []).length > 0) {
        setStep(1)
        setError('That time slot is no longer available. Please choose another slot.')
        return
      }

      const notesWithEnquiry = [
        'ENQUIRY REQUEST',
        appliedOffer
          ? `DISCOUNT CODE: ${appliedOffer.promo_code ?? discountCode.trim()}`
          : '',
        `DISCOUNT AMOUNT: ${formatCurrency(discountAmount)}`,
        notes.trim() ? `CUSTOMER REQUIREMENTS:\n${notes.trim()}` : '',
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
          notes: notesWithEnquiry,
          price: total,
          status: 'pending',
        })
        .select('id')
        .single()

      if (bookingError || !booking) {
        setError(
          bookingError?.message ??
            'Unable to submit your enquiry. Please try again.',
        )
        return
      }

      const { error: itemError } = await supabase
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

      if (itemError) {
        setError(
          'Your enquiry was created, but the service details could not be saved. Please contact the studio.',
        )
        return
      }

      setCreatedBookingId(booking.id)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submitError) {
      console.error('Enquiry submission error:', submitError)
      setError('Something went wrong while submitting your enquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetEnquiry() {
    setSelectedIds([])
    setDate('')
    setTime('')
    setAppliedOffer(null)
    setDiscountCode('')
    setDiscountMessage('')
    setNotes('')
    setStep(1)
    setSuccess(false)
    setCreatedBookingId('')
    navigate('/enquiry', { replace: true })
  }

  function goBack() {
    setError('')
    setStep((current) => Math.max(1, current - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <main className="enquiry-page">
        <div className="enquiry-loading">
          <span />
          <strong>Preparing your experience</strong>
          <small>Loading services and availability</small>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="enquiry-page enquiry-success-page">
        <section className="enquiry-success-card">
          <div className="enquiry-success-icon">
            <CheckIcon />
          </div>

          <span className="enquiry-eyebrow">ENQUIRY RECEIVED</span>

          <h1>
            Your experience is
            <span>on its way.</span>
          </h1>

          <p>
            Your request has been sent to WildFloral. We will review the
            details and update your appointment status.
          </p>

          <div className="enquiry-success-grid">
            <div>
              <span>Reference</span>
              <strong>{createdBookingId.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{formatShortDate(date)}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{formatRange(time)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="enquiry-success-actions">
            <Link to="/account/bookings" className="enquiry-primary-button">
              View My Appointments
              <ArrowIcon />
            </Link>

            <button
              type="button"
              className="enquiry-outline-button"
              onClick={resetEnquiry}
            >
              Send Another Enquiry
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="enquiry-page">
      <header className="enquiry-header">
        <span className="enquiry-eyebrow">WILDFLORAL ENQUIRY</span>
        <h1>
          Your experience,
          <span>designed around you.</span>
        </h1>
        <p>
          Tell us what you have in mind. Select your services, choose a
          preferred date and time, add your requirements, and review everything
          before sending your request.
        </p>
      </header>

      <nav className="enquiry-progress" aria-label="Enquiry progress">
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
            onClick={() => {
              if (index + 1 < step) {
                setStep(index + 1)
                setError('')
              }
            }}
            disabled={index + 1 >= step}
          >
            <span>{number}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </nav>

      {error && (
        <div className="enquiry-error" role="alert">
          {error}
        </div>
      )}

      <div className="enquiry-layout">
        <div className="enquiry-main">
          {step === 1 && (
            <>
              <section className="enquiry-panel" ref={serviceSectionRef}>
                <div className="enquiry-panel-heading">
                  <span className="enquiry-number">01</span>
                  <div>
                    <span>YOUR EXPERIENCE</span>
                    <h2>Choose your services</h2>
                    <p>Select only the services you want included in this enquiry.</p>
                  </div>
                </div>

                <div className="enquiry-service-grid">
                  {services.map((service) => {
                    const selected = selectedIds.includes(service.id)

                    return (
                      <button
                        type="button"
                        key={service.id}
                        className={
                          selected
                            ? 'enquiry-service-card selected'
                            : 'enquiry-service-card'
                        }
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="enquiry-service-image">
                          <img
                            src={service.image_url || assets.hero}
                            alt=""
                          />
                          <span className="enquiry-service-check">
                            {selected ? <CheckIcon /> : '+'}
                          </span>
                        </div>

                        <div className="enquiry-service-content">
                          <span>{service.category || 'Beauty'}</span>
                          <strong>{service.name}</strong>
                          <small>
                            {service.duration_minutes} min · {formatCurrency(service.price)}
                          </small>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="enquiry-panel">
                <div className="enquiry-panel-heading">
                  <span className="enquiry-number">02</span>
                  <div>
                    <span>WHEN</span>
                    <h2>Choose a preferred date</h2>
                    <p>You can select another date later if the studio suggests a different slot.</p>
                  </div>
                </div>

                <div className="enquiry-calendar-toolbar">
                  <label htmlFor="enquiry-date">
                    <CalendarIcon />
                    <span>Calendar date</span>
                  </label>
                  <input
                    id="enquiry-date"
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

                <div className="enquiry-date-strip">
                  {calendarDays.map((day) => {
                    const value = getDateKey(day)
                    const active = date === value

                    return (
                      <button
                        type="button"
                        key={value}
                        className={active ? 'active' : ''}
                        onClick={() => {
                          setDate(value)
                          setTime('')
                          setError('')
                        }}
                      >
                        <span>
                          {day.toLocaleDateString('en-IN', {
                            weekday: 'short',
                          })}
                        </span>
                        <strong>{day.getDate()}</strong>
                        <small>
                          {day.toLocaleDateString('en-IN', {
                            month: 'short',
                          })}
                        </small>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="enquiry-panel">
                <div className="enquiry-panel-heading">
                  <span className="enquiry-number">03</span>
                  <div>
                    <span>WHEN</span>
                    <h2>Choose a time range</h2>
                    <p>Select a one-hour preferred slot for your request.</p>
                  </div>
                </div>

                <div className="enquiry-time-grid">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      className={time === slot ? 'active' : ''}
                      onClick={() => {
                        setTime(slot)
                        setError('')
                      }}
                    >
                      <ClockIcon />
                      <span>{formatRange(slot)}</span>
                      {time === slot && <CheckIcon />}
                    </button>
                  ))}
                </div>
              </section>

              <button
                type="button"
                className="enquiry-primary-button enquiry-next-button"
                onClick={continueFromStepOne}
              >
                Continue to your details
                <ArrowIcon />
              </button>
            </>
          )}

          {step === 2 && (
            <section className="enquiry-panel">
              <div className="enquiry-panel-heading">
                <span className="enquiry-number">04</span>
                <div>
                  <span>YOUR DETAILS</span>
                  <h2>Tell us about you</h2>
                  <p>Your account information is used automatically when available.</p>
                </div>
              </div>

              <form
                className="enquiry-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  continueFromStepTwo()
                }}
              >
                <div className="enquiry-account-note">
                  <UserIcon />
                  <div>
                    <strong>
                      {profile
                        ? 'Your account is connected'
                        : 'Sign in before confirming'}
                    </strong>
                    <span>
                      {profile
                        ? 'Your saved name and email have been filled in for you.'
                        : 'You can prepare the enquiry now. Login or registration is required before confirmation.'}
                    </span>
                  </div>
                </div>

                <div className="enquiry-form-grid">
                  <div className="enquiry-field">
                    <label htmlFor="enquiry-name">Full name *</label>
                    <input
                      ref={firstFieldRef}
                      id="enquiry-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div className="enquiry-field">
                    <label htmlFor="enquiry-phone">Mobile number *</label>
                    <input
                      id="enquiry-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="enquiry-field">
                  <label htmlFor="enquiry-email">Email address *</label>
                  <input
                    id="enquiry-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="enquiry-field">
                  <label htmlFor="enquiry-notes">Your requirements</label>
                  <textarea
                    id="enquiry-notes"
                    rows={6}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Tell us about the occasion, preferred style, custom requirements, or anything our team should know."
                  />
                </div>

                <div className="enquiry-form-actions">
                  <button
                    type="button"
                    className="enquiry-outline-button"
                    onClick={goBack}
                  >
                    <BackIcon />
                    Back
                  </button>

                  <button type="submit" className="enquiry-primary-button">
                    Continue
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 3 && (
            <section className="enquiry-panel">
              <div className="enquiry-panel-heading">
                <span className="enquiry-number">05</span>
                <div>
                  <span>SAVINGS</span>
                  <h2>Apply a discount code</h2>
                  <p>Use an active WildFloral promotion to reduce your total.</p>
                </div>
              </div>

              <div className="enquiry-discount-box">
                <div className="enquiry-discount-input">
                  <TagIcon />
                  <input
                    value={discountCode}
                    onChange={(event) => {
                      setDiscountCode(event.target.value)
                      setDiscountMessage('')
                    }}
                    placeholder="Enter promo code"
                    autoCapitalize="characters"
                  />
                  <button type="button" onClick={applyDiscount}>
                    Apply
                  </button>
                </div>

                {discountMessage && (
                  <p
                    className={
                      appliedOffer
                        ? 'enquiry-discount-message success'
                        : 'enquiry-discount-message'
                    }
                  >
                    {discountMessage}
                  </p>
                )}
              </div>

              {offers.filter((offer) => offer.promo_code).length > 0 && (
                <div className="enquiry-offer-list">
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

              <div className="enquiry-pricing-breakdown">
                <div>
                  <span>Services subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="discount-row">
                  <span>Discount</span>
                  <strong>
                    {discountAmount > 0
                      ? `− ${formatCurrency(discountAmount)}`
                      : formatCurrency(0)}
                  </strong>
                </div>
                <div className="total-row">
                  <span>Estimated total</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>

              <div className="enquiry-form-actions">
                <button
                  type="button"
                  className="enquiry-outline-button"
                  onClick={goBack}
                >
                  <BackIcon />
                  Back
                </button>

                <button
                  type="button"
                  className="enquiry-primary-button"
                  onClick={continueFromStepThree}
                >
                  Preview request
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="enquiry-panel">
              <div className="enquiry-panel-heading">
                <span className="enquiry-number">06</span>
                <div>
                  <span>FINAL REVIEW</span>
                  <h2>Preview your enquiry</h2>
                  <p>Check everything once before sending your request.</p>
                </div>
              </div>

              <div className="enquiry-preview">
                <div className="enquiry-preview-section">
                  <div>
                    <span>YOUR SERVICES</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Edit
                    </button>
                  </div>

                  {selectedServices.map((service) => (
                    <article key={service.id}>
                      <div className="enquiry-preview-image">
                        <img
                          src={service.image_url || assets.hero}
                          alt=""
                        />
                      </div>
                      <div>
                        <strong>{service.name}</strong>
                        <span>
                          {service.duration_minutes} min · {formatCurrency(service.price)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="enquiry-preview-grid">
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(date)}</strong>
                  </div>
                  <div>
                    <span>Preferred time</span>
                    <strong>{formatRange(time)}</strong>
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
                    <span>Duration</span>
                    <strong>{totalDuration} min</strong>
                  </div>
                </div>

                {notes.trim() && (
                  <div className="enquiry-preview-notes">
                    <span>REQUIREMENTS</span>
                    <p>{notes}</p>
                  </div>
                )}

                <div className="enquiry-preview-price">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <strong>− {formatCurrency(discountAmount)}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>

              <div className="enquiry-login-warning">
                <UserIcon />
                <div>
                  <strong>
                    {profile
                      ? 'Ready to send your enquiry'
                      : 'Login or register to confirm'}
                  </strong>
                  <span>
                    {profile
                      ? 'Your request will start as Pending and can later move to Confirmed and Completed.'
                      : 'Your selected services and enquiry details are preserved. After login or registration you will return here to confirm.'}
                  </span>
                </div>
              </div>

              <form
                className="enquiry-form-actions"
                onSubmit={confirmEnquiry}
              >
                <button
                  type="button"
                  className="enquiry-outline-button"
                  disabled={submitting}
                  onClick={goBack}
                >
                  <BackIcon />
                  Edit
                </button>

                <button
                  type="submit"
                  className="enquiry-primary-button"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Confirm Enquiry'}
                  {!submitting && <CheckIcon />}
                </button>
              </form>
            </section>
          )}
        </div>

        <aside className="enquiry-sidebar">
          <div className="enquiry-summary-card">
            <div className="enquiry-summary-heading">
              <div>
                <span>YOUR EXPERIENCE</span>
                <h2>Selected services</h2>
              </div>
              <span className="enquiry-summary-count">
                {selectedServices.length}
              </span>
            </div>

            {selectedServices.length === 0 ? (
              <div className="enquiry-summary-empty">
                <strong>Your selection is empty</strong>
                <span>Add a service to start your enquiry.</span>
              </div>
            ) : (
              <div className="enquiry-summary-services">
                {selectedServices.map((service) => (
                  <article key={service.id}>
                    <div className="enquiry-summary-image">
                      <img
                        src={service.image_url || assets.hero}
                        alt=""
                      />
                    </div>
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        {service.duration_minutes} min · {formatCurrency(service.price)}
                      </span>
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
            )}

            <div className="enquiry-summary-divider" />

            <div className="enquiry-summary-meta">
              <div>
                <CalendarIcon />
                <span>
                  {date ? formatShortDate(date) : 'Choose date'}
                </span>
              </div>
              <div>
                <ClockIcon />
                <span>
                  {time ? formatRange(time) : 'Choose time'}
                </span>
              </div>
            </div>

            <div className="enquiry-summary-total">
              <span>Estimated total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {appliedOffer && (
              <div className="enquiry-applied-discount">
                <TagIcon />
                <span>
                  {appliedOffer.promo_code} · {formatCurrency(discountAmount)} saved
                </span>
              </div>
            )}

            <button
              type="button"
              className="enquiry-sidebar-button"
              onClick={() => {
                if (selectedServices.length === 0) {
                  setStep(1)
                  serviceSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                  return
                }

                setStep(Math.min(step + 1, 4))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              {step === 4 ? 'Review complete' : 'Continue'}
              <ArrowIcon />
            </button>
          </div>

          <div className="enquiry-history-card">
            <div>
              <span>YOUR JOURNEY</span>
              <h3>Previous appointments</h3>
            </div>

            {!profile ? (
              <div className="enquiry-history-empty">
                <span>Sign in to view your appointment history.</span>
                <Link to="/login">Login</Link>
              </div>
            ) : historyLoading ? (
              <div className="enquiry-history-empty">
                <span>Loading your appointments...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="enquiry-history-empty">
                <span>No previous appointments yet.</span>
                <Link to="/services">Explore services</Link>
              </div>
            ) : (
              <div className="enquiry-history-list">
                {history.map((booking) => (
                  <article key={booking.id}>
                    <div>
                      <strong>{booking.service_name}</strong>
                      <span>
                        {formatShortDate(booking.booking_date)} ·{' '}
                        {formatTime(booking.booking_time)}
                      </span>
                    </div>
                    <div>
                      <span className={`enquiry-status ${getStatusClass(booking.status)}`}>
                        {booking.status.toLowerCase() === 'pending'
                          ? 'Requested'
                          : titleCaseStatus(booking.status)}
                      </span>
                      <strong>{formatCurrency(booking.price)}</strong>
                    </div>
                  </article>
                ))}

                <Link
                  to="/account/bookings"
                  className="enquiry-history-link"
                >
                  View all appointments
                  <ArrowIcon />
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Enquiry
