const OP_CUSTOMER_FLOW_KEY =
  'wildfloral_op_customer_flow'

/* =========================================================
   TYPES
========================================================= */

export type OPFlowPerson = {
  id: string
  name: string
  phone: string
  email: string
  serviceIds: string[]
}

export type OPFlowState = {
  customerName: string
  mobileNumber: string
  place: string
  visitDate: string
  people: OPFlowPerson[]
  selectedPersonId: string | null
}

/* =========================================================
   BROWSER CHECK
========================================================= */

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

/* =========================================================
   PERSON ID
========================================================= */

function createPersonId(
  number: number,
): string {
  return `op-person-${Date.now()}-${number}-${Math.random()
    .toString(36)
    .slice(2)}`
}

/* =========================================================
   CREATE PERSON
========================================================= */

function createPerson(
  number: number,
): OPFlowPerson {
  return {
    id: createPersonId(number),
    name: '',
    phone: '',
    email: '',
    serviceIds: [],
  }
}

/* =========================================================
   INITIAL FLOW
========================================================= */

export function createInitialOPFlow(): OPFlowState {
  return {
    customerName: '',
    mobileNumber: '',
    place: '',
    visitDate: new Date()
      .toISOString()
      .slice(0, 10),

    people: [
      createPerson(1),
    ],

    selectedPersonId: null,
  }
}

/* =========================================================
   LOAD FLOW
========================================================= */

export function loadOPFlow(): OPFlowState | null {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw =
      window.localStorage.getItem(
        OP_CUSTOMER_FLOW_KEY,
      )

    if (!raw) {
      return null
    }

    const parsed: unknown =
      JSON.parse(raw)

    if (
      !parsed ||
      typeof parsed !== 'object'
    ) {
      return null
    }

    const value =
      parsed as Partial<OPFlowState>

    if (!Array.isArray(value.people)) {
      return null
    }

    const people: OPFlowPerson[] =
      value.people
        .filter(
          (person): person is OPFlowPerson =>
            Boolean(person) &&
            typeof person === 'object' &&
            typeof person.id === 'string',
        )
        .map((person) => ({
          id: person.id,

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
            Array.isArray(person.serviceIds)
              ? Array.from(
                  new Set(
                    person.serviceIds.filter(
                      (id): id is string =>
                        typeof id === 'string' &&
                        id.trim().length > 0,
                    ),
                  ),
                )
              : [],
        }))

    if (people.length === 0) {
      return null
    }

    const selectedPersonId =
      typeof value.selectedPersonId ===
        'string' &&
      people.some(
        (person) =>
          person.id ===
          value.selectedPersonId,
      )
        ? value.selectedPersonId
        : people[0].id

    return {
      customerName:
        typeof value.customerName ===
        'string'
          ? value.customerName
          : '',

      mobileNumber:
        typeof value.mobileNumber ===
        'string'
          ? value.mobileNumber
          : '',

      place:
        typeof value.place ===
        'string'
          ? value.place
          : '',

      visitDate:
        typeof value.visitDate ===
        'string'
          ? value.visitDate
          : new Date()
              .toISOString()
              .slice(0, 10),

      people,

      selectedPersonId,
    }
  } catch {
    return null
  }
}

/* =========================================================
   SAVE FLOW
========================================================= */

export function saveOPFlow(
  flow: OPFlowState,
): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(
    OP_CUSTOMER_FLOW_KEY,
    JSON.stringify(flow),
  )
}

/* =========================================================
   CLEAR FLOW
========================================================= */

export function clearOPFlow(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(
    OP_CUSTOMER_FLOW_KEY,
  )
}

/* =========================================================
   ADD PERSON
========================================================= */

