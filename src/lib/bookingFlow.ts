export type BookingMode =
  | 'booking'
  | 'enquiry'

export type BookingLocation =
  | 'studio'
  | 'home'

export type BookingStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export type BookingPerson = {
  id: string
  name: string
  phone: string
  email: string
  serviceIds: string[]
}

export type BookingFlowState = {
  mode: BookingMode
  status: BookingStatus

  people: BookingPerson[]

  servicePrices: Record<string, number>

  date: string
  time: string

  location: BookingLocation
  address: string
  city: string
  pincode: string

  latitude: number | null
  longitude: number | null

  notes: string

  discountCode: string
  appliedOfferId: string | null
  discountAmount: number

contactPreference:
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'
  | ''

step: number
}

const STORAGE_KEY =
  'wildfloral_booking_flow'

const CURRENT_VERSION = 1

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

function createId(): string {
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

function createPerson(): BookingPerson {
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
    status: 'draft',

        people: [
      createPerson(),
    ],

    servicePrices: {},

    date: '',
    time: '',

    location: 'studio',
    address: '',
    city: '',
    pincode: '',

    latitude: null,
    longitude: null,

    notes: '',

    discountCode: '',
    appliedOfferId: null,
    discountAmount: 0,

contactPreference: '',

step: 1,
  }
}

function cleanServiceIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === 'string',
        )
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

function normalizePerson(
  value: unknown,
): BookingPerson | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const person =
    value as Partial<BookingPerson>

  return {
    id:
      typeof person.id === 'string' &&
      person.id.trim()
        ? person.id
        : createId(),

    name:
      typeof person.name === 'string'
        ? person.name
        : '',

    phone:
      typeof person.phone === 'string'
        ? person.phone
        : '',

    email:
      typeof person.email === 'string'
        ? person.email
        : '',

    serviceIds:
      cleanServiceIds(
        person.serviceIds,
      ),
  }
}

function normalizeBookingFlow(
  value: unknown,
): BookingFlowState | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const source =
    value as Partial<BookingFlowState>

  const people = Array.isArray(
    source.people,
  )
    ? source.people
        .map(normalizePerson)
        .filter(
          (
            person,
          ): person is BookingPerson =>
            Boolean(person),
        )
    : []

  const normalizedPeople =
    people.length > 0
      ? people
      : [
          createPerson(),
        ]

    const step =
    Number(source.step)

  const rawServicePrices =
    source.servicePrices

  const servicePrices: Record<
    string,
    number
  > = {}

  if (
    rawServicePrices &&
    typeof rawServicePrices === 'object'
  ) {
    Object.entries(
      rawServicePrices as Record<
        string,
        unknown
      >,
    ).forEach(
      ([serviceId, price]) => {
        const numericPrice =
          Number(price)

        if (
          serviceId.trim() &&
          Number.isFinite(
            numericPrice,
          ) &&
          numericPrice >= 0
        ) {
          servicePrices[
            serviceId
          ] = numericPrice
        }
      },
    )
  }

  const discountAmount =
    Number(
      source.discountAmount,
    )

  const latitude =
    source.latitude === null ||
    source.latitude === undefined
      ? null
      : Number(source.latitude)

  const longitude =
    source.longitude === null ||
    source.longitude === undefined
      ? null
      : Number(source.longitude)

  return {
    mode:
      source.mode === 'enquiry'
        ? 'enquiry'
        : 'booking',

    status:
      source.status === 'pending' ||
      source.status === 'confirmed' ||
      source.status === 'cancelled' ||
      source.status === 'completed'
        ? source.status
        : 'draft',

      people:
      normalizedPeople,

    servicePrices,

    date:
      typeof source.date === 'string'
        ? source.date
        : '',

    time:
      typeof source.time === 'string'
        ? source.time
        : '',

    location:
      source.location === 'home'
        ? 'home'
        : 'studio',

    address:
      typeof source.address === 'string'
        ? source.address
        : '',

    city:
      typeof source.city === 'string'
        ? source.city
        : '',

    pincode:
      typeof source.pincode === 'string'
        ? source.pincode
        : '',

    latitude:
      Number.isFinite(latitude)
        ? latitude
        : null,

    longitude:
      Number.isFinite(longitude)
        ? longitude
        : null,

    notes:
      typeof source.notes === 'string'
        ? source.notes
        : '',

    discountCode:
      typeof source.discountCode === 'string'
        ? source.discountCode
        : '',

    appliedOfferId:
      typeof source.appliedOfferId ===
        'string'
        ? source.appliedOfferId
        : null,

    discountAmount:
      Number.isFinite(
        discountAmount,
      ) && discountAmount >= 0
        ? discountAmount
        : 0,

    contactPreference:
      source.contactPreference === 'email' ||
      source.contactPreference === 'whatsapp' ||
      source.contactPreference === 'call' ||
      source.contactPreference === 'message' ||
      source.contactPreference === 'personal_home_enquiry'
        ? source.contactPreference
        : '',

    step:
      Number.isFinite(step) &&
      step >= 1 &&
      step <= 5
        ? Math.floor(step)
        : 1,
  }
}

