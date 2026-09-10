import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import {
  CalendarDays,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import {
  createInitialBookingFlow,
  setBookingStep,
  type BookingFlowState,
} from '../../../lib/bookingFlow'

import {
  clearBookingCart,
} from '../../../lib/bookingCart'

import {
  createEnquiry,
} from '../../../lib/enquiries'

import {
  getServices,
  type Service,
} from '../../../lib/services'

import { supabase } from '../../../lib/supabase'

import SelectedServicesStep from '../Booking/steps/SelectedServicesStep'

import PeopleDetailsStep, {
  type BookingPersonTotal,
} from '../Booking/steps/PeopleDetailsStep'

import DateTimeStep from '../Booking/steps/DateTimeStep'

import ContactPreferenceStep from '../Booking/steps/ContactPreferenceStep'

import ReviewStep from '../Booking/steps/ReviewStep'

import type {
  BookingPerson,
  BookingService,
} from '../Booking/Booking'

import '../Booking/Booking.css'
import './Enquiry.css'

/* =========================================================
   TYPES
========================================================= */

type EnquiryContactPreference =
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'
  | ''

type EnquiryState =
  BookingFlowState & {
    contactPreference:
      EnquiryContactPreference
  }

/* =========================================================
   HELPERS
========================================================= */

function cleanServiceIds(
  ids: string[],
): string[] {
  return [
    ...new Set(
      ids
        .filter(
          (
            id,
          ): id is string =>
            typeof id === 'string',
        )
        .map(
          (id) =>
            id.trim(),
        )
        .filter(Boolean),
    ),
  ]
}

const ENQUIRY_FLOW_STORAGE_KEY =
  'wildfloral_enquiry_flow'

function createEnquiryFlow(): EnquiryState {
  const flow =
    createInitialBookingFlow(
      'enquiry',
    )

  return {
    ...flow,

    mode: 'enquiry',

    contactPreference: '',
  }
}

function loadEnquiryFlow(): EnquiryState | null {
  try {
    const raw =
      window.localStorage.getItem(
        ENQUIRY_FLOW_STORAGE_KEY,
      )

    if (!raw) {
      return null
    }

    const parsed =
      JSON.parse(raw) as EnquiryState

    if (
      !parsed ||
      !Array.isArray(parsed.people)
    ) {
      return null
    }

    return {
      ...parsed,

      mode: 'enquiry',

      contactPreference:
        parsed.contactPreference ?? '',

      people:
        parsed.people.map(
          (person) => ({
            ...person,

            serviceIds:
              cleanServiceIds(
                Array.isArray(
                  person.serviceIds,
                )
                  ? person.serviceIds
                  : [],
              ),
          }),
        ),
    }
  } catch {
    return null
  }
}

function saveEnquiryFlow(
  flow: EnquiryState,
) {
  window.localStorage.setItem(
    ENQUIRY_FLOW_STORAGE_KEY,
    JSON.stringify({
      ...flow,

      mode: 'enquiry',

      people:
        flow.people.map(
          (person) => ({
            ...person,

            serviceIds:
              cleanServiceIds(
                person.serviceIds,
              ),
          }),
        ),
    }),
  )
}

function getCurrentFlow(): EnquiryState {
  const existing =
    loadEnquiryFlow()

  if (!existing) {
    return createEnquiryFlow()
  }

  return {
    ...existing,

    mode: 'enquiry',

    contactPreference:
      existing.contactPreference ?? '',
  }
}

/* =========================================================
   SERVICE MAPPER
========================================================= */

function mapService(
  service: Service,
): BookingService {
  const basePrice =
    Number(
      service.price,
    ) || 0

  const offerPrice =
    Number(
      service.offerPrice,
    ) || basePrice

  const originalPrice =
    Number(
      service.originalPrice,
    ) || basePrice

  const discountAmount =
    Number(
      service.discountAmount,
    ) || Math.max(
      originalPrice -
        offerPrice,
      0,
    )

  return {
    id:
      service.id,

    category:
      service.category ?? null,

    name:
      service.name,

    description:
      service.description ??
      null,

    durationMinutes:
      Number(
        service.durationMinutes,
      ) || 0,

    /*
     * IMPORTANT:
     *
     * price is the effective price used
     * throughout the booking flow.
     */
    price:
      offerPrice,

    originalPrice:
      Math.max(
        originalPrice,
        offerPrice,
      ),

    offerPrice,

    discountAmount,

    discountLabel:
      service.discountLabel ??
      (
        discountAmount > 0 &&
        originalPrice > 0
          ? `${Math.round(
              (
                discountAmount /
                originalPrice
              ) * 100,
            )}% OFF`
          : null
      ),

    imageUrl:
      service.imageUrl ??
      null,
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function Enquiry() {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] =
    useSearchParams()

  const [
    flow,
    setFlow,
  ] =
    useState<EnquiryState | null>(
      null,
    )

  const [
    services,
    setServices,
  ] =
    useState<Service[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    success,
    setSuccess,
  ] =
    useState(false)

  const [
    createdEnquiryId,
    setCreatedEnquiryId,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  /* =======================================================
     INITIALISE
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function initialise() {
      setLoading(true)
      setError('')

      try {
        const singleService =
  searchParams.get(
    'service',
  )

const servicesParam =
  searchParams.get(
    'services',
  )

const assignTo =
  searchParams.get(
    'assignTo',
  )

const hasNewService =
  Boolean(
    singleService ||
    servicesParam,
  )

let current =
  hasNewService && !assignTo
    ? createEnquiryFlow()
    : getCurrentFlow()

        const queryIds =
          servicesParam
            ? cleanServiceIds(
                servicesParam
                  .split(',')
                  .map(
                    (id) =>
                      id.trim(),
                  ),
              )
            : singleService
              ? cleanServiceIds([
                  singleService,
                ])
              : []

        /*
         * ---------------------------------------------------
         * SERVICE ASSIGNMENT
         * ---------------------------------------------------
         *
         * Normal enquiry:
         *   selected services -> person 1
         *
         * Person-specific selection:
         *   assignTo=PERSON_ID
         *   selected services -> that person
         */
        if (
          queryIds.length > 0
        ) {
          const targetPersonIndex =
            current.people.findIndex(
              (
                person,
              ) =>
                Boolean(
                  assignTo &&
                  person.id ===
                    assignTo,
                ),
            )

          const targetIndex =
            targetPersonIndex >=
            0
              ? targetPersonIndex
              : 0

          const nextPeople =
  current.people.map(
    (
      person,
      index,
    ) =>
      index ===
      targetIndex
        ? {
            ...person,

            serviceIds:
              cleanServiceIds([
                ...person.serviceIds,
                ...queryIds,
              ]),
          }
        : person,
  )

          current = {
            ...current,

            people:
              nextPeople,

            step: 1,
          }
        }
        /*
 * The enquiry owns the selected services now.
 * Clear the public Services-page cart so removed
 * enquiry services cannot reappear when returning
 * to /services.
 */
clearBookingCart()

        current = {
          ...current,

          mode: 'enquiry',
        }

        saveEnquiryFlow(
          current,
        )

        if (!cancelled) {
          setFlow(current)
        }
      } catch (
        initialiseError
      ) {
        if (!cancelled) {
          setError(
            initialiseError instanceof
              Error
              ? initialiseError.message
              : 'Unable to prepare your enquiry.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initialise()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  /* =======================================================
     LOAD SERVICES
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadEnquiryServices() {
      try {
        const result =
          await getServices()

        if (cancelled) {
          return
        }

        setServices(
          result,
        )
      } catch (
        serviceError
      ) {
        if (!cancelled) {
          setError(
            serviceError instanceof
              Error
              ? serviceError.message
              : 'Unable to load services.',
          )
        }
      }
    }

    void loadEnquiryServices()

    return () => {
      cancelled = true
    }
  }, [])

  /* =======================================================
     BOOKING SERVICE CATALOGUE
  ======================================================= */

  const bookingServices =
    useMemo(
      () =>
        services.map(
          mapService,
        ),
      [services],
    )

  /* =======================================================
     SERVICE MAP
  ======================================================= */

  const serviceMap =
    useMemo(
      () =>
        new Map<
          string,
          BookingService
        >(
          bookingServices.map(
            (
              service,
            ) => [
              service.id,
              service,
            ],
          ),
        ),
      [bookingServices],
    )

  /* =======================================================
     PEOPLE TOTALS
  ======================================================= */

  const peopleTotals =
    useMemo<
      BookingPersonTotal[]
    >(
      () => {
        if (!flow) {
          return []
        }

        return flow.people.map(
          (
            person,
          ) => {
            const personServices =
              cleanServiceIds(
                person.serviceIds,
              )
                .map(
                  (
                    serviceId,
                  ) =>
                    serviceMap.get(
                      serviceId,
                    ),
                )
                .filter(
                  (
                    service,
                  ): service is BookingService =>
                    Boolean(service),
                )

            const personSubtotal =
              personServices.reduce(
                (
                  totalValue,
                  service,
                ) =>
                  totalValue +
                  (
                    Number(
                      service.offerPrice,
                    ) || 0
                  ),
                0,
              )

            return {
              person:
                person as BookingPerson,

              services:
                personServices,

              subtotal:
                personSubtotal,
            }
          },
        )
      },
      [
        flow,
        serviceMap,
      ],
    )

  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
    useMemo(
      () =>
        peopleTotals.reduce(
          (
            totalValue,
            person,
          ) =>
            totalValue +
            person.subtotal,
          0,
        ),
      [peopleTotals],
    )

  const discountAmount =
    useMemo(
      () =>
        Math.min(
          Math.max(
            Number(
              flow?.discountAmount,
            ) || 0,
            0,
          ),
          subtotal,
        ),
      [
        flow?.discountAmount,
        subtotal,
      ],
    )

  const total =
    Math.max(
      subtotal -
        discountAmount,
      0,
    )

  /* =======================================================
     UPDATE FLOW
  ======================================================= */

 function updateFlow(
  updates: Partial<EnquiryState>,
) {
  setFlow((current) => {
    const base =
      current ?? getCurrentFlow()

    const next: EnquiryState = {
      ...base,

      ...updates,

      mode: 'enquiry',
    }

    saveEnquiryFlow(next)

    return next
  })
}


  /* =======================================================
     UPDATE PERSON
  ======================================================= */

  function handlePersonField(
    personId: string,
    field:
      | 'name'
      | 'phone'
      | 'email',
    value: string,
  ) {
    if (!flow) {
      return
    }

    const nextPeople =
      flow.people.map(
        (
          person,
        ) =>
          person.id ===
          personId
            ? {
                ...person,
                [field]:
                  value,
              }
            : person,
      )

    updateFlow({
      people:
        nextPeople,
    })
  }

  /* =======================================================
     ADD PERSON
  ======================================================= */

  function handleAddPerson() {
    if (!flow) {
      return
    }

    const newPerson: BookingPerson = {
      id:
        crypto.randomUUID(),

      name: '',

      phone: '',

      email: '',

      serviceIds: [],
    }

    updateFlow({
      people: [
        ...flow.people,
        newPerson,
      ],
    })
  }

  /* =======================================================
     REMOVE PERSON
  ======================================================= */

  function handleRemovePerson(
    personId: string,
  ) {
    if (!flow) {
      return
    }

    let nextPeople =
      flow.people.filter(
        (
          person,
        ) =>
          person.id !==
          personId,
      )

    if (
      nextPeople.length ===
      0
    ) {
      nextPeople = [
        {
          id:
            crypto.randomUUID(),

          name: '',

          phone: '',

          email: '',

          serviceIds: [],
        },
      ]
    }

    updateFlow({
      people:
        nextPeople,
    })
  }

  /* =======================================================
     REMOVE PERSON SERVICE
  ======================================================= */

  function handleRemovePersonService(
    personId: string,
    serviceId: string,
  ) {
    if (!flow) {
      return
    }

    const nextPeople =
      flow.people.map(
        (
          person,
        ) =>
          person.id ===
          personId
            ? {
                ...person,

                serviceIds:
                  person.serviceIds.filter(
                    (
                      id,
                    ) =>
                      id !==
                      serviceId,
                  ),
              }
            : person,
      )

    updateFlow({
      people:
        nextPeople,
    })
  }

  /* =======================================================
     ADD SERVICE TO PERSON
  ======================================================= */

  function handleAddPersonService(
    personId: string,
  ) {
    navigate(
      `/services?assignTo=${encodeURIComponent(
        personId,
      )}&mode=enquiry`,
    )
  }

  /* =======================================================
     NEXT STEP
  ======================================================= */

  function goNext() {
    if (!flow) {
      return
    }

    setError('')

    const currentStep =
      Number(
        flow.step,
      ) || 1

    /* STEP 1 */

    if (
      currentStep ===
      1
    ) {
      const hasServices =
        flow.people.some(
          (
            person,
          ) =>
            person.serviceIds.length >
            0,
        )

      if (!hasServices) {
        setError(
          'Please select at least one beauty service.',
        )

        return
      }
    }

    /* STEP 2 */

    if (
      currentStep ===
      2
    ) {
      if (
        flow.people.length ===
        0
      ) {
        setError(
          'Please add at least one person.',
        )

        return
      }

      for (
        const person of flow.people
      ) {
        const name =
          person.name.trim()

        const phone =
          person.phone
            .replace(
              /\D/g,
              '',
            )

        const email =
          person.email.trim()

        if (!name) {
          setError(
            'Please enter the name for every person.',
          )

          return
        }

        if (
          phone.length !==
          10
        ) {
          setError(
            `Please enter a valid phone number for ${name}.`,
          )

          return
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email,
          )
        ) {
          setError(
            `Please enter a valid email address for ${name}.`,
          )

          return
        }

        if (
          person.serviceIds.length ===
          0
        ) {
          setError(
            `${name} must have at least one service.`,
          )

          return
        }
      }
    }

    /* STEP 3 */

    if (
      currentStep ===
      3
    ) {
      if (!flow.date) {
        setError(
          'Please select your preferred date.',
        )

        return
      }

      if (!flow.time) {
        setError(
          'Please select your preferred time.',
        )

        return
      }
    }

    /* STEP 4 */

    if (
      currentStep ===
      4
    ) {
      if (
        !flow.contactPreference
      ) {
        setError(
          'Please select your preferred contact method.',
        )

        return
      }
    }

    const nextStep =
      Math.min(
        currentStep + 1,
        5,
      )

    updateFlow({
      step:
        nextStep,
    })

    setBookingStep(
      nextStep,
    )
  }

  /* =======================================================
     BACK
  ======================================================= */

  function goBack() {
    if (!flow) {
      return
    }

    const previousStep =
      Math.max(
        flow.step - 1,
        1,
      )

    updateFlow({
      step:
        previousStep,
    })

    setBookingStep(
      previousStep,
    )
  }

  /* =======================================================
     SUBMIT ENQUIRY
  ======================================================= */

  async function submitEnquiry() {
    if (!flow) {
      return
    }

    setError('')

    if (
      !flow.date ||
      !flow.time
    ) {
      setError(
        'Preferred date and time are required.',
      )

      updateFlow({
        step: 3,
      })

      return
    }

    if (
      !flow.contactPreference
    ) {
      setError(
        'Please select your preferred contact method.',
      )

      updateFlow({
        step: 4,
      })

      return
    }

    const selectedPeople =
      flow.people.filter(
        (
          person,
        ) =>
          person.serviceIds.length >
          0,
      )

    if (
      selectedPeople.length ===
      0
    ) {
      setError(
        'Please select at least one beauty service.',
      )

      updateFlow({
        step: 1,
      })

      return
    }

    for (
      const person of selectedPeople
    ) {
      if (
        !person.name.trim()
      ) {
        setError(
          'Please enter the name for every person.',
        )

        updateFlow({
          step: 2,
        })

        return
      }

      const phone =
        person.phone.replace(
          /\D/g,
          '',
        )

      if (
        phone.length !==
        10
      ) {
        setError(
          `Please enter a valid phone number for ${person.name}.`,
        )

        updateFlow({
          step: 2,
        })

        return
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          person.email.trim(),
        )
      ) {
        setError(
          `Please enter a valid email address for ${person.name}.`,
        )

        updateFlow({
          step: 2,
        })

        return
      }

      if (
        person.serviceIds.length ===
        0
      ) {
        setError(
          `${person.name} must have at least one service.`,
        )

        updateFlow({
          step: 2,
        })

        return
      }
    }

    setSubmitting(true)

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      if (!user) {
        navigate(
          `/login?redirect=${encodeURIComponent(
            '/enquiry',
          )}`,
          {
            replace: true,
          },
        )

        return
      }

      /*
       * Build the exact service IDs that actually
       * exist in the current catalogue.
       */
      const enquiryPeople =
        selectedPeople.map(
          (
            person,
          ) => ({
            name:
              person.name.trim(),

            phone:
              person.phone.trim(),

            email:
              person.email.trim(),

            serviceIds:
              cleanServiceIds(
                person.serviceIds,
              ).filter(
                (
                  serviceId,
                ) =>
                  serviceMap.has(
                    serviceId,
                  ),
              ),
          }),
        )

      const validPeople =
        enquiryPeople.filter(
          (
            person,
          ) =>
            person.serviceIds.length >
            0,
        )

      if (
        validPeople.length ===
        0
      ) {
        throw new Error(
          'None of the selected services are currently available.',
        )
      }

      /*
       * Recalculate from the same service map used
       * by the ReviewStep.
       */
      const finalSubtotal =
        validPeople.reduce(
          (
            peopleTotal,
            person,
          ) =>
            peopleTotal +
            person.serviceIds.reduce(
              (
                personTotal,
                serviceId,
              ) => {
                const service =
                  serviceMap.get(
                    serviceId,
                  )

                return (
                  personTotal +
                  (
                    Number(
                      service?.offerPrice,
                    ) || 0
                  )
                )
              },
              0,
            ),
          0,
        )

      const finalDiscount =
        Math.min(
          Math.max(
            Number(
              flow.discountAmount,
            ) || 0,
            0,
          ),
          finalSubtotal,
        )

      const finalTotal =
        Math.max(
          finalSubtotal -
            finalDiscount,
          0,
        )

      const created =
        await createEnquiry({
          customerId:
            user.id,

          preferredDate:
            flow.date,

          preferredTime:
            flow.time,

          contactPreference:
            flow.contactPreference,

          notes:
            flow.notes?.trim() ||
            '',

          subtotal:
            finalSubtotal,

          discountAmount:
            finalDiscount,

          totalAmount:
            finalTotal,

          people:
            validPeople,
        })

      setCreatedEnquiryId(
        created.id,
      )

      /*
       * Do not leave the submitted enquiry as an
       * unfinished booking draft.
       */
 window.localStorage.removeItem(
  'wildfloral_enquiry_flow',
)

setSuccess(true)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (
      submitError
    ) {
      console.error(
        'Enquiry submission error:',
        submitError,
      )

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Unable to submit your enquiry. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !flow
  ) {
    return (
      <main className="enquiry-page">
        <div className="enquiry-loading">
          <span>
            Preparing your enquiry...
          </span>
        </div>
      </main>
    )
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (success) {
    return (
      <main className="enquiry-page enquiry-success-page">
        <section className="enquiry-success-card">

          <div className="enquiry-success-icon">
            ✓
          </div>

          <span className="enquiry-success-eyebrow">
            ENQUIRY RECEIVED
          </span>

          <h1>
            Thank you for
            <span>
              choosing WildFloral.
            </span>
          </h1>

          <p>
            Your beauty service enquiry
            has been successfully submitted.
            Our team will review your request
            and contact you through your
            selected preference.
          </p>

          <div className="enquiry-success-reference">
            <span>
              Reference
            </span>

            <strong>
              {createdEnquiryId
                .slice(
                  0,
                  8,
                )
                .toUpperCase()}
            </strong>
          </div>

          <button
            type="button"
            className="enquiry-primary-button"
            onClick={() =>
              navigate(
                '/services',
              )
            }
          >
            Explore Services
          </button>

        </section>
      </main>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

 return (
  <main className="booking-page enquiry-page">

    {/* =================================================
        TOP BAR
    ================================================= */}

    <header className="booking-topbar">

      <div className="booking-topbar-inner">

        <div className="booking-top-brand">

          <div className="booking-brand-mark">
            W
          </div>

          <div className="booking-brand-copy">

            <strong>
              WildFloral
            </strong>

            <span>
              BEAUTY & FASHION STUDIO
            </span>

          </div>

        </div>

        <div className="booking-top-center">
          <span>
            BEAUTY · FASHION · YOU
          </span>
        </div>

        <div className="booking-top-right">

          <Sparkles
            size={15}
          />

          <span>
            PERSONALIZED EXPERIENCE
          </span>

        </div>

      </div>

    </header>


    {/* =================================================
        HERO
    ================================================= */}

    <section className="booking-hero">

      <div className="booking-hero-glow booking-hero-glow-one" />

      <div className="booking-hero-glow booking-hero-glow-two" />

      <div className="booking-container">

        <div className="booking-hero-grid">

          <div className="booking-hero-copy">

            <div className="booking-hero-kicker">

              <span />

              WILDFLORAL BEAUTY

              <span />

            </div>

            <h1>
              Share your
              <em>
                enquiry.
              </em>
            </h1>

            <p>
              Tell us what you are looking for
              and our team will create a
              personalized beauty experience
              around your needs.
            </p>

            <div className="booking-hero-benefits">

              <div className="booking-hero-benefit">

                <span>
                  <ShieldCheck size={17} />
                </span>

                <div>
                  <strong>
                    Trusted
                  </strong>

                  <small>
                    Professionals
                  </small>
                </div>

              </div>

              <div className="booking-hero-benefit">

                <span>
                  <Sparkles size={17} />
                </span>

                <div>
                  <strong>
                    Premium
                  </strong>

                  <small>
                    Experience
                  </small>
                </div>

              </div>

              <div className="booking-hero-benefit">

                <span>
                  <Clock3 size={17} />
                </span>

                <div>
                  <strong>
                    Easy
                  </strong>

                  <small>
                    Enquiry
                  </small>
                </div>

              </div>

            </div>

          </div>


          <div className="booking-hero-visual">

            <div className="booking-calendar-card">

              <div className="booking-calendar-top">

                <span>
                  YOUR EXPERIENCE
                </span>

                <CalendarDays
                  size={17}
                />

              </div>

              <div className="booking-calendar-title">

                <strong>
                  Your time,
                </strong>

                <em>
                  your style.
                </em>

              </div>

              <div className="booking-calendar-grid">

                {[
                  'M',
                  'T',
                  'W',
                  'T',
                  'F',
                  'S',
                  'S',
                ].map(
                  (
                    day,
                    index,
                  ) => (
                    <span
                      key={`week-${index}`}
                      className="calendar-weekday"
                    >
                      {day}
                    </span>
                  ),
                )}

                {[
                  '1',
                  '2',
                  '3',
                  '4',
                  '5',
                  '6',
                  '7',
                  '8',
                  '9',
                  '10',
                  '11',
                  '12',
                  '13',
                  '14',
                ].map(
                  (
                    day,
                    index,
                  ) => (
                    <span
                      key={day}
                      className={
                        index === 8
                          ? 'selected'
                          : ''
                      }
                    >
                      {index === 8 ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        day
                      )}
                    </span>
                  ),
                )}

              </div>

              <div className="booking-calendar-footer">

                <Clock3
                  size={14}
                />

                <span>
                  Flexible enquiry
                </span>

              </div>

            </div>

            <div className="booking-hero-orbit booking-hero-orbit-one" />

            <div className="booking-hero-orbit booking-hero-orbit-two" />

            <div className="booking-hero-flower">
              ✦
            </div>

          </div>

        </div>

      </div>

    </section>


    {/* =================================================
        TRUST STRIP
    ================================================= */}

    <section className="booking-trust-strip">

      <div className="booking-container">

        <div className="booking-trust-grid">

          <div className="booking-trust-item">

            <span>
              <ShieldCheck size={16} />
            </span>

            <div>
              <strong>
                Personalized
              </strong>

              <small>
                Designed for you
              </small>
            </div>

          </div>

          <div className="booking-trust-item">

            <span>
              <Sparkles size={16} />
            </span>

            <div>
              <strong>
                Premium Quality
              </strong>

              <small>
                Carefully selected
              </small>
            </div>

          </div>

          <div className="booking-trust-item">

            <span>
              <Clock3 size={16} />
            </span>

            <div>
              <strong>
                Save Your Time
              </strong>

              <small>
                Simple enquiry
              </small>
            </div>

          </div>

          <div className="booking-trust-item">

            <span>
              <ShieldCheck size={16} />
            </span>

            <div>
              <strong>
                Secure & Safe
              </strong>

              <small>
                Your details protected
              </small>
            </div>

          </div>

        </div>

      </div>

    </section>


    {/* =================================================
        STEP HEADER
    ================================================= */}

    <section className="booking-step-header">

      <div className="booking-container">

        <button
          type="button"
          className="booking-step-back"
          onClick={goBack}
          disabled={submitting}
        >
          <span>
            ←
          </span>

          Back
        </button>

        <div className="booking-step-heading">

          <span>
            YOUR ENQUIRY
          </span>

          <strong>
            STEP {flow.step}

            <small>
              / 5
            </small>
          </strong>

          <em>
            {
              [
                'Selected Services',
                'People Details',
                'Date & Time',
                'Contact Preference',
                'Review & Submit',
              ][flow.step - 1]
            }
          </em>

        </div>

      </div>

    </section>


    {/* =================================================
        PROGRESS
    ================================================= */}

    <section className="booking-progress-section">

      <div className="booking-container">

        <div className="booking-progress">

          <div className="booking-progress-inner">

            {[
              'Services',
              'People',
              'Date & Time',
              'Contact',
              'Review',
            ].map(
              (
                label,
                index,
              ) => {

                const stepNumber =
                  index + 1

                const completed =
                  flow.step >
                  stepNumber

                const active =
                  flow.step ===
                  stepNumber

                return (
                  <div
                    key={label}
                    className={[
                      'booking-progress-step',
                      completed
                        ? 'completed'
                        : '',
                      active
                        ? 'active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >

                    <span>
                      {completed
                        ? '✓'
                        : stepNumber}
                    </span>

                    <small>
                      {label}
                    </small>

                  </div>
                )
              },
            )}

          </div>

        </div>

      </div>

    </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="enquiry-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* =================================================
          MAIN FLOW
      ================================================= */}

      <section className="enquiry-flow">

        {/* STEP 1 */}

        {flow.step === 1 && (
  <SelectedServicesStep
    loading={loading}
    selectedServiceIds={
      flow.people[0]
        ?.serviceIds ?? []
    }
    serviceMap={
      new Map(
        services.map(
          (service) => [
            service.id,
            service,
          ],
        ),
      )
    }
    onRemoveService={(
  serviceId,
) => {
  const firstPerson =
    flow.people[0]

  if (!firstPerson) {
    return
  }

  const nextFlow = {
    ...flow,

    people: [
      {
        ...firstPerson,
        serviceIds:
          firstPerson.serviceIds.filter(
            (id) =>
              id !== serviceId,
          ),
      },
      ...flow.people.slice(1),
    ],
  }

  saveEnquiryFlow(
    nextFlow,
  )

  setFlow(
    nextFlow,
  )

  clearBookingCart()
}}
    onAddService={() => {
      clearBookingCart()

 navigate('/services?mode=enquiry')
    }}
  />
)}

        {/* STEP 2 */}

        {flow.step === 2 && (
          <PeopleDetailsStep
            people={
              peopleTotals
            }

            onAddPerson={
              handleAddPerson
            }

            onRemovePerson={
              handleRemovePerson
            }

            onPersonField={
              handlePersonField
            }

            onRemoveService={
              handleRemovePersonService
            }

            onAddService={
              handleAddPersonService
            }
          />
        )}

        {/* STEP 3 */}

        {flow.step === 3 && (
          <DateTimeStep
            date={
              flow.date
            }

            time={
              flow.time
            }

            onChangeDate={(
              date,
            ) =>
              updateFlow({
                date,
              })
            }

            onChangeTime={(
              time,
            ) =>
              updateFlow({
                time,
              })
            }
          />
        )}

        {/* STEP 4 */}

        {flow.step === 4 && (
          <ContactPreferenceStep
            value={
              flow.contactPreference
            }

            onChange={(
              contactPreference,
            ) =>
              updateFlow({
                contactPreference,
              })
            }
          />
        )}

        {/* STEP 5 */}

        {flow.step === 5 && (
          <ReviewStep
            mode="enquiry"

            people={
              peopleTotals
            }

            date={
              flow.date
            }

            time={
              flow.time
            }

            location={
              flow.location
            }

            address={
              flow.address
            }

            city={
              flow.city
            }

            pincode={
              flow.pincode
            }

            contactPreference={
              flow.contactPreference ||
              undefined
            }

            subtotal={
              subtotal
            }

            discountAmount={
              discountAmount
            }

            total={
              total
            }

            onEditStep={(
              step,
            ) => {
              updateFlow({
                step,
              })

              setBookingStep(
                step,
              )

              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }}
          />
        )}

      </section>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="enquiry-navigation">
  <button
    type="button"
    className="enquiry-secondary-button"
    onClick={() => {
      if (flow.step === 1) {
        navigate('/services')
        return
      }

      goBack()
    }}
    disabled={submitting}
  >
    <span>←</span>
    Back
  </button>

  {flow.step < 5 ? (
          <button
            type="button"
            className="enquiry-primary-button"
            onClick={
              goNext
            }
            disabled={
              submitting
            }
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="enquiry-primary-button"
            onClick={() =>
              void submitEnquiry()
            }
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Submitting Enquiry...'
              : 'Submit Enquiry'}
          </button>
        )}

      </div>

    </main>
  )
}

export default Enquiry