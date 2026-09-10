import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import {
  addPersonToBooking,
  createInitialBookingFlow,
  loadBookingFlow,
  removePersonFromBooking,
  removeServiceFromPerson,
  saveBookingFlow,
  setBookingMode,
  setBookingStep,
  setSelectedServices,
} from '../../../lib/bookingFlow'

import {
  addToBookingCart,
  clearBookingCart,
} from '../../../lib/bookingCart'

import {
  getServices,
  type Service,
} from '../../../lib/services'
import { supabase } from '../../../lib/supabase'

import BookingProgress from './components/BookingProgress'
import BookingNavigation from './components/BookingNavigation'
import BookingSummary from './components/BookingSummary'

import SelectedServicesStep from './steps/SelectedServicesStep'

import PeopleDetailsStep, {
  type BookingPersonTotal,
} from './steps/PeopleDetailsStep'

import DateTimeStep from './steps/DateTimeStep'
import LocationStep from './steps/LocationStep'
import ReviewStep from './steps/ReviewStep'

import './Booking.css'


/* =========================================================
   TYPES
========================================================= */

export type BookingService = {
  id: string
  category: string | null
  name: string
  description: string | null
  durationMinutes: number

  // Original/base price
  price: number

  // Offer pricing
  originalPrice: number
  offerPrice: number
  discountAmount: number
  discountLabel: string | null

  imageUrl: string | null
}

export type BookingPerson = {
  id: string
  name: string
  phone: string
  email: string
  serviceIds: string[]
}

type BookingStepNumber =
  | 1
  | 2
  | 3
  | 4
  | 5


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


function getStepTitle(
  step: BookingStepNumber,
): string {
  switch (step) {
    case 1:
      return 'Selected Services'

    case 2:
      return 'People Details'

    case 3:
      return 'Date & Time'

    case 4:
      return 'Location'

    case 5:
      return 'Review & Confirm'

    default:
      return 'Booking'
  }
}


/* =========================================================
   COMPONENT
========================================================= */

function Booking() {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] = useSearchParams()


  /* =======================================================
     STATE
  ======================================================= */

  const [
    flow,
    setFlow,
  ] = useState(() =>
    loadBookingFlow() ??
    createInitialBookingFlow(
      'booking',
    ),
  )

  const [
    services,
    setServices,
  ] = useState<
    BookingService[]
  >([])

  const [
    loadingServices,
    setLoadingServices,
  ] = useState(true)

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
  createdBookingId,
  setCreatedBookingId,
] = useState('')


  /* =======================================================
     INITIALISE BOOKING
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function initialiseBooking() {
      setPageLoading(true)
      setError('')
      setSuccessMessage('')

      try {
        const {
  data: {
    user,
  },
} = await supabase.auth.getUser()

if (!user) {
  const redirect =
    `${window.location.pathname}${window.location.search}`

  navigate(
    `/login?redirect=${encodeURIComponent(
      redirect,
    )}`,
    {
      replace: true,
    },
  )

  return
}

let currentFlow =
  loadBookingFlow()

const servicesParam =
  searchParams.get(
    'services',
  )

const singleServiceParam =
  searchParams.get(
    'service',
  )

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
    : singleServiceParam
      ? cleanServiceIds([
          singleServiceParam,
        ])
      : []

const assignTo =
  searchParams.get(
    'assignTo',
  )

const isReturningFromPersonServiceSelection =
  Boolean(assignTo)

/*
 * =====================================================
 * SERVICE SELECTION SOURCE
 * =====================================================
 *
 * Explicit Services-page selection:
 *   ?services=id1,id2
 *   ?service=id
 *
 * This is authoritative.
 *
 * If there is no explicit selection in the URL,
 * preserve the existing booking flow.
 *
 * We do NOT use cartIds.length to decide whether
 * Services.tsx supplied a new selection because an old
 * cart can otherwise resurrect removed services.
 */
const hasExplicitServiceSelection =
  Boolean(
    servicesParam ||
      singleServiceParam,
  )

if (!currentFlow) {
  currentFlow =
    createInitialBookingFlow(
      'booking',
    )
}

if (
  !Array.isArray(
    currentFlow.people,
  ) ||
  currentFlow.people.length === 0
) {
  const freshFlow =
    createInitialBookingFlow(
      'booking',
    )

  currentFlow = {
    ...currentFlow,
    people:
      freshFlow.people,
  }
}

/*
 * =====================================================
 * SELECT CURRENT SERVICES
 * =====================================================
 */

let selectedIds: string[]

if (hasExplicitServiceSelection) {
  /*
   * The Services page explicitly supplied the
   * current selection.
   *
   * Use ONLY that selection.
   */
  selectedIds =
    queryIds
} else {
  /*
   * No new Services-page selection.
   *
   * Preserve the existing booking flow so refresh
   * continues the unfinished booking.
   */
  selectedIds =
    cleanServiceIds(
      currentFlow.people.flatMap(
        (
          person,
        ) =>
          Array.isArray(
            person.serviceIds,
          )
            ? person.serviceIds
            : [],
      ),
    )
}