export function addOPPerson(): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const nextNumber =
    flow.people.length + 1

  const person =
    createPerson(nextNumber)

  const nextFlow: OPFlowState = {
    ...flow,

    people: [
      ...flow.people,
      person,
    ],

    selectedPersonId:
      person.id,
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   REMOVE PERSON
========================================================= */

export function removeOPPerson(
  personId: string,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  if (flow.people.length <= 1) {
    return flow
  }

  const people =
    flow.people.filter(
      (person) =>
        person.id !== personId,
    )

  const selectedPersonId =
    people.some(
      (person) =>
        person.id ===
        flow.selectedPersonId,
    )
      ? flow.selectedPersonId
      : people[0]?.id ?? null

  const nextFlow: OPFlowState = {
    ...flow,
    people,
    selectedPersonId,
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   SELECT PERSON
========================================================= */

export function setOPSelectedPerson(
  personId: string,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const exists =
    flow.people.some(
      (person) =>
        person.id === personId,
    )

  if (!exists) {
    return flow
  }

  const nextFlow: OPFlowState = {
    ...flow,

    selectedPersonId:
      personId,
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   UPDATE PERSON
========================================================= */

export function updateOPPerson(
  personId: string,
  field:
    | 'name'
    | 'phone'
    | 'email',
  value: string,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const nextFlow: OPFlowState = {
    ...flow,

    people:
      flow.people.map(
        (person) =>
          person.id === personId
            ? {
                ...person,
                [field]: value,
              }
            : person,
      ),
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   UPDATE CUSTOMER DETAILS
========================================================= */

export function setOPCustomerDetails(
  details: Pick<
    OPFlowState,
    | 'customerName'
    | 'mobileNumber'
    | 'place'
    | 'visitDate'
  >,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const nextFlow: OPFlowState = {
    ...flow,
    ...details,
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   TOGGLE SERVICE FOR PERSON
========================================================= */

export function toggleOPService(
  personId: string,
  serviceId: string,
): OPFlowState {
  const cleanServiceId =
    serviceId.trim()

  if (!cleanServiceId) {
    return (
      loadOPFlow() ??
      createInitialOPFlow()
    )
  }

  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const nextFlow: OPFlowState = {
    ...flow,

    people:
      flow.people.map(
        (person) => {
          if (
            person.id !== personId
          ) {
            return person
          }

          const selected =
            person.serviceIds.includes(
              cleanServiceId,
            )

          return {
            ...person,

            serviceIds:
              selected
                ? person.serviceIds.filter(
                    (id) =>
                      id !==
                      cleanServiceId,
                  )
                : [
                    ...person.serviceIds,
                    cleanServiceId,
                  ],
          }
        },
      ),
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   GET SELECTED PERSON
========================================================= */

export function getOPSelectedPerson():
  OPFlowPerson | null {
  const flow =
    loadOPFlow()

  if (!flow) {
    return null
  }

  return (
    flow.people.find(
      (person) =>
        person.id ===
        flow.selectedPersonId,
    ) ?? null
  )
}

/* =========================================================
   GET SELECTED PERSON ID
========================================================= */

export function getOPSelectedPersonId():
  string | null {
  return (
    loadOPFlow()
      ?.selectedPersonId ?? null
  )
}

/* =========================================================
   GET PERSON SERVICES
========================================================= */

export function getOPSelectedServiceIds(
  personId: string,
): string[] {
  const flow =
    loadOPFlow()

  if (!flow) {
    return []
  }

  return (
    flow.people.find(
      (person) =>
        person.id === personId,
    )?.serviceIds ?? []
  )
}

/* =========================================================
   SET PERSON SERVICES
   Useful when synchronizing with Services.tsx
========================================================= */

export function setOPPersonServices(
  personId: string,
  serviceIds: string[],
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const cleanIds =
    Array.from(
      new Set(
        serviceIds.filter(
          (id): id is string =>
            typeof id === 'string' &&
            id.trim().length > 0,
        ),
      ),
    )

  const nextFlow: OPFlowState = {
    ...flow,

    people:
      flow.people.map(
        (person) =>
          person.id === personId
            ? {
                ...person,
                serviceIds:
                  cleanIds,
              }
            : person,
      ),
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   ADD SERVICE TO PERSON
========================================================= */

export function addOPService(
  personId: string,
  serviceId: string,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const cleanId =
    serviceId.trim()

  if (!cleanId) {
    return flow
  }

  const nextFlow: OPFlowState = {
    ...flow,

    people:
      flow.people.map(
        (person) => {
          if (
            person.id !== personId
          ) {
            return person
          }

          if (
            person.serviceIds.includes(
              cleanId,
            )
          ) {
            return person
          }

          return {
            ...person,

            serviceIds: [
              ...person.serviceIds,
              cleanId,
            ],
          }
        },
      ),
  }

  saveOPFlow(nextFlow)

  return nextFlow
}

/* =========================================================
   REMOVE SERVICE FROM PERSON
========================================================= */

export function removeOPService(
  personId: string,
  serviceId: string,
): OPFlowState {
  const flow =
    loadOPFlow() ??
    createInitialOPFlow()

  const nextFlow: OPFlowState = {
    ...flow,

    people:
      flow.people.map(
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

  saveOPFlow(nextFlow)

  return nextFlow
}