export function loadBookingFlow(): BookingFlowState | null {
  if (!isBrowser()) {
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

    return normalizeBookingFlow(
      JSON.parse(raw),
    )
  } catch {
    return null
  }
}

export function saveBookingFlow(
  state: BookingFlowState,
): void {
  if (!isBrowser()) {
    return
  }

  const normalized =
    normalizeBookingFlow(state)

  if (!normalized) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version:
        CURRENT_VERSION,
      ...normalized,
    }),
  )
}

export function clearBookingFlow(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  )
}

export function updateBookingFlow(
  updates: Partial<BookingFlowState>,
): BookingFlowState {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const next: BookingFlowState = {
    ...current,
    ...updates,
  }

  saveBookingFlow(next)

  return next
}

export function setBookingMode(
  mode: BookingMode,
): BookingFlowState {
  return updateBookingFlow({
    mode,
  })
}

export function setBookingStatus(
  status: BookingStatus,
): BookingFlowState {
  return updateBookingFlow({
    status,
  })
}

export function setBookingStep(
  step: number,
): BookingFlowState {
  const safeStep =
    Number.isFinite(step)
      ? Math.min(
          5,
          Math.max(
            1,
            Math.floor(step),
          ),
        )
      : 1

  return updateBookingFlow({
    step: safeStep,
  })
}

export function setSelectedServices(
  serviceIds: string[],
): BookingFlowState {
  const ids =
    cleanServiceIds(
      serviceIds,
    )

  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const firstPerson =
    current.people[0] ??
    createPerson()

  const nextPeople =
    current.people.map(
      (person, index) =>
        index === 0
          ? {
              ...person,
              serviceIds: ids,
            }
          : person,
    )

  const next: BookingFlowState = {
    ...current,

    people:
      nextPeople.length > 0
        ? nextPeople
        : [
            {
              ...firstPerson,
              serviceIds: ids,
            },
          ],

    servicePrices:
      Object.fromEntries(
        Object.entries(
          current.servicePrices,
        ).filter(
          ([serviceId]) =>
            ids.includes(
              serviceId,
            ),
        ),
      ),
  }

  saveBookingFlow(next)

  return next
}

export function setServicePrices(
  servicePrices: Record<string, number>,
): BookingFlowState {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const cleanedPrices: Record<
    string,
    number
  > = {}

  Object.entries(
    servicePrices,
  ).forEach(
    ([serviceId, price]) => {
      const cleanId =
        serviceId.trim()

      const numericPrice =
        Number(price)

      if (
        cleanId &&
        Number.isFinite(
          numericPrice,
        ) &&
        numericPrice >= 0
      ) {
        cleanedPrices[
          cleanId
        ] = numericPrice
      }
    },
  )

  const next: BookingFlowState = {
    ...current,
    servicePrices:
      cleanedPrices,
  }

  saveBookingFlow(next)

  return next
}

export function getSelectedServiceIds():
  string[] {
  const flow =
    loadBookingFlow()

  if (!flow) {
    return []
  }

  return [
    ...new Set(
      flow.people.flatMap(
        (person) =>
          person.serviceIds,
      ),
    ),
  ]
}

export function updatePerson(
  personId: string,
  field:
    | 'name'
    | 'phone'
    | 'email',
  value: string,
): BookingFlowState {
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
                [field]: value,
              }
            : person,
      ),
  }

  saveBookingFlow(next)

  return next
}

export function addPersonToBooking():
  BookingFlowState {
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
): BookingFlowState {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  let people =
    current.people.filter(
      (person) =>
        person.id !== personId,
    )

  if (people.length === 0) {
    people = [
      createPerson(),
    ]
  }

  const next: BookingFlowState = {
    ...current,
    people,
  }

  saveBookingFlow(next)

  return next
}

export function addServiceToPerson(
  personId: string,
  serviceId: string,
): BookingFlowState {
  const current =
    loadBookingFlow() ??
    createInitialBookingFlow()

  const cleanId =
    serviceId.trim()

  if (!cleanId) {
    return current
  }

  const next: BookingFlowState = {
    ...current,

    people:
      current.people.map(
        (person) => {
          if (
            person.id !== personId
          ) {
            return person
          }

          return {
            ...person,
            serviceIds: [
              ...new Set([
                ...person.serviceIds,
                cleanId,
              ]),
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
): BookingFlowState {
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
                      id !== serviceId,
                  ),
              }
            : person,
      ),
  }

  saveBookingFlow(next)

  return next
}