/*
 * =====================================================
 * UPDATE PEOPLE
 * =====================================================
 */

const nextPeople =
  currentFlow.people.map(
    (
      person,
      index,
    ) => {
      /*
       * Normal booking:
       *
       * A new selection from Services completely
       * replaces Person 1's previous services.
       */
      if (
        index === 0 &&
        hasExplicitServiceSelection &&
        !isReturningFromPersonServiceSelection
      ) {
        return {
          ...person,
          serviceIds:
            selectedIds,
        }
      }

      return person
    },
  )

/*
 * =====================================================
 * UPDATE FLOW
 * =====================================================
 */

currentFlow = {
  ...currentFlow,

  mode:
    'booking',

  people:
    nextPeople,

  step:
    isReturningFromPersonServiceSelection
      ? 2
      : hasExplicitServiceSelection
        ? 1
        : currentFlow.step >= 1 &&
            currentFlow.step <= 5
          ? currentFlow.step
          : 1,
}

saveBookingFlow(
  currentFlow,
)

setBookingMode(
  'booking',
)

setBookingStep(
  currentFlow.step,
)

/*
 * Synchronize the in-memory selected-services state
 * when Services.tsx explicitly supplied a selection.
 */
if (
  hasExplicitServiceSelection &&
  !isReturningFromPersonServiceSelection
) {
  setSelectedServices(
    selectedIds,
  )
}

if (!cancelled) {
  setFlow(
    currentFlow,
  )
}

if (!cancelled) {
  setFlow(
    currentFlow,
  )
}
      } catch (
        initialiseError
      ) {
        if (!cancelled) {
          setError(
            initialiseError instanceof
              Error
              ? initialiseError.message
              : 'Unable to prepare your booking.',
          )
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false)
        }
      }
    }

    void initialiseBooking()

    return () => {
      cancelled = true
    }
  }, [searchParams])


  /* =======================================================
   LOAD SERVICES
======================================================= */

