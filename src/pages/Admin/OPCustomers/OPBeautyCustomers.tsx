import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  getServices,
  type Service,
} from '../../../lib/services'

import {
  supabase,
} from '../../../lib/supabase'

import {
  clearOPFlow,
  createInitialOPFlow,
  loadOPFlow,
  saveOPFlow,
  type OPFlowPerson,
} from '../../../lib/opCustomerFlow'

import './OPBeautyCustomers.css'

/* =========================================================
   TYPES
========================================================= */

type OPService = {
  id: string
  name: string
  originalPrice: number
  offerPrice: number
  discountAmount: number
  discountLabel: string | null
  imageUrl: string | null
}

type OPCustomer = {
  id: string
  customerName: string
  mobileNumber: string
  place: string
  visitDate: string
  grandTotal: number
  createdAt: string
  peopleCount: number
}

type SavedPerson = {
  id: string
  person_number: number
  person_name: string
  total: number
}

type SavedService = {
  id: string
  op_customer_person_id: string
  service_id: string | null
  service_name: string
  actual_price: number
  discount_amount: number
  discount_label: string | null
  final_price: number
}

const CUSTOMERS_PER_PAGE = 8

/* =========================================================
   HELPERS
========================================================= */

function getToday(): string {
  const date = new Date()

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function createLocalPerson(
  personNumber: number,
): OPFlowPerson {
  return {
    id:
      `op-person-${Date.now()}-${personNumber}-${Math.random()
        .toString(36)
        .slice(2)}`,

    name: '',

    phone: '',

    email: '',

    serviceIds: [],
  }
}

function formatCurrency(
  amount: number,
): string {
  return `₹${Math.round(
    Number(amount) || 0,
  ).toLocaleString('en-IN')}`
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return '—'
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function mapService(
  service: Service,
): OPService {
  const originalPrice =
    Math.max(
      Number(
        service.originalPrice,
      ) ||
        Number(
          service.price,
        ) ||
        0,
      0,
    )

  const offerPrice =
    Math.max(
      Number(
        service.offerPrice,
      ) ||
        originalPrice,
      0,
    )

  const discountAmount =
    Math.max(
      Number(
        service.discountAmount,
      ) ||
        Math.max(
          originalPrice -
            offerPrice,
          0,
        ),
      0,
    )

  return {
    id: service.id,

    name: service.name,

    originalPrice,

    offerPrice,

    discountAmount,

    discountLabel:
      service.discountLabel,

    imageUrl:
      service.imageUrl,
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminBeautyOPCustomers() {
  const navigate =
    useNavigate()

  /* =======================================================
     OP FLOW
  ======================================================= */

  const [flow, setFlow] =
    useState(() =>
      createInitialOPFlow(),
    )

  /* =======================================================
     SERVICES
  ======================================================= */

  const [services, setServices] =
    useState<OPService[]>([])

  const [servicesLoading, setServicesLoading] =
    useState(true)

  /* =======================================================
     CUSTOMER RECORDS
  ======================================================= */

  const [customers, setCustomers] =
    useState<OPCustomer[]>([])

  const [customerSearch, setCustomerSearch] =
    useState('')

  const [dateFilter, setDateFilter] =
    useState('')

  const [customerPage, setCustomerPage] =
    useState(1)

  const [customersLoading, setCustomersLoading] =
    useState(true)

  /* =======================================================
     UI
  ======================================================= */

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [successCustomerId, setSuccessCustomerId] =
    useState('')

  const [viewingCustomerId, setViewingCustomerId] =
    useState<string | null>(null)

  const [viewingCustomer, setViewingCustomer] =
    useState<{
      customer: OPCustomer
      people: SavedPerson[]
      services: SavedService[]
    } | null>(null)

  const [loadingDetails, setLoadingDetails] =
    useState(false)

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadServices()
    void loadCustomers()
  }, [])

  /* =======================================================
     RESTORE OP FLOW
  ======================================================= */

  useEffect(() => {
    const existing =
      loadOPFlow()

    if (existing) {
      setFlow(existing)

      if (
        existing.customerName ||
        existing.mobileNumber ||
        existing.place ||
        existing.people.some(
          (person) =>
            person.name ||
            person.serviceIds.length > 0,
        )
      ) {
        setShowForm(true)
      }
    }
  }, [])

  /* =======================================================
     LOAD SERVICES
  ======================================================= */

  async function loadServices() {
    setServicesLoading(true)

    try {
      const data =
        await getServices()

      setServices(
        data
          .map(mapService)
          .filter(
            (service) =>
              service.id &&
              service.name,
          ),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load services.',
      )
    } finally {
      setServicesLoading(false)
    }
  }

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  async function loadCustomers() {
    setCustomersLoading(true)

    try {
      const {
        data,
        error:
          customersError,
      } =
        await supabase
          .from('op_customers')
          .select(
            `
              id,
              customer_name,
              mobile_number,
              place,
              visit_date,
              grand_total,
              created_at,
              op_customer_people (
                id
              )
            `,
          )
          .order(
            'visit_date',
            {
              ascending: false,
            },
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          )

      if (customersError) {
        throw customersError
      }

      const mapped =
        (data ?? []).map(
          (
            item,
          ) => {
            const people =
              Array.isArray(
                item.op_customer_people,
              )
                ? item.op_customer_people
                : []

            return {
              id:
                item.id,

              customerName:
                item.customer_name,

              mobileNumber:
                item.mobile_number,

              place:
                item.place ?? '',

              visitDate:
                item.visit_date,

              grandTotal:
                Number(
                  item.grand_total,
                ) || 0,

              createdAt:
                item.created_at,

              peopleCount:
                people.length,
            }
          },
        )

      setCustomers(
        mapped,
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load OP customers.',
      )
    } finally {
      setCustomersLoading(false)
    }
  }

  /* =======================================================
     SERVICE MAP
  ======================================================= */

  const serviceMap =
    useMemo(
      () =>
        new Map(
          services.map(
            (service) => [
              service.id,
              service,
            ],
          ),
        ),
      [services],
    )

  /* =======================================================
     PERSON TOTAL
  ======================================================= */

  function getPersonTotal(
    person: OPFlowPerson,
  ): number {
    return person.serviceIds.reduce(
      (
        total,
        serviceId,
      ) => {
        const service =
          serviceMap.get(
            serviceId,
          )

        return (
          total +
          (
            service?.offerPrice ??
            0
          )
        )
      },
      0,
    )
  }

  /* =======================================================
     PERSON ORIGINAL TOTAL
  ======================================================= */

  function getPersonOriginalTotal(
    person: OPFlowPerson,
  ): number {
    return person.serviceIds.reduce(
      (
        total,
        serviceId,
      ) => {
        const service =
          serviceMap.get(
            serviceId,
          )

        return (
          total +
          (
            service?.originalPrice ??
            0
          )
        )
      },
      0,
    )
  }

  /* =======================================================
     PERSON DISCOUNT
  ======================================================= */

  function getPersonDiscount(
    person: OPFlowPerson,
  ): number {
    return Math.max(
      getPersonOriginalTotal(
        person,
      ) -
        getPersonTotal(
          person,
        ),
      0,
    )
  }

  /* =======================================================
     GRAND TOTALS
  ======================================================= */

  const originalTotal =
    useMemo(
      () =>
        flow.people.reduce(
          (
            total,
            person,
          ) =>
            total +
            getPersonOriginalTotal(
              person,
            ),
          0,
        ),
      [
        flow.people,
        serviceMap,
      ],
    )

  const grandTotal =
    useMemo(
      () =>
        flow.people.reduce(
          (
            total,
            person,
          ) =>
            total +
            getPersonTotal(
              person,
            ),
          0,
        ),
      [
        flow.people,
        serviceMap,
      ],
    )

  const totalDiscount =
    Math.max(
      originalTotal -
        grandTotal,
      0,
    )

  /* =======================================================
     CUSTOMER FORM UPDATE
  ======================================================= */

  function updateCustomerField(
    field:
      | 'customerName'
      | 'mobileNumber'
      | 'place'
      | 'visitDate',
    value: string,
  ) {
    const current =
      loadOPFlow() ??
      flow

    const next = {
      ...current,
      [field]: value,
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     MOBILE
  ======================================================= */

  function handleMobileChange(
    value: string,
  ) {
    const digits =
      value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        )

    updateCustomerField(
      'mobileNumber',
      digits,
    )
  }

  /* =======================================================
     PERSON NAME
  ======================================================= */

  function updatePersonName(
    personId: string,
    value: string,
  ) {
    const current =
      loadOPFlow() ??
      flow

    const next = {
      ...current,

      people:
        current.people.map(
          (
            person,
          ) =>
            person.id ===
            personId
              ? {
                  ...person,
                  name: value,
                }
              : person,
        ),
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     PERSON PHONE
  ======================================================= */

  function updatePersonPhone(
    personId: string,
    value: string,
  ) {
    const digits =
      value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        )

    const current =
      loadOPFlow() ??
      flow

    const next = {
      ...current,

      people:
        current.people.map(
          (
            person,
          ) =>
            person.id ===
            personId
              ? {
                  ...person,
                  phone: digits,
                }
              : person,
        ),
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     PERSON EMAIL
  ======================================================= */

  function updatePersonEmail(
    personId: string,
    value: string,
  ) {
    const current =
      loadOPFlow() ??
      flow

    const next = {
      ...current,

      people:
        current.people.map(
          (
            person,
          ) =>
            person.id ===
            personId
              ? {
                  ...person,
                  email: value,
                }
              : person,
        ),
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     ADD PERSON
  ======================================================= */

  function addPerson() {
    const current =
      loadOPFlow() ??
      flow

    const person =
      createLocalPerson(
        current.people.length +
          1,
      )

    const next = {
      ...current,

      people: [
        ...current.people,
        person,
      ],

      selectedPersonId:
        person.id,
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     REMOVE PERSON
  ======================================================= */

  function removePerson(
    personId: string,
  ) {
    if (
      flow.people.length <=
      1
    ) {
      return
    }

    const nextPeople =
      flow.people.filter(
        (
          person,
        ) =>
          person.id !==
          personId,
      )

    const next = {
      ...flow,

      people:
        nextPeople,

      selectedPersonId:
        nextPeople[0]?.id ??
        null,
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     SELECT SERVICES
  ======================================================= */

  function openServiceSelection(
    personId: string,
  ) {
    const next = {
      ...flow,

      selectedPersonId:
        personId,
    }

    saveOPFlow(next)

    setFlow(next)

    navigate(
      '/services?opCustomer=true',
    )
  }

  /* =======================================================
     REMOVE SERVICE
  ======================================================= */

  function removeService(
    personId: string,
    serviceId: string,
  ) {
    const next = {
      ...flow,

      people:
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
        ),
    }

    saveOPFlow(next)

    setFlow(next)
  }

  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {
    clearOPFlow()

    setFlow(
      createInitialOPFlow(),
    )

    setEditingId(null)

    setShowForm(false)

    setError('')
  }

  /* =======================================================
     ADD NEW OP
  ======================================================= */

  function startNewCustomer() {
    clearOPFlow()

    const next =
      createInitialOPFlow()

    saveOPFlow(next)

    setFlow(next)

    setEditingId(null)

    setSuccess('')

    setError('')

    setShowForm(true)

    setViewingCustomerId(null)

    setViewingCustomer(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm(): string {
    if (
      !flow.customerName.trim()
    ) {
      return 'Please enter the customer name.'
    }

    if (
      !/^\d{10}$/.test(
        flow.mobileNumber.trim(),
      )
    ) {
      return 'Please enter a valid 10-digit mobile number.'
    }

    if (
      !flow.visitDate
    ) {
      return 'Please select the visit date.'
    }

    if (
      flow.people.length ===
      0
    ) {
      return 'Please add at least one person.'
    }

    for (
      let index = 0;
      index <
      flow.people.length;
      index += 1
    ) {
      const person =
        flow.people[index]

      if (
        !person.name.trim()
      ) {
        return `Please enter Person ${
          index + 1
        } name.`
      }

      if (
        person.serviceIds.length ===
        0
      ) {
        return `Please select at least one service for Person ${
          index + 1
        }.`
      }

      if (
        person.phone.trim() &&
        !/^\d{10}$/.test(
          person.phone.trim(),
        )
      ) {
        return `Please enter a valid 10-digit phone number for Person ${
          index + 1
        }.`
      }

      for (
        const serviceId of
          person.serviceIds
      ) {
        if (
          !serviceMap.has(
            serviceId,
          )
        ) {
          return `A selected service for Person ${
            index + 1
          } is no longer available. Please review the services.`
        }
      }
    }

    return ''
  }

  /* =======================================================
     SAVE CUSTOMER
  ======================================================= */

  async function saveCustomer() {
    setError('')
    setSuccess('')

    const validationError =
      validateForm()

    if (validationError) {
      setError(
        validationError,
      )

      return
    }

    if (submitting) {
      return
    }

    setSubmitting(true)

    let createdCustomerId:
      string | null = null

    try {
      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'Admin session expired. Please login again.',
        )
      }

      const finalTotal =
        grandTotal

      /* ---------------------------------------------------
         UPDATE EXISTING
      --------------------------------------------------- */

      if (editingId) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from('op_customers')
            .update({
              customer_name:
                flow.customerName.trim(),

              mobile_number:
                flow.mobileNumber.trim(),

              place:
                flow.place.trim() ||
                null,

              visit_date:
                flow.visitDate,

              grand_total:
                finalTotal,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              editingId,
            )

        if (updateError) {
          throw updateError
        }

        const {
          data:
            existingPeople,
          error:
            existingPeopleError,
        } =
          await supabase
            .from(
              'op_customer_people',
            )
            .select(
              `
                id,
                person_number,
                person_name,
                total
              `,
            )
            .eq(
              'op_customer_id',
              editingId,
            )
            .order(
              'person_number',
              {
                ascending: true,
              },
            )

        if (
          existingPeopleError
        ) {
          throw existingPeopleError
        }

        const savedExistingPeople =
          (
            existingPeople ??
            []
          ) as SavedPerson[]

        const existingIds =
          savedExistingPeople.map(
            (
              person,
            ) => person.id,
          )

        if (
          existingIds.length >
          0
        ) {
          const {
            error:
              deleteServicesError,
          } =
            await supabase
              .from(
                'op_customer_services',
              )
              .delete()
              .in(
                'op_customer_person_id',
                existingIds,
              )

          if (
            deleteServicesError
          ) {
            throw deleteServicesError
          }
        }

        const {
          error:
            deletePeopleError,
        } =
          await supabase
            .from(
              'op_customer_people',
            )
            .delete()
            .eq(
              'op_customer_id',
              editingId,
            )

        if (deletePeopleError) {
          throw deletePeopleError
        }
      }

      /* ---------------------------------------------------
         CREATE CUSTOMER
      --------------------------------------------------- */

      let customerId =
        editingId

      if (!customerId) {
        const {
          data:
            createdCustomer,
          error:
            customerError,
        } =
          await supabase
            .from(
              'op_customers',
            )
            .insert({
              customer_name:
                flow.customerName.trim(),

              mobile_number:
                flow.mobileNumber.trim(),

              place:
                flow.place.trim() ||
                null,

              visit_date:
                flow.visitDate,

              grand_total:
                finalTotal,

              created_by:
                user.id,
            })
            .select(
              'id',
            )
            .single()

        if (customerError) {
          throw customerError
        }

        if (!createdCustomer) {
          throw new Error(
            'Unable to create OP customer.',
          )
        }

        customerId =
          createdCustomer.id

        createdCustomerId =
          createdCustomer.id
      }

      /* ---------------------------------------------------
         CREATE PEOPLE
      --------------------------------------------------- */

      const peopleRows =
        flow.people.map(
          (
            person,
            index,
          ) => ({
            op_customer_id:
              customerId,

            person_number:
              index + 1,

            person_name:
              person.name.trim(),

            total:
              getPersonTotal(
                person,
              ),
          }),
        )

      const {
        data:
          createdPeople,
        error:
          peopleError,
      } =
        await supabase
          .from(
            'op_customer_people',
          )
          .insert(
            peopleRows,
          )
          .select(
            `
              id,
              person_number,
              person_name,
              total
            `,
          )

      if (peopleError) {
        throw peopleError
      }

      const savedPeople =
        (
          createdPeople ??
          []
        ) as SavedPerson[]

      if (
        savedPeople.length !==
        flow.people.length
      ) {
        throw new Error(
          'Unable to save all OP customer people.',
        )
      }

      /* ---------------------------------------------------
         CREATE SERVICES
      --------------------------------------------------- */

      const serviceRows:
        {
          op_customer_person_id:
            string
          service_id:
            string
          service_name:
            string
          actual_price:
            number
          discount_amount:
            number
          discount_label:
            string | null
          final_price:
            number
        }[] = []

      for (
        const person of flow.people
      ) {
        const savedPerson =
          savedPeople.find(
            (
              item,
            ) =>
              item.person_number ===
              flow.people.indexOf(
                person,
              ) + 1,
          )

        if (!savedPerson) {
          throw new Error(
            'Unable to match OP customer person.',
          )
        }

        for (
          const serviceId of
            person.serviceIds
        ) {
          const service =
            serviceMap.get(
              serviceId,
            )

          if (!service) {
            throw new Error(
              `Service "${serviceId}" is no longer available.`,
            )
          }

          serviceRows.push({
            op_customer_person_id:
              savedPerson.id,

            service_id:
              service.id,

            service_name:
              service.name,

            actual_price:
              Math.round(
                service.originalPrice *
                  100,
              ) / 100,

            discount_amount:
              Math.round(
                service.discountAmount *
                  100,
              ) / 100,

            discount_label:
              service.discountLabel,

            final_price:
              Math.round(
                service.offerPrice *
                  100,
              ) / 100,
          })
        }
      }

      if (
        serviceRows.length ===
        0
      ) {
        throw new Error(
          'No services were selected.',
        )
      }

      const {
        error:
          servicesError,
      } =
        await supabase
          .from(
            'op_customer_services',
          )
          .insert(
            serviceRows,
          )

      if (servicesError) {
        throw servicesError
      }

      /* ---------------------------------------------------
         SUCCESS
      --------------------------------------------------- */

      const savedId =
        customerId as string

      setSuccess(
        editingId
          ? 'OP customer updated successfully.'
          : 'OP customer added successfully.',
      )

      setSuccessCustomerId(
        savedId,
      )

      clearOPFlow()

      setFlow(
        createInitialOPFlow(),
      )

      setEditingId(null)

      setShowForm(false)

      await loadCustomers()

      setCustomerPage(1)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (saveError) {
      if (
        createdCustomerId
      ) {
        await supabase
          .from('op_customers')
          .delete()
          .eq(
            'id',
            createdCustomerId,
          )
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save OP customer.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* =======================================================
     EDIT CUSTOMER
  ======================================================= */

  async function editCustomer(
    customer: OPCustomer,
  ) {
    setError('')
    setSuccess('')
    setLoadingDetails(true)

    try {
      const {
        data:
          peopleData,
        error:
          peopleError,
      } =
        await supabase
          .from(
            'op_customer_people',
          )
          .select(
            `
              id,
              person_number,
              person_name,
              total
            `,
          )
          .eq(
            'op_customer_id',
            customer.id,
          )
          .order(
            'person_number',
            {
              ascending: true,
            },
          )

      if (peopleError) {
        throw peopleError
      }

      const people =
        (
          peopleData ??
          []
        ) as SavedPerson[]

      const peopleIds =
        people.map(
          (
            person,
          ) => person.id,
        )

      let savedServices:
        SavedService[] = []

      if (
        peopleIds.length >
        0
      ) {
        const {
          data:
            servicesData,
          error:
            servicesError,
        } =
          await supabase
            .from(
              'op_customer_services',
            )
            .select(
              `
                id,
                op_customer_person_id,
                service_id,
                service_name,
                actual_price,
                discount_amount,
                discount_label,
                final_price
              `,
            )
            .in(
              'op_customer_person_id',
              peopleIds,
            )

        if (servicesError) {
          throw servicesError
        }

        savedServices =
          (
            servicesData ??
            []
          ) as SavedService[]
      }

      const loadedPeople:
        OPFlowPerson[] =
        people.map(
          (
            person,
          ) => ({
            id:
              `edit-${person.id}`,

            name:
              person.person_name,

            phone: '',

            email: '',

            serviceIds:
              savedServices
                .filter(
                  (
                    service,
                  ) =>
                    service.op_customer_person_id ===
                      person.id &&
                    Boolean(
                      service.service_id,
                    ),
                )
                .map(
                  (
                    service,
                  ) =>
                    service.service_id as string,
                ),
          }),
        )

      const next = {
        customerName:
          customer.customerName,

        mobileNumber:
          customer.mobileNumber,

        place:
          customer.place,

        visitDate:
          customer.visitDate,

        people:
          loadedPeople.length >
          0
            ? loadedPeople
            : [
                createLocalPerson(
                  1,
                ),
              ],

        selectedPersonId:
          loadedPeople[0]?.id ??
          null,
      }

      saveOPFlow(next)

      setFlow(next)

      setEditingId(
        customer.id,
      )

      setShowForm(true)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (editError) {
      setError(
        editError instanceof Error
          ? editError.message
          : 'Unable to load OP customer.',
      )
    } finally {
      setLoadingDetails(false)
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteCustomer(
    customer: OPCustomer,
  ) {
    const confirmed =
      window.confirm(
        `Delete OP customer "${customer.customerName}"?\n\nAll people and service records will also be deleted.`,
      )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const {
        error:
          deleteError,
      } =
        await supabase
          .from('op_customers')
          .delete()
          .eq(
            'id',
            customer.id,
          )

      if (deleteError) {
        throw deleteError
      }

      if (
        viewingCustomerId ===
        customer.id
      ) {
        setViewingCustomerId(
          null,
        )

        setViewingCustomer(
          null,
        )
      }

      if (
        editingId ===
        customer.id
      ) {
        resetForm()
      }

      setSuccess(
        'OP customer deleted successfully.',
      )

      await loadCustomers()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete OP customer.',
      )
    }
  }

  /* =======================================================
     VIEW CUSTOMER
  ======================================================= */

  async function viewCustomer(
    customer: OPCustomer,
  ) {
    setError('')
    setViewingCustomerId(
      customer.id,
    )
    setViewingCustomer(
      null,
    )
    setLoadingDetails(true)

    try {
      const {
        data:
          peopleData,
        error:
          peopleError,
      } =
        await supabase
          .from(
            'op_customer_people',
          )
          .select(
            `
              id,
              person_number,
              person_name,
              total
            `,
          )
          .eq(
            'op_customer_id',
            customer.id,
          )
          .order(
            'person_number',
            {
              ascending: true,
            },
          )

      if (peopleError) {
        throw peopleError
      }

      const people =
        (
          peopleData ??
          []
        ) as SavedPerson[]

      const peopleIds =
        people.map(
          (
            person,
          ) => person.id,
        )

      let savedServices:
        SavedService[] = []

      if (
        peopleIds.length >
        0
      ) {
        const {
          data:
            servicesData,
          error:
            servicesError,
        } =
          await supabase
            .from(
              'op_customer_services',
            )
            .select(
              `
                id,
                op_customer_person_id,
                service_id,
                service_name,
                actual_price,
                discount_amount,
                discount_label,
                final_price
              `,
            )
            .in(
              'op_customer_person_id',
              peopleIds,
            )

        if (servicesError) {
          throw servicesError
        }

        savedServices =
          (
            servicesData ??
            []
          ) as SavedService[]
      }

      setViewingCustomer({
        customer,
        people,
        services:
          savedServices,
      })

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (viewError) {
      setError(
        viewError instanceof Error
          ? viewError.message
          : 'Unable to load customer details.',
      )
    } finally {
      setLoadingDetails(false)
    }
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase()

      return customers.filter(
        (
          customer,
        ) => {
          const searchable = [
            customer.customerName,
            customer.mobileNumber,
            customer.place,
          ]
            .join(' ')
            .toLowerCase()

          const matchesSearch =
            !query ||
            searchable.includes(
              query,
            )

          const matchesDate =
            !dateFilter ||
            customer.visitDate ===
              dateFilter

          return (
            matchesSearch &&
            matchesDate
          )
        },
      )
    }, [
      customers,
      customerSearch,
      dateFilter,
    ])

  useEffect(() => {
    setCustomerPage(1)
  }, [
    customerSearch,
    dateFilter,
  ])

  const totalCustomerPages =
    Math.max(
      1,
      Math.ceil(
        filteredCustomers.length /
          CUSTOMERS_PER_PAGE,
      ),
    )

  const safeCustomerPage =
    Math.min(
      customerPage,
      totalCustomerPages,
    )

  const visibleCustomers =
    filteredCustomers.slice(
      (
        safeCustomerPage -
        1
      ) *
        CUSTOMERS_PER_PAGE,
      safeCustomerPage *
        CUSTOMERS_PER_PAGE,
    )

  /* =======================================================
     VIEW HELPERS
  ======================================================= */

  function getSavedPersonServices(
    personId: string,
  ) {
    if (
      !viewingCustomer
    ) {
      return []
    }

    return viewingCustomer.services.filter(
      (
        service,
      ) =>
        service.op_customer_person_id ===
        personId,
    )
  }

  /* =======================================================
     SUCCESS SCREEN
  ======================================================= */

  if (
    success &&
    successCustomerId &&
    !showForm &&
    !viewingCustomer
  ) {
    const customer =
      customers.find(
        (
          item,
        ) =>
          item.id ===
          successCustomerId,
      )

    return (
      <main className="admin-op-customers-page">
        

        <section className="admin-op-success-card">

          <div className="admin-op-success-icon">
            ✓
          </div>

          <span className="admin-op-eyebrow">
            WALK-IN RECORD
          </span>

          <h1>
            OP Customer Added
            <span>
              Successfully
            </span>
          </h1>

          <p>
            The walk-in customer and
            all selected services have
            been saved successfully.
          </p>

          {customer && (
            <div className="admin-op-success-summary">

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {
                    customer.customerName
                  }
                </strong>
              </div>

              <div>
                <span>
                  Visit Date
                </span>

                <strong>
                  {formatDate(
                    customer.visitDate,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Persons
                </span>

                <strong>
                  {
                    customer.peopleCount
                  }
                </strong>
              </div>

              <div>
                <span>
                  Estimated Bill
                </span>

                <strong>
                  {formatCurrency(
                    customer.grandTotal,
                  )}
                </strong>
              </div>

            </div>
          )}

          <div className="admin-op-success-actions">

            <button
              type="button"
              className="admin-op-primary-button"
              onClick={() =>
                void viewCustomer(
                  customer as OPCustomer,
                )
              }
              disabled={!customer}
            >
              View Customer
            </button>

            <button
              type="button"
              className="admin-op-secondary-button"
              onClick={
                startNewCustomer
              }
            >
              Add Another OP Customer
            </button>

          </div>

        </section>

      </main>
    )
  }

  /* =======================================================
     CUSTOMER DETAIL
  ======================================================= */

  if (
    viewingCustomerId &&
    (
      loadingDetails ||
      viewingCustomer
    )
  ) {
    return (
      <main className="admin-op-customers-page">

        <header className="admin-op-page-header">

          <div>

            <button
              type="button"
              className="admin-op-inline-back"
              onClick={() => {
                setViewingCustomerId(
                  null,
                )

                setViewingCustomer(
                  null,
                )
              }}
            >
              ← Back to OP Customers
            </button>

            <span className="admin-op-eyebrow">
              WALK-IN CUSTOMER
            </span>

            <h1>
              OP Beauty Customer
            </h1>

          </div>

        </header>

        {loadingDetails ? (
          <section className="admin-op-detail-card">
            <div className="admin-op-loading">
              Loading customer details...
            </div>
          </section>
        ) : viewingCustomer ? (
          <section className="admin-op-detail-card">

            <div className="admin-op-detail-header">

              <div>

                <span className="admin-op-detail-label">
                  CUSTOMER
                </span>

                <h2>
                  {
                    viewingCustomer
                      .customer
                      .customerName
                  }
                </h2>

                <p>
                  {
                    viewingCustomer
                      .customer
                      .mobileNumber
                  }
                </p>

                <p>
                  {
                    viewingCustomer
                      .customer
                      .place ||
                    'Place not provided'
                  }
                </p>

              </div>

              <div className="admin-op-detail-date">

                <span>
                  VISIT DATE
                </span>

                <strong>
                  {formatDate(
                    viewingCustomer
                      .customer
                      .visitDate,
                  )}
                </strong>

              </div>

            </div>

            <div className="admin-op-detail-people">

              {viewingCustomer.people.map(
                (
                  person,
                ) => {
                  const personServices =
                    getSavedPersonServices(
                      person.id,
                    )

                  return (
                    <article
                      key={
                        person.id
                      }
                      className="admin-op-detail-person"
                    >

                      <div className="admin-op-detail-person-heading">

                        <div>

                          <span>
                            PERSON{' '}
                            {
                              person.person_number
                            }
                          </span>

                          <h3>
                            {
                              person.person_name
                            }
                          </h3>

                        </div>

                        <strong>
                          {formatCurrency(
                            Number(
                              person.total,
                            ),
                          )}
                        </strong>

                      </div>

                      <div className="admin-op-detail-services">

                        {personServices.map(
                          (
                            service,
                          ) => (
                            <div
                              key={
                                service.id
                              }
                              className="admin-op-detail-service"
                            >

                              <div className="admin-op-detail-service-image">

                                {service.service_id &&
                                serviceMap.get(
                                  service.service_id,
                                )?.imageUrl ? (
                                  <img
                                    src={
                                      serviceMap.get(
                                        service.service_id,
                                      )?.imageUrl ??
                                      ''
                                    }
                                    alt={
                                      service.service_name
                                    }
                                  />
                                ) : (
                                  <div>
                                    WF
                                  </div>
                                )}

                              </div>

                              <div className="admin-op-detail-service-info">

                                <strong>
                                  {
                                    service.service_name
                                  }
                                </strong>

                                <div>

                                  <span>
                                    Actual
                                  </span>

                                  <strong>
                                    {formatCurrency(
                                      Number(
                                        service.actual_price,
                                      ),
                                    )}
                                  </strong>

                                </div>

                                {Number(
                                  service.discount_amount,
                                ) > 0 && (
                                  <div>

                                    <span>
                                      Discount
                                    </span>

                                    <strong className="discount">
                                      −
                                      {formatCurrency(
                                        Number(
                                          service.discount_amount,
                                        ),
                                      )}
                                    </strong>

                                  </div>
                                )}

                                <div>

                                  <span>
                                    Final
                                  </span>

                                  <strong>
                                    {formatCurrency(
                                      Number(
                                        service.final_price,
                                      ),
                                    )}
                                  </strong>

                                </div>

                              </div>

                            </div>
                          ),
                        )}

                      </div>

                    </article>
                  )
                },
              )}

            </div>

            <div className="admin-op-detail-total">

              <div>
                <span>
                  Original Total
                </span>

                <strong>
                  {formatCurrency(
                    viewingCustomer.services.reduce(
                      (
                        total,
                        service,
                      ) =>
                        total +
                        Number(
                          service.actual_price,
                        ),
                      0,
                    ),
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total Discount
                </span>

                <strong className="discount">
                  −
                  {formatCurrency(
                    viewingCustomer.services.reduce(
                      (
                        total,
                        service,
                      ) =>
                        total +
                        Number(
                          service.discount_amount,
                        ),
                      0,
                    ),
                  )}
                </strong>
              </div>

              <div className="grand-total">

                <span>
                  Estimated Bill
                </span>

                <strong>
                  {formatCurrency(
                    viewingCustomer
                      .customer
                      .grandTotal,
                  )}
                </strong>

              </div>

            </div>

            <div className="admin-op-detail-actions">

              <button
                type="button"
                className="admin-op-secondary-button"
                onClick={() => {
                  setViewingCustomerId(
                    null,
                  )

                  setViewingCustomer(
                    null,
                  )
                }}
              >
                Back
              </button>

              <button
                type="button"
                className="admin-op-primary-button"
                onClick={() =>
                  window.print()
                }
              >
                Print Bill
              </button>

            </div>

          </section>
        ) : null}

      </main>
    )
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="admin-op-customers-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="admin-op-page-header">

        <div>

          <span className="admin-op-eyebrow">
            WALK-IN MANAGEMENT
          </span>

          <h1>
            OP Beauty Customers
          </h1>

          <p>
            Record walk-in customers,
            assign services by person,
            and generate an estimated
            bill without appointment
            time slots.
          </p>

        </div>

        <button
          type="button"
          className="admin-op-primary-button"
          onClick={
            startNewCustomer
          }
        >
          + Add OP Customer
        </button>

      </header>

      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (
        <div className="admin-op-alert admin-op-alert-error">
          <strong>
            Something went wrong
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {success && !successCustomerId && (
        <div className="admin-op-alert admin-op-alert-success">
          <strong>
            Success
          </strong>

          <span>
            {success}
          </span>
        </div>
      )}

      {/* ===================================================
          FORM
      =================================================== */}

      {showForm && (
        <section className="admin-op-form-card">

          <div className="admin-op-form-header">

            <div>

              <span className="admin-op-eyebrow">
                {editingId
                  ? 'EDIT WALK-IN'
                  : 'NEW WALK-IN'}
              </span>

              <h2>
                {editingId
                  ? 'Edit OP Customer'
                  : 'Add OP Beauty Customer'}
              </h2>

              <p>
                Enter customer details,
                then assign services to
                each person.
              </p>

            </div>

            <button
              type="button"
              className="admin-op-close-button"
              onClick={
                resetForm
              }
              disabled={
                submitting
              }
            >
              ×
            </button>

          </div>

          {/* =================================================
              CUSTOMER INFORMATION
          ================================================= */}

          <section className="admin-op-section">

            <div className="admin-op-section-heading">

              <span>
                01
              </span>

              <div>

                <small>
                  CUSTOMER INFORMATION
                </small>

                <h3>
                  Walk-in details
                </h3>

              </div>

            </div>

            <div className="admin-op-form-grid">

              <label className="admin-op-field">

                <span>
                  Customer Name
                  <b>*</b>
                </span>

                <input
                  type="text"
                  value={
                    flow.customerName
                  }
                  onChange={(
                    event,
                  ) =>
                    updateCustomerField(
                      'customerName',
                      event.target.value,
                    )
                  }
                  placeholder="Enter customer name"
                  autoComplete="name"
                />

              </label>

              <label className="admin-op-field">

                <span>
                  Mobile Number
                  <b>*</b>
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={
                    flow.mobileNumber
                  }
                  onChange={(
                    event,
                  ) =>
                    handleMobileChange(
                      event.target.value,
                    )
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  autoComplete="tel"
                />

                <small>
                  {flow.mobileNumber.length}/10
                </small>

              </label>

              <label className="admin-op-field">

                <span>
                  Place
                </span>

                <input
                  type="text"
                  value={
                    flow.place
                  }
                  onChange={(
                    event,
                  ) =>
                    updateCustomerField(
                      'place',
                      event.target.value,
                    )
                  }
                  placeholder="Chennai"
                  autoComplete="address-level2"
                />

              </label>

              <label className="admin-op-field">

                <span>
                  Visit Date
                  <b>*</b>
                </span>

                <input
                  type="date"
                  value={
                    flow.visitDate
                  }
                  onChange={(
                    event,
                  ) =>
                    updateCustomerField(
                      'visitDate',
                      event.target.value,
                    )
                  }
                />

              </label>

            </div>

          </section>

          {/* =================================================
              PEOPLE
          ================================================= */}

          <section className="admin-op-section">

            <div className="admin-op-section-heading">

              <span>
                02
              </span>

              <div>

                <small>
                  PEOPLE
                </small>

                <h3>
                  People receiving services
                </h3>

              </div>

            </div>

            <div className="admin-op-people-list">

              {flow.people.map(
                (
                  person,
                  index,
                ) => (
                  <article
                    key={
                      person.id
                    }
                    className={
                      `admin-op-person-card ${
                        flow.selectedPersonId ===
                        person.id
                          ? 'selected'
                          : ''
                      }`
                    }
                  >

                    <div className="admin-op-person-header">

                      <div className="admin-op-person-number">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </div>

                      <div>

                        <span>
                          PERSON{' '}
                          {
                            index + 1
                          }
                        </span>

                        <h4>
                          {
                            person.name ||
                            'New person'
                          }
                        </h4>

                      </div>

                      {flow.people.length >
                        1 && (
                        <button
                          type="button"
                          className="admin-op-remove-person"
                          onClick={() =>
                            removePerson(
                              person.id,
                            )
                          }
                          disabled={
                            submitting
                          }
                        >
                          Remove
                        </button>
                      )}

                    </div>

                    <div className="admin-op-person-fields">

                      <label className="admin-op-field">

                        <span>
                          Person Name
                          <b>*</b>
                        </span>

                        <input
                          type="text"
                          value={
                            person.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updatePersonName(
                              person.id,
                              event.target.value,
                            )
                          }
                          placeholder={`Person ${
                            index + 1
                          } name`}
                        />

                      </label>

                      <label className="admin-op-field">

                        <span>
                          Mobile
                        </span>

                        <input
                          type="tel"
                          inputMode="numeric"
                          value={
                            person.phone
                          }
                          onChange={(
                            event,
                          ) =>
                            updatePersonPhone(
                              person.id,
                              event.target.value,
                            )
                          }
                          placeholder="Optional"
                          maxLength={10}
                        />

                      </label>

                      <label className="admin-op-field admin-op-field-wide">

                        <span>
                          Email
                        </span>

                        <input
                          type="email"
                          value={
                            person.email
                          }
                          onChange={(
                            event,
                          ) =>
                            updatePersonEmail(
                              person.id,
                              event.target.value,
                            )
                          }
                          placeholder="Optional email"
                        />

                      </label>

                    </div>

                    {/* =======================================
                        SELECTED SERVICES
                    ======================================= */}

                    <div className="admin-op-person-services">

                      <div className="admin-op-services-heading">

                        <div>

                          <span>
                            SERVICES
                          </span>

                          <strong>
                            {
                              person.serviceIds.length
                            }{' '}
                            selected
                          </strong>

                        </div>

                        <button
                          type="button"
                          className="admin-op-service-select-button"
                          onClick={() =>
                            openServiceSelection(
                              person.id,
                            )
                          }
                        >
                          {person.serviceIds.length >
                          0
                            ? 'Change Services'
                            : 'Select Services'}
                        </button>

                      </div>

                      {person.serviceIds.length >
                      0 ? (
                        <div className="admin-op-selected-services">

                          {person.serviceIds.map(
                            (
                              serviceId,
                            ) => {
                              const service =
                                serviceMap.get(
                                  serviceId,
                                )

                              if (!service) {
                                return null
                              }

                              return (
                                <div
                                  key={
                                    serviceId
                                  }
                                  className="admin-op-selected-service"
                                >

                                  <div className="admin-op-selected-service-image">

                                    {service.imageUrl ? (
                                      <img
                                        src={
                                          service.imageUrl
                                        }
                                        alt={
                                          service.name
                                        }
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div>
                                        WF
                                      </div>
                                    )}

                                  </div>

                                  <div className="admin-op-selected-service-content">

                                    <strong>
                                      {
                                        service.name
                                      }
                                    </strong>

                                    <div className="admin-op-service-prices">

                                      {service.discountAmount >
                                        0 && (
                                        <span className="original">
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

                                      {service.discountLabel && (
                                        <span className="discount-badge">
                                          {
                                            service.discountLabel
                                          }
                                        </span>
                                      )}

                                    </div>

                                  </div>

                                  <button
                                    type="button"
                                    className="admin-op-remove-service"
                                    onClick={() =>
                                      removeService(
                                        person.id,
                                        serviceId,
                                      )
                                    }
                                    aria-label={`Remove ${service.name}`}
                                  >
                                    ×
                                  </button>

                                </div>
                              )
                            },
                          )}

                        </div>
                      ) : (
                        <div className="admin-op-no-services">

                          <span>
                            No services selected
                            for this person.
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              openServiceSelection(
                                person.id,
                              )
                            }
                          >
                            Select a Service →
                          </button>

                        </div>
                      )}

                      {person.serviceIds.length >
                        0 && (
                        <div className="admin-op-person-total">

                          <span>
                            Person Total
                          </span>

                          <strong>
                            {formatCurrency(
                              getPersonTotal(
                                person,
                              ),
                            )}
                          </strong>

                        </div>
                      )}

                    </div>

                  </article>
                ),
              )}

            </div>

            <button
              type="button"
              className="admin-op-add-person-button"
              onClick={
                addPerson
              }
              disabled={
                submitting
              }
            >
              <span>
                +
              </span>

              <div>
                <strong>
                  Add Another Person
                </strong>

                <small>
                  Add services separately
                  for each person
                </small>
              </div>
            </button>

          </section>

          {/* =================================================
              BILL
          ================================================= */}

          <section className="admin-op-billing-section">

            <div className="admin-op-section-heading">

              <span>
                03
              </span>

              <div>

                <small>
                  ESTIMATED BILL
                </small>

                <h3>
                  Pricing summary
                </h3>

              </div>

            </div>

            <div className="admin-op-billing-layout">

              <div className="admin-op-person-bills">

                {flow.people.map(
                  (
                    person,
                    index,
                  ) => (
                    <article
                      key={
                        person.id
                      }
                      className="admin-op-person-bill"
                    >

                      <div>

                        <span>
                          Person{' '}
                          {index + 1}
                        </span>

                        <strong>
                          {
                            person.name ||
                            'Name not entered'
                          }
                        </strong>

                      </div>

                      <div>

                        <span>
                          {
                            person.serviceIds.length
                          }{' '}
                          service
                          {person.serviceIds.length ===
                          1
                            ? ''
                            : 's'}
                        </span>

                        <strong>
                          {formatCurrency(
                            getPersonTotal(
                              person,
                            ),
                          )}
                        </strong>

                      </div>

                    </article>
                  ),
                )}

              </div>

              <aside className="admin-op-bill-summary">

                <div>
                  <span>
                    Original Total
                  </span>

                  <strong>
                    {formatCurrency(
                      originalTotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Total Discount
                  </span>

                  <strong className="discount">
                    −
                    {formatCurrency(
                      totalDiscount,
                    )}
                  </strong>
                </div>

                <div className="grand-total">

                  <span>
                    Estimated Bill
                  </span>

                  <strong>
                    {formatCurrency(
                      grandTotal,
                    )}
                  </strong>

                </div>

              </aside>

            </div>

          </section>

          {/* =================================================
              FORM ACTIONS
          ================================================= */}

          <div className="admin-op-form-actions">

            <button
              type="button"
              className="admin-op-secondary-button"
              onClick={
                resetForm
              }
              disabled={
                submitting
              }
            >
              {editingId
                ? 'Cancel Edit'
                : 'Clear Form'}
            </button>

            <button
              type="button"
              className="admin-op-primary-button"
              onClick={() =>
                void saveCustomer()
              }
              disabled={
                submitting ||
                servicesLoading
              }
            >
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Update & Save'
                  : 'Submit OP Customer'}
            </button>

          </div>

        </section>
      )}

      {/* ===================================================
          CUSTOMER RECORDS
      =================================================== */}

      {!showForm && (
        <section className="admin-op-list-card">

          <div className="admin-op-list-header">

            <div>

              <span>
                OP CUSTOMER RECORDS
              </span>

              <h2>
                Walk-in customer history
              </h2>

            </div>

            <strong>
              {
                filteredCustomers.length
              }
            </strong>

          </div>

          <div className="admin-op-list-filters">

            <div className="admin-op-search-wrap">

              <span>
                ⌕
              </span>

              <input
                type="search"
                value={
                  customerSearch
                }
                onChange={(
                  event,
                ) =>
                  setCustomerSearch(
                    event.target.value,
                  )
                }
                placeholder="Search customer, mobile or place..."
              />

            </div>

            <input
              type="date"
              value={
                dateFilter
              }
              onChange={(
                event,
              ) =>
                setDateFilter(
                  event.target.value,
                )
              }
            />

            {(customerSearch ||
              dateFilter) && (
              <button
                type="button"
                className="admin-op-filter-clear"
                onClick={() => {
                  setCustomerSearch(
                    '',
                  )

                  setDateFilter(
                    '',
                  )
                }}
              >
                Clear
              </button>
            )}

          </div>

          {customersLoading ? (
            <div className="admin-op-loading">
              Loading OP customers...
            </div>
          ) : visibleCustomers.length ===
            0 ? (
            <div className="admin-op-empty">

              <div>
                +
              </div>

              <strong>
                No OP customers found
              </strong>

              <span>
                Walk-in customer records
                will appear here after
                you save them.
              </span>

              <button
                type="button"
                className="admin-op-primary-button"
                onClick={
                  startNewCustomer
                }
              >
                Add First OP Customer
              </button>

            </div>
          ) : (
            <>
              <div className="admin-op-table-wrap">

                <table className="admin-op-table">

                  <thead>

                    <tr>

                      <th>
                        Customer
                      </th>

                      <th>
                        Mobile
                      </th>

                      <th>
                        Place
                      </th>

                      <th>
                        Persons
                      </th>

                      <th>
                        Visit Date
                      </th>

                      <th>
                        Estimated Bill
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {visibleCustomers.map(
                      (
                        customer,
                      ) => (
                        <tr
                          key={
                            customer.id
                          }
                        >

                          <td>
                            <div className="admin-op-customer-name">

                              <strong>
                                {
                                  customer.customerName
                                }
                              </strong>

                              <span>
                                Walk-in
                              </span>

                            </div>
                          </td>

                          <td>
                            {
                              customer.mobileNumber
                            }
                          </td>

                          <td>
                            {
                              customer.place ||
                              '—'
                            }
                          </td>

                          <td>
                            <span className="admin-op-person-count">
                              {
                                customer.peopleCount
                              }
                            </span>
                          </td>

                          <td>
                            {
                              formatDate(
                                customer.visitDate,
                              )
                            }
                          </td>

                          <td>
                            <strong className="admin-op-table-total">
                              {formatCurrency(
                                customer.grandTotal,
                              )}
                            </strong>
                          </td>

                          <td>

                            <div className="admin-op-table-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  void viewCustomer(
                                    customer,
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void editCustomer(
                                    customer,
                                  )
                                }
                                disabled={
                                  loadingDetails
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete"
                                onClick={() =>
                                  void deleteCustomer(
                                    customer,
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  MOBILE RECORD CARDS
              ================================================= */}

              <div className="admin-op-mobile-records">

                {visibleCustomers.map(
                  (
                    customer,
                  ) => (
                    <article
                      key={
                        customer.id
                      }
                      className="admin-op-mobile-record"
                    >

                      <div className="admin-op-mobile-record-top">

                        <div>

                          <span>
                            WALK-IN
                          </span>

                          <h3>
                            {
                              customer.customerName
                            }
                          </h3>

                        </div>

                        <strong>
                          {formatCurrency(
                            customer.grandTotal,
                          )}
                        </strong>

                      </div>

                      <div className="admin-op-mobile-record-info">

                        <div>
                          <span>
                            Mobile
                          </span>

                          <strong>
                            {
                              customer.mobileNumber
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Place
                          </span>

                          <strong>
                            {
                              customer.place ||
                              '—'
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Persons
                          </span>

                          <strong>
                            {
                              customer.peopleCount
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Visit
                          </span>

                          <strong>
                            {
                              formatDate(
                                customer.visitDate,
                              )
                            }
                          </strong>
                        </div>

                      </div>

                      <div className="admin-op-mobile-record-actions">

                        <button
                          type="button"
                          onClick={() =>
                            void viewCustomer(
                              customer,
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void editCustomer(
                              customer,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            void deleteCustomer(
                              customer,
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </article>
                  ),
                )}

              </div>
            </>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!customersLoading &&
            filteredCustomers.length >
              CUSTOMERS_PER_PAGE && (
            <footer className="admin-op-list-pagination">

              <span>
                Showing{' '}
                <strong>
                  {(
                    (
                      safeCustomerPage -
                      1
                    ) *
                      CUSTOMERS_PER_PAGE
                  ) + 1}
                </strong>
                {' – '}
                <strong>
                  {Math.min(
                    safeCustomerPage *
                      CUSTOMERS_PER_PAGE,
                    filteredCustomers.length,
                  )}
                </strong>
                {' of '}
                <strong>
                  {
                    filteredCustomers.length
                  }
                </strong>
              </span>

              <div>

                <button
                  type="button"
                  disabled={
                    safeCustomerPage ===
                    1
                  }
                  onClick={() =>
                    setCustomerPage(
                      (
                        previous,
                      ) =>
                        Math.max(
                          previous - 1,
                          1,
                        ),
                    )
                  }
                >
                  ‹
                </button>

                {Array.from(
                  {
                    length:
                      totalCustomerPages,
                  },
                  (
                    _,
                    index,
                  ) =>
                    index + 1,
                )
                  .filter(
                    (
                      page,
                    ) =>
                      page === 1 ||
                      page ===
                        totalCustomerPages ||
                      Math.abs(
                        page -
                          safeCustomerPage,
                      ) <= 1,
                  )
                  .map(
                    (
                      page,
                    ) => (
                      <button
                        type="button"
                        key={
                          page
                        }
                        className={
                          page ===
                          safeCustomerPage
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setCustomerPage(
                            page,
                          )
                        }
                      >
                        {
                          page
                        }
                      </button>
                    ),
                  )}

                <button
                  type="button"
                  disabled={
                    safeCustomerPage ===
                    totalCustomerPages
                  }
                  onClick={() =>
                    setCustomerPage(
                      (
                        previous,
                      ) =>
                        Math.min(
                          previous + 1,
                          totalCustomerPages,
                        ),
                    )
                  }
                >
                  ›
                </button>

              </div>

            </footer>
          )}

        </section>
      )}

    </main>
  )
}

export default AdminBeautyOPCustomers