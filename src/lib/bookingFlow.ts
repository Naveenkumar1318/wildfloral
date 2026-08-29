export type BookingMode = 'booking' | 'enquiry'

export type BookingLocation =
  | 'studio'
  | 'home'

export type BookingService = {
  id: string
  category: string | null
  name: string
  description: string | null
  duration_minutes: number
  price: number
  image_url: string | null
}

export type BookingPerson = {
  id: string
  name: string
  phone: string
  email: string
  serviceIds: string[]
}

export type BookingFlowState = {
  mode: BookingMode

  people: BookingPerson[]

  date: string
  time: string

  location: BookingLocation
  address: string

  notes: string

  discountCode: string
  appliedOfferId: string | null
  discountAmount: number

  step: number
}

const STORAGE_KEY =
  'wildfloral_booking_flow'

function createId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function createPerson(): BookingPerson {
  return {
    id: createId(),
    name: '',
    phone: '',
    email: '',
    serviceIds: [],
  }
}

export function createInitialBookingFlow(
  mode: BookingMode = 'booking',
): BookingFlowState {
  return {
    mode,

    people: [
      createPerson(),
    ],

    date: '',
    time: '',

    location: 'studio',
    address: '',

    notes: '',

    discountCode: '',
    appliedOfferId: null,
    discountAmount: 0,

    step: 1,
  }
}

export function loadBookingFlow():
  | BookingFlowState
  | null {
  if (
    typeof window === 'undefined'
  ) {
    return null
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    if (!raw) {
      return null
    }

    return JSON.parse(
      raw,
    ) as BookingFlowState
  } catch {
    return null
  }
}

export function saveBookingFlow(
  state: BookingFlowState,
) {
  if (
    typeof window === 'undefined'
  ) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state),
  )
}

export function clearBookingFlow() {
  if (
    typeof window === 'undefined'
  ) {
    return
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  )
}

export function updateBookingFlow(
  updates: Partial<BookingFlowState>,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next = {
    ...current,
    ...updates,
  }

  saveBookingFlow(next)

  return next
}

export function setBookingMode(
  mode: BookingMode,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow(
      mode,
    )

  saveBookingFlow({
    ...current,
    mode,
  })
}

export function addPersonToBooking() {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next: BookingFlowState = {
    ...current,

    people: [
      ...current.people,
      createPerson(),
    ],
  }

  saveBookingFlow(next)

  return next
}

export function removePersonFromBooking(
  personId: string,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  if (
    current.people.length <= 1
  ) {
    return current
  }

  const next: BookingFlowState = {
    ...current,

    people:
      current.people.filter(
        (person) =>
          person.id !== personId,
      ),
  }

  saveBookingFlow(next)

  return next
}

export function updatePerson(
  personId: string,
  updates: Partial<BookingPerson>,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next: BookingFlowState = {
    ...current,

    people:
      current.people.map(
        (person) =>
          person.id === personId
            ? {
                ...person,
                ...updates,
              }
            : person,
      ),
  }

  saveBookingFlow(next)

  return next
}

export function addServiceToPerson(
  personId: string,
  serviceId: string,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next: BookingFlowState = {
    ...current,

    people:
      current.people.map(
        (person) => {
          if (
            person.id !==
            personId
          ) {
            return person
          }

          if (
            person.serviceIds.includes(
              serviceId,
            )
          ) {
            return person
          }

          return {
            ...person,

            serviceIds: [
              ...person.serviceIds,
              serviceId,
            ],
          }
        },
      ),
  }

  saveBookingFlow(next)

  return next
}

export function removeServiceFromPerson(
  personId: string,
  serviceId: string,
) {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next: BookingFlowState = {
    ...current,

    people:
      current.people.map(
        (person) =>
          person.id === personId
            ? {
                ...person,

                serviceIds:
                  person.serviceIds.filter(
                    (id) =>
                      id !==
                      serviceId,
                  ),
              }
            : person,
      ),
  }

  saveBookingFlow(next)

  return next
}

export function getPersonById(
  personId: string,
) {
  const current =
    loadBookingFlow()

  if (!current) {
    return null
  }

  return (
    current.people.find(
      (person) =>
        person.id ===
        personId,
    ) ?? null
  )
}