useEffect(() => {
  let cancelled = false

  async function loadBookingServices() {
    setLoadingServices(true)

    try {
      const result =
        await getServices()

      if (cancelled) {
        return
      }

      const mapped =
        result.map(
          (
            service: Service,
          ): BookingService => ({
            id:
              service.id,

            category:
              service.category ??
              null,

            name:
              service.name,

            description:
              service.description ??
              null,

            durationMinutes:
              Number(
                service.durationMinutes,
              ) || 0,

            price:
              Number(
                service.offerPrice,
              ) ||
              Number(
                service.price,
              ) ||
              0,

            originalPrice:
              Number(
                service.originalPrice,
              ) ||
              Number(
                service.price,
              ) ||
              0,

            offerPrice:
              Number(
                service.offerPrice,
              ) ||
              Number(
                service.price,
              ) ||
              0,

            discountAmount:
              Number(
                service.discountAmount,
              ) || 0,

            discountLabel:
              service.discountLabel ??
              null,

            imageUrl:
              service.imageUrl ??
              null,
          }),
        )

      setServices(
        mapped,
      )
    } catch (
      loadError
    ) {
      if (!cancelled) {
        setError(
          loadError instanceof
            Error
            ? loadError.message
            : 'Unable to load services.',
        )
      }
    } finally {
      if (!cancelled) {
        setLoadingServices(false)
      }
    }
  }

  void loadBookingServices()

  return () => {
    cancelled = true
  }
}, [])

  /* =======================================================
     SERVICE MAP
  ======================================================= */

  const serviceMap =
    useMemo(
      () =>
        new Map(
          services.map(
            (
              service,
            ) => [
              service.id,
              {
                ...service,

                price:
  Number(
    service.offerPrice,
  ) ||
  Number(
    service.price,
  ) ||
  0,
              },
            ],
          ),
        ),
      [
        services,
        flow.servicePrices,
      ],
    )


  /* =======================================================
     SELECTED SERVICES
  ======================================================= */

  const selectedServiceIds =
    useMemo(
      () =>
        cleanServiceIds(
          flow.people.flatMap(
            (
              person,
            ) =>
              Array.isArray(
                person.serviceIds,
              )
                ? person.serviceIds
                : [],
          ),
        ),
      [flow.people],
    )

  const selectedServices =
    useMemo(
      () =>
        selectedServiceIds
          .map(
            (id) =>
              serviceMap.get(
                id,
              ),
          )
          .filter(
            (
              service,
            ): service is BookingService =>
              Boolean(service),
          ),
      [
        selectedServiceIds,
        serviceMap,
      ],
    )


  /* =======================================================
     PEOPLE TOTALS
  ======================================================= */

  const peopleTotals =
    useMemo<
      BookingPersonTotal[]
    >(
      () =>
        flow.people.map(
          (
            person,
          ) => {
            const personServices =
              person.serviceIds
                .map(
                  (id) =>
                    serviceMap.get(
                      id,
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
                  Number(
                    service.price,
                  ),
                0,
              )

            return {
              person,
              services:
                personServices,
              subtotal:
                personSubtotal,
            }
          },
        ),
      [
        flow.people,
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
    Math.min(
      Math.max(
        Number(
          flow.discountAmount,
        ) || 0,
        0,
      ),
      subtotal,
    )

  const total =
    Math.max(
      subtotal -
        discountAmount,
      0,
    )


  /* =======================================================
     DURATION
  ======================================================= */

  const totalDuration =
    useMemo(
      () =>
        flow.people.reduce(
          (
            totalValue,
            person,
          ) =>
            totalValue +
            person.serviceIds.reduce(
              (
                personValue,
                serviceId,
              ) => {
                const service =
                  serviceMap.get(
                    serviceId,
                  )

                return (
                  personValue +
                  (
                    service
                      ?.durationMinutes ??
                    0
                  )
                )
              },
              0,
            ),
          0,
        ),
      [
        flow.people,
        serviceMap,
      ],
    )


  /* =======================================================
     CURRENT STEP
  ======================================================= */

  const currentStep =
    (
      Number(
        flow.step,
      ) || 1
    ) as BookingStepNumber


  /* =======================================================
     PERSIST FLOW
  ======================================================= */

  const persistFlow =
    useCallback(
      (
        nextFlow:
          typeof flow,
      ) => {
        saveBookingFlow(
          nextFlow,
        )

        setFlow(
          nextFlow,
        )
      },
      [],
    )


  /* =======================================================
     CHANGE STEP
  ======================================================= */

  const changeStep =
    useCallback(
      (
        step: number,
      ) => {
        const safeStep =
          Math.min(
            5,
            Math.max(
              1,
              Math.floor(
                Number(step) || 1,
              ),
            ),
          ) as BookingStepNumber

        const current =
          loadBookingFlow() ??
          flow

        const next = {
          ...current,
          step: safeStep,
        }

        persistFlow(
          next,
        )

        setBookingStep(
          safeStep,
        )

        setError('')
        setSuccessMessage('')

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      },
      [
        flow,
        persistFlow,
      ],
    )


  /* =======================================================
     REMOVE SERVICE
  ======================================================= */

  const handleRemoveService =
    useCallback(
      (
        serviceId: string,
      ) => {
        const firstPerson =
          flow.people[0]

        if (!firstPerson) {
          return
        }

        const nextPeople =
          flow.people.map(
            person =>
              person.id ===
              firstPerson.id
                ? {
                    ...person,
                    serviceIds:
                      person.serviceIds.filter(
                        id =>
                          id !==
                          serviceId,
                      ),
                  }
                : person,
          )

                const nextFlow = {
          ...flow,

          people:
            nextPeople,

          servicePrices:
            Object.fromEntries(
              Object.entries(
                flow.servicePrices ??
                  {},
              ).filter(
                ([id]) =>
                  id !==
                  serviceId,
              ),
            ),
        }

        saveBookingFlow(
          nextFlow,
        )

        setFlow(
          nextFlow,
        )

        setError('')
      },
      [flow],
    )


  /* =======================================================
     ADD SERVICE
  ======================================================= */

  const handleAddService =
    useCallback(
      (
        personId?: string,
      ) => {
        const targetPersonId =
          personId ??
          flow.people[0]?.id

        if (!targetPersonId) {
          return
        }

        navigate(
          `/services?assignTo=${encodeURIComponent(
            targetPersonId,
          )}&mode=booking`,
        )
      },
      [
        flow.people,
        navigate,
      ],
    )


  /* =======================================================
     UPDATE PERSON
     
     IMPORTANT:
     React state is the single source of truth.
     We do NOT use updatePerson() here because that
     function reads localStorage independently.
  ======================================================= */

  const handleUpdatePerson =
    useCallback(
      (
        personId: string,
        field:
          | 'name'
          | 'phone'
          | 'email',
        value: string,
      ) => {
        const safeValue =
          typeof value === 'string'
            ? value
            : ''

        setFlow(
          previous => {
            const next = {
              ...previous,

              people:
                previous.people.map(
                  person =>
                    person.id ===
                    personId
                      ? {
                          ...person,
                          [field]:
                            safeValue,
                        }
                      : person,
                ),
            }

            saveBookingFlow(
              next,
            )

            return next
          },
        )

        setError('')
        setSuccessMessage('')
      },
      [],
    )


  /* =======================================================
     ADD PERSON
  ======================================================= */

  const handleAddPerson =
    useCallback(() => {
      const next =
        addPersonToBooking()

      setFlow(
        next,
      )

      setError('')
    }, [])


  /* =======================================================
     REMOVE PERSON
  ======================================================= */

  const handleRemovePerson =
    useCallback(
      (
        personId: string,
      ) => {
        const next =
          removePersonFromBooking(
            personId,
          )

        setFlow(
          next,
        )

        setError('')
      },
      [],
    )


  /* =======================================================
     REMOVE PERSON SERVICE
  ======================================================= */

  const handleRemovePersonService =
    useCallback(
      (
        personId: string,
        serviceId: string,
      ) => {
        const next =
          removeServiceFromPerson(
            personId,
            serviceId,
          )

        setFlow(
          next,
        )

        setError('')
      },
      [],
    )


  /* =======================================================
     ADD PERSON SERVICE
  ======================================================= */

  const handleAddPersonService =
    useCallback(
      (
        personId: string,
      ) => {
        handleAddService(
          personId,
        )
      },
      [
        handleAddService,
      ],
    )


  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateStep(
    step: BookingStepNumber,
  ): boolean {
    setError('')

    if (
      step === 1
    ) {
      if (
        selectedServiceIds.length ===
        0
      ) {
        setError(
          'Please select at least one service before continuing.',
        )

        return false
      }

      return true
    }


    if (
      step === 2
    ) {
      if (
        flow.people.length ===
        0
      ) {
        setError(
          'Please add at least one person.',
        )

        return false
      }

      for (
        const person of flow.people
      ) {
        const name =
          person.name.trim()

        const phone =
          person.phone.trim()

        const email =
          person.email.trim()

        if (!name) {
          setError(
            'Please enter the name for every person.',
          )

          return false
        }

        const phoneDigits =
          phone.replace(
            /\D/g,
            '',
          )

        if (
          phoneDigits.length !==
          10
        ) {
          setError(
            `Please enter a valid phone number for ${name}.`,
          )

          return false
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email,
          )
        ) {
          setError(
            `Please enter a valid email address for ${name}.`,
          )

          return false
        }

        if (
          person.serviceIds.length ===
          0
        ) {
          setError(
            `${name} must have at least one service.`,
          )

          return false
        }
      }

      return true
    }


    if (
      step === 3
    ) {
      if (!flow.date) {
        setError(
          'Please select a booking date.',
        )

        return false
      }

      if (!flow.time) {
        setError(
          'Please select an available time slot.',
        )

        return false
      }

      const selectedDate =
        new Date(
          `${flow.date}T00:00:00`,
        )

      const today =
        new Date()

      today.setHours(
        0,
        0,
        0,
        0,
      )

      if (
        Number.isNaN(
          selectedDate.getTime(),
        )
      ) {
        setError(
          'Please select a valid booking date.',
        )

        return false
      }

      if (
        selectedDate < today
      ) {
        setError(
          'Please select today or a future date.',
        )

        return false
      }

      return true
    }


    if (
      step === 4
    ) {
      if (
        flow.location ===
        'home'
      ) {
        if (
          !flow.address.trim()
        ) {
          setError(
            'Please provide your complete home service address.',
          )

          return false
        }

        if (
          !flow.city.trim()
        ) {
          setError(
            'Please provide your city.',
          )

          return false
        }

        if (
          !/^\d{6}$/.test(
            flow.pincode.trim(),
          )
        ) {
          setError(
            'Please enter a valid 6-digit pincode.',
          )

          return false
        }
      }

      return true
    }

    return true
  }


  /* =======================================================
     NEXT
  ======================================================= */

function handleNext() {
  setError('')

  const isValid =
    validateStep(currentStep)

  if (!isValid) {
    return
  }

  if (currentStep >= 5) {
    return
  }

  const nextStep =
    (currentStep + 1) as BookingStepNumber

  changeStep(nextStep)

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}


  /* =======================================================
     BACK
  ======================================================= */

  function handleBack() {
  if (
    currentStep <= 1
  ) {
    /*
     * =====================================================
     * SYNC SERVICES BEFORE RETURNING
     * =====================================================
     *
     * Booking flow is the current source of truth.
     *
     * Services.tsx restores its normal selection from
     * bookingCart, so synchronize the cart first.
     *
     * This prevents previously removed services from
     * reappearing when the customer returns to Services.
     */

    const latestFlow =
      loadBookingFlow() ??
      flow

    const currentServiceIds =
      cleanServiceIds(
        latestFlow.people.flatMap(
          (person) =>
            Array.isArray(
              person.serviceIds,
            )
              ? person.serviceIds
              : [],
        ),
      )

    clearBookingCart()

    currentServiceIds.forEach(
      (serviceId) => {
        addToBookingCart(
          serviceId,
        )
      },
    )

    navigate(
      '/services',
    )

    return
  }

  changeStep(
    currentStep - 1,
  )
}


  /* =======================================================
     CONFIRM
  ======================================================= */

  async function handleConfirm() {
  setError('')
  setSuccessMessage('')

  const loadedFlow =
  loadBookingFlow() ?? flow

const normalizedPeople =
  loadedFlow.people
    .map((person) => ({
      ...person,
      serviceIds:
        cleanServiceIds(
          Array.isArray(
            person.serviceIds,
          )
            ? person.serviceIds
            : [],
        ),
    }))
    .filter(
      (person) =>
        person.name.trim() ||
        person.phone.trim() ||
        person.email.trim() ||
        person.serviceIds.length > 0,
    )

const latestFlow = {
  ...loadedFlow,
  people:
    normalizedPeople,
}

  if (!latestFlow.date) {
    setError(
      'Please select an appointment date.',
    )

    changeStep(3)
    return
  }

  if (!latestFlow.time) {
    setError(
      'Please select an appointment time.',
    )

    changeStep(3)
    return
  }

  if (
    latestFlow.location === 'home'
  ) {
    if (
      !latestFlow.address.trim()
    ) {
      setError(
        'Please provide your complete home service address.',
      )

      changeStep(4)
      return
    }

    if (
      !latestFlow.city.trim()
    ) {
      setError(
        'Please provide your city.',
      )

      changeStep(4)
      return
    }

    if (
      !/^\d{6}$/.test(
        latestFlow.pincode.trim(),
      )
    ) {
      setError(
        'Please enter a valid 6-digit pincode.',
      )

      changeStep(4)
      return
    }
  }

  if (
  latestFlow.people.length === 0
) {
  setError(
    'Please add at least one person.',
  )

  changeStep(2)
  return
}

const totalSelectedServiceCount =
  latestFlow.people.reduce(
    (
      total,
      person,
    ) =>
      total +
      person.serviceIds.length,
    0,
  )

if (
  totalSelectedServiceCount === 0
) {
  setError(
    'Please select at least one beauty service.',
  )

  changeStep(1)
  return
}

  setSaving(true)

  try {
      /*
       * =====================================================
       * 1. CHECK AUTHENTICATION
       * =====================================================
       */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(
          `Unable to verify your account: ${authError.message}`,
        )
      }

      const user = authData.user

      if (!user) {
        const redirect =
          `${window.location.pathname}${window.location.search}`

        navigate(
          `/login?redirect=${encodeURIComponent(
            redirect,
          )}`,
        )

        return
      }
      /*
       * =====================================================
       * 2. FINAL VALIDATION
       * =====================================================
       */

      if (!latestFlow.date) {
        setError(
          'Please select an appointment date.',
        )

        changeStep(3)
        return
      }

      if (!latestFlow.time) {
        setError(
          'Please select an appointment time.',
        )

        changeStep(3)
        return
      }

      if (
        latestFlow.location === 'home'
      ) {
        if (
          !latestFlow.address.trim()
        ) {
          setError(
            'Please provide your complete home service address.',
          )

          changeStep(4)
          return
        }

        if (
          !latestFlow.city.trim()
        ) {
          setError(
            'Please provide your city.',
          )

          changeStep(4)
          return
        }

        if (
          !/^\d{6}$/.test(
            latestFlow.pincode.trim(),
          )
        ) {
          setError(
            'Please enter a valid 6-digit pincode.',
          )

          changeStep(4)
          return
        }
      }

      /*
       * =====================================================
       * 3. CHECK SLOT AVAILABILITY
       * =====================================================
       *
       * Pending and confirmed bookings are considered
       * occupied for the selected start slot.
       *
       * Admin can later confirm or reject the request.
       */

      const {
        data: existingBookings,
        error: availabilityError,
      } = await supabase
        .from('bookings')
        .select('id')
        .eq(
          'booking_date',
          latestFlow.date,
        )
        .eq(
          'booking_time',
          latestFlow.time,
        )
        .in(
          'status',
          [
            'pending',
            'confirmed',
          ],
        )
        .limit(1)

      if (availabilityError) {
        throw new Error(
          `Unable to check appointment availability: ${availabilityError.message}`,
        )
      }

      if (
        (existingBookings ?? [])
          .length > 0
      ) {
        setError(
          'This appointment slot has already been requested. Please choose another slot.',
        )

        changeStep(3)
        return
      }

      /*
       * =====================================================
       * 4. BUILD CUSTOMER DETAILS
       * =====================================================
       */

      const primaryPerson =
        latestFlow.people[0]

      if (!primaryPerson) {
        throw new Error(
          'Customer details are missing.',
        )
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email',
        )
        .eq(
          'id',
          user.id,
        )
        .maybeSingle()

      if (profileError) {
        throw new Error(
          `Unable to load your profile: ${profileError.message}`,
        )
      }

      const customerName =
        primaryPerson.name.trim() ||
        profile?.full_name?.trim() ||
        ''

      const customerEmail =
        primaryPerson.email.trim() ||
        profile?.email?.trim() ||
        user.email ||
        ''

      const customerPhone =
        primaryPerson.phone.trim()

      if (!customerName) {
        setError(
          'Please provide your full name.',
        )

        changeStep(2)
        return
      }

      if (!customerEmail) {
        setError(
          'Please provide your email address.',
        )

        changeStep(2)
        return
      }

      if (!customerPhone) {
        setError(
          'Please provide your mobile number.',
        )

        changeStep(2)
        return
      }

      /*
       * =====================================================
       * 5. PRIMARY SERVICE
       * =====================================================
       *
       * bookings.service_id is the required primary service.
       * Every selected service is also stored in booking_items.
       */

      const primaryService =
        selectedServices[0]

      if (!primaryService) {
        throw new Error(
          'No valid service was selected.',
        )
      }

      /*
       * =====================================================
       * 6. BUILD NOTES
       * =====================================================
       */

      const bookingNotes = [
        latestFlow.notes.trim()
          ? `CUSTOMER NOTES:\n${latestFlow.notes.trim()}`
          : '',

        latestFlow.discountCode.trim()
          ? `DISCOUNT CODE: ${latestFlow.discountCode.trim()}`
          : '',

        latestFlow.discountAmount > 0
          ? `DISCOUNT AMOUNT: ${formatCurrency(
              latestFlow.discountAmount,
            )}`
          : '',

        latestFlow.people.length > 1
          ? `PEOPLE: ${latestFlow.people.length}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      /*
       * =====================================================
       * 7. CREATE MAIN BOOKING
       * =====================================================
       *
       * Status starts as pending.
       *
       * Admin decides:
       * pending -> confirmed
       * pending -> rejected/cancelled
       */

      const {
        data: booking,
        error: bookingError,
      } = await supabase
        .from('bookings')
        .insert({
          customer_id:
            user.id,

          service_id:
            primaryService.id,

          booking_date:
            latestFlow.date,

          booking_time:
            latestFlow.time,

          customer_name:
            customerName,

          customer_email:
            customerEmail,

          customer_phone:
            customerPhone,

          notes:
            bookingNotes ||
            null,

          price:
            total,

          status:
            'pending',

          /*
           * Location fields
           */
          location_type:
            latestFlow.location,

          address:
            latestFlow.location ===
            'home'
              ? latestFlow.address.trim()
              : null,

          city:
            latestFlow.location ===
            'home'
              ? latestFlow.city.trim()
              : null,

          pincode:
            latestFlow.location ===
            'home'
              ? latestFlow.pincode.trim()
              : null,

          latitude:
            latestFlow.location ===
            'home'
              ? latestFlow.latitude
              : null,

          longitude:
            latestFlow.location ===
            'home'
              ? latestFlow.longitude
              : null,
        })
        .select('id')
        .single()

      if (
        bookingError ||
        !booking
      ) {
        throw new Error(
          bookingError?.message ??
            'Unable to create your appointment.',
        )
      }

      /*
       * =====================================================
       * 8. CREATE BOOKING PEOPLE
       * =====================================================
       */

      const bookingPeople =
        latestFlow.people.map(
          (person) => ({
            booking_id:
              booking.id,

            name:
              person.name.trim(),

            phone:
              person.phone.trim() ||
              null,

            email:
              person.email.trim() ||
              null,
          }),
        )

      const {
        data: createdPeople,
        error: peopleError,
      } = await supabase
        .from('booking_people')
        .insert(
          bookingPeople,
        )
        .select('id')

      if (
        peopleError ||
        !createdPeople ||
        createdPeople.length !==
          bookingPeople.length
      ) {
        /*
         * Roll back the main booking.
         */
        await supabase
          .from('bookings')
          .delete()
          .eq(
            'id',
            booking.id,
          )

        throw new Error(
          peopleError?.message ??
            'Unable to save booking customer details.',
        )
      }

      /*
       * =====================================================
       * 9. CREATE BOOKING ITEMS
       * =====================================================
       *
       * Important:
       * Each service belongs to a person.
       *
       * We therefore create booking_items using the matching
       * booking_people.id as person_id.
       */

      const bookingItems =
        latestFlow.people.flatMap(
          (
            person,
            personIndex,
          ) => {
            const bookingPerson =
              createdPeople[
                personIndex
              ]

            if (!bookingPerson) {
              return []
            }

            return cleanServiceIds(
  person.serviceIds,
)
  .map(
    (serviceId) =>
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
              .map(
                (service) => ({
                  booking_id:
                    booking.id,

                  service_id:
                    service.id,

                  service_name:
                    service.name,

                  price:
                    Number(
                      service.price,
                    ),

                  duration_minutes:
                    Number(
                      service.durationMinutes,
                    ),

                  person_id:
                    bookingPerson.id,
                }),
              )
          },
        )

      if (
        bookingItems.length === 0
      ) {
        await supabase
          .from('bookings')
          .delete()
          .eq(
            'id',
            booking.id,
          )

        throw new Error(
          'Unable to create booking services.',
        )
      }

      const {
        error: itemsError,
      } = await supabase
        .from('booking_items')
        .insert(
          bookingItems,
        )

      if (itemsError) {
        /*
         * Delete the main booking.
         *
         * booking_people and booking_items are configured
         * with ON DELETE CASCADE, so their child records
         * are removed automatically.
         */
        await supabase
          .from('bookings')
          .delete()
          .eq(
            'id',
            booking.id,
          )

        throw new Error(
          `Unable to save booking services: ${itemsError.message}`,
        )
      }

      /*
  /*
 * =====================================================
 * 10. SUCCESS STATE
 * =====================================================
 *
 * Keep the completed booking in React state so the
 * success screen can display its date/time.
 *
 * Do NOT keep the completed booking in localStorage.
 * A completed booking must never be restored as a
 * new booking.
 */

const completedFlow = {
  ...latestFlow,

  status:
    'pending' as const,

  step:
    5,
}

setFlow(
  completedFlow,
)

/*
 * Clear persistent booking data immediately after
 * successful database creation.
 *
 * This means:
 *
 * Refresh during an unfinished booking:
 *     → data remains
 *
 * Booking successfully submitted:
 *     → persistent draft is removed
 *
 * New /booking page:
 *     → starts clean
 */

clearBookingCart()

sessionStorage.removeItem(
  'booking_flow',
)

sessionStorage.removeItem(
  'booking_step',
)

sessionStorage.removeItem(
  'booking_mode',
)

sessionStorage.removeItem(
  'booking_cart',
)

window.localStorage.removeItem(
  'wildfloral_booking_flow',
)

/*
 * =====================================================
 * 11. SUCCESS
 * =====================================================
 */

setCreatedBookingId(
  booking.id,
)

setSuccessMessage(
  'Appointment request submitted successfully.',
)

window.scrollTo({
  top: 0,
  behavior: 'smooth',
})
    } catch (
      confirmError
    ) {
      console.error(
        'Booking confirmation error:',
        confirmError,
      )

      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Unable to create your appointment. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =======================================================
     RENDER STEP
  ======================================================= */

  function renderStep() {
    switch (
      currentStep
    ) {

      case 1:
        return (
          <SelectedServicesStep
            loading={
              loadingServices
            }
            selectedServiceIds={
              selectedServiceIds
            }
            serviceMap={
              serviceMap
            }
            onRemoveService={
              handleRemoveService
            }
            onAddService={() =>
              handleAddService()
            }
          />
        )


      case 2:
        return (
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
              handleUpdatePerson
            }
            onRemoveService={
              handleRemovePersonService
            }
            onAddService={
              handleAddPersonService
            }
          />
        )


      case 3:
        return (
          <DateTimeStep
            date={
              flow.date
            }
            time={
              flow.time
            }
            people={
              flow.people
            }
            serviceMap={
              serviceMap
            }
            totalDuration={
              totalDuration
            }
            onChangeDate={(
              date,
            ) => {
              const current =
                loadBookingFlow() ??
                flow

              persistFlow({
                ...current,
                date,
                time: '',
              })
            }}
            onChangeTime={(
              time,
            ) => {
              const current =
                loadBookingFlow() ??
                flow

              persistFlow({
                ...current,
                time,
              })
            }}
          />
        )


      case 4:
  return (
    <LocationStep
      location={flow.location}
      address={flow.address}
      city={flow.city}
      pincode={flow.pincode}
      latitude={flow.latitude}
      longitude={flow.longitude}
      onChangeLocation={(location) => {
        const current =
          loadBookingFlow() ??
          flow

        persistFlow({
          ...current,
          location,

          address:
            location === 'studio'
              ? ''
              : current.address,

          city:
            location === 'studio'
              ? ''
              : current.city,

          pincode:
            location === 'studio'
              ? ''
              : current.pincode,

          latitude:
            location === 'studio'
              ? null
              : current.latitude,

          longitude:
            location === 'studio'
              ? null
              : current.longitude,
        })
      }}
      onChangeAddress={(address) => {
        const current =
          loadBookingFlow() ??
          flow

        persistFlow({
          ...current,
          address,
        })
      }}
      onChangeCity={(city) => {
        const current =
          loadBookingFlow() ??
          flow

        persistFlow({
          ...current,
          city,
        })
      }}
      onChangePincode={(pincode) => {
        const current =
          loadBookingFlow() ??
          flow

        persistFlow({
          ...current,
          pincode,
        })
      }}
      onChangeCoordinates={(
        latitude,
        longitude,
      ) => {
        const current =
          loadBookingFlow() ??
          flow

        persistFlow({
          ...current,
          latitude,
          longitude,
        })
      }}
    />
  )

      case 5:
        return (
          <ReviewStep
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
            serviceMap={
              serviceMap
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
            onEditStep={
              changeStep
            }
          />
        )


      default:
        return null
    }
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    pageLoading
  ) {
    return (
      <main className="booking-page">

        <section className="booking-loading-page">

          <div className="booking-loading-icon">

            <Loader2
              size={28}
            />

          </div>

          <h1>
            Preparing your
            <em>
              appointment.
            </em>
          </h1>

          <p>
            Restoring your selected
            services...
          </p>

        </section>

        

      </main>
    )
  }

  /* =======================================================
   SUCCESS
======================================================= */

if (createdBookingId) {
  return (
    <main className="booking-page booking-success-page">
      <section className="booking-success-card">

        <div className="booking-success-icon">
          <CheckCircle2 size={32} />
        </div>

        <span className="booking-eyebrow">
          APPOINTMENT REQUESTED
        </span>

        <h1>
          Your appointment is
          <span>successfully requested.</span>
        </h1>

        <p>
          Your booking has been received successfully.
          The studio will review your request and update
          the appointment status.
        </p>

        <div className="booking-success-details">

          <div>
            <span>Booking ID</span>

            <strong>
              {createdBookingId}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <strong>
              Pending
            </strong>
          </div>

          <div>
            <span>Date</span>

            <strong>
              {flow.date}
            </strong>
          </div>

          <div>
            <span>Time</span>

            <strong>
              {flow.time}
            </strong>
          </div>

        </div>

        <div className="booking-success-actions">

          <button
            type="button"
            className="booking-primary-button"
            onClick={() => {
              navigate('/account/bookings/beauty')
            }}
          >
            Track Booking
          </button>

          <button
            type="button"
            className="booking-outline-button"
            onClick={() => {
  clearBookingCart()

  sessionStorage.removeItem('booking_flow')
  sessionStorage.removeItem('booking_step')
  sessionStorage.removeItem('booking_mode')
  sessionStorage.removeItem('booking_cart')

  setCreatedBookingId('')
  setSuccessMessage('')

  window.location.href = '/services'
}}
          >
            Book Another Appointment
          </button>

        </div>

      </section>
    </main>
  )
}
  

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="booking-page">

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
                Book your
                <em>
                  appointment.
                </em>
              </h1>

              <p>
                A simple, personalized
                booking experience
                designed around your
                beauty, style, and
                occasion.
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
                      Booking
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
                    Flexible time slots
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
                <UserRound size={16} />
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
                  Simple booking
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
            onClick={
              handleBack
            }
          >
            <span>
              ←
            </span>

            Back
          </button>

          <div className="booking-step-heading">

            <span>
              YOUR APPOINTMENT
            </span>

            <strong>
              STEP {currentStep}

              <small>
                / 5
              </small>
            </strong>

            <em>
              {getStepTitle(
                currentStep,
              )}
            </em>

          </div>

        </div>

      </section>


      {/* =================================================
          PROGRESS
      ================================================= */}

      <section className="booking-progress-section">

        <div className="booking-container">

          <BookingProgress
            currentStep={
              currentStep
            }
          />

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="booking-container">

          <div
            className="booking-alert booking-alert-error"
            role="alert"
          >

            <AlertCircle
              size={17}
            />

            <span>
              {error}
            </span>

          </div>

        </div>
      )}



      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="booking-container">

          <div
            className="booking-alert booking-alert-success"
            role="status"
          >

            <CheckCircle2
              size={17}
            />

            <span>
              {successMessage}
            </span>

          </div>

        </div>
      )}


      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="booking-content">

        <div className="booking-container">

          <div className="booking-layout">

            <div className="booking-main">

              {renderStep()}

              <BookingNavigation
                  currentStep={
                    currentStep
                  }
                  onBack={
                    handleBack
                  }
                  onNext={
                    handleNext
                  }
                  onConfirm={
                    handleConfirm
                  }
                  canContinue={
                    selectedServiceIds.length > 0
                  }
                  saving={
                    saving
                  }
                />
            </div>


            <aside className="booking-sidebar">

  <BookingSummary
  mode="booking"

  people={
    peopleTotals
  }

  selectedServiceCount={
    selectedServices.length
  }

  totalDuration={
    totalDuration
  }

  subtotal={
    subtotal
  }

  discount={
    discountAmount
  }

  grandTotal={
    total
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
/>

</aside>
          </div>

        </div>

      </section>


      {/* =================================================
          MOBILE TOTAL
      ================================================= */}

      <div className="booking-mobile-total">

        <div>

          <span>
            TOTAL
          </span>

          <strong>
            {formatCurrency(
              total,
            )}
          </strong>

        </div>

        <span>
          {selectedServices.length}{' '}
          {selectedServices.length ===
          1
            ? 'service'
            : 'services'}
        </span>

      </div>

    </main>
  )
}


export default Booking