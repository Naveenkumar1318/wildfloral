import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'
import { assets } from '../../../assets/assets'

import {
  loadBookingFlow,
  saveBookingFlow,
  setBookingMode,
  setBookingStep,
  setSelectedServices as saveSelectedServices,
  setServicePrices,
  type BookingFlowState,
} from '../../../lib/bookingFlow'


import {
  getBookingCartServiceIds,
  addToBookingCart,
  clearBookingCart,
  removeFromBookingCart,
} from '../../../lib/bookingCart'

import {
  loadOPFlow,
  toggleOPService,
} from '../../../lib/opCustomerFlow'

import './Services.css'

/* =========================================================
   ENQUIRY FLOW STORAGE
========================================================= */

const ENQUIRY_FLOW_STORAGE_KEY =
  'wildfloral_enquiry_flow'

function loadEnquiryFlow():
  BookingFlowState | null {
  try {
    const raw =
      window.localStorage.getItem(
        ENQUIRY_FLOW_STORAGE_KEY,
      )

    if (!raw) {
      return null
    }

    const parsed =
      JSON.parse(raw) as BookingFlowState

    if (
      !parsed ||
      parsed.mode !== 'enquiry' ||
      !Array.isArray(parsed.people)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function saveEnquiryFlow(
  flow: BookingFlowState,
) {
  window.localStorage.setItem(
    ENQUIRY_FLOW_STORAGE_KEY,
    JSON.stringify({
      ...flow,
      mode: 'enquiry',
    }),
  )
}

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string
}

type Service = {
  id: string
  categoryId: string
  category: string
  name: string
  description: string
  duration: string
  price: number
  image: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

type ServiceRow = {
  id: string
  category_id: string | null
  category: string | null
  name: string
  description: string | null
  duration_minutes: number | null
  price: number | string
  image_url: string | null
}

type Offer = {
  id: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  promoCode: string | null
  imageUrl: string | null
  startsAt: string
  endsAt: string | null
  priority: number
  scopeType: 'service' | 'category' | 'all'
  appliesToAll: boolean
  serviceIds: string[]
  categoryIds: string[]
  createdAt: string
}

type OfferRow = {
  id: string
  title: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number | string
  promo_code: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  service_id: string | null
  category_id: string | null
  is_active: boolean
  priority: number | string | null
  scope_type: 'service' | 'category' | 'all'
  service_group: 'beauty' | 'fashion'
  applies_to_all: boolean
  created_at: string
}

type ServiceLinkRow = {
  offer_id: string
  service_id: string
}

type CategoryLinkRow = {
  offer_id: string
  category_id: string
}

/* =========================================================
   CONSTANTS
========================================================= */

const ITEMS_PER_PAGE = 6

function currentServiceIds(
  serviceIds: readonly string[],
): string[] {
  return [
    ...new Set(
      serviceIds.filter(
        (serviceId) =>
          typeof serviceId === 'string' &&
          serviceId.trim().length > 0,
      ),
    ),
  ]
}

const SORT_OPTIONS = [
  {
    value: 'recommended',
    label: 'Recommended',
  },
  {
    value: 'price-low',
    label: 'Price: Low to High',
  },
  {
    value: 'price-high',
    label: 'Price: High to Low',
  },
  {
    value: 'name-az',
    label: 'Name: A to Z',
  },
  {
    value: 'name-za',
    label: 'Name: Z to A',
  },
]

/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* =========================================================
   OFFER HELPERS
========================================================= */

function matchesOfferToService(
  offer: Offer,
  service: Service,
) {
  if (
    offer.scopeType === 'all' ||
    offer.appliesToAll
  ) {
    return true
  }

  if (
    offer.scopeType === 'service'
  ) {
    return offer.serviceIds.includes(
      service.id,
    )
  }

  if (
    offer.scopeType === 'category'
  ) {
    return (
      Boolean(service.categoryId) &&
      offer.categoryIds.includes(
        service.categoryId,
      )
    )
  }

  return (
    offer.serviceIds.includes(
      service.id,
    ) ||
    (
      Boolean(service.categoryId) &&
      offer.categoryIds.includes(
        service.categoryId,
      )
    ) ||
    (
      offer.serviceIds.length === 0 &&
      offer.categoryIds.length === 0
    )
  )
}

function getOfferScopeRank(
  offer: Offer,
  service: Service,
) {
  if (
    offer.scopeType === 'service' &&
    offer.serviceIds.includes(
      service.id,
    )
  ) {
    return 3
  }

  if (
    offer.scopeType === 'category' &&
    offer.categoryIds.includes(
      service.categoryId,
    )
  ) {
    return 2
  }

  if (
    offer.scopeType === 'all' ||
    offer.appliesToAll
  ) {
    return 1
  }

  return 0
}

function getApplicableOffer(
  service: Service,
  offers: Offer[],
): Offer | null {
  const now = new Date()

  const applicableOffers =
    offers.filter((offer) => {
      if (
        !matchesOfferToService(
          offer,
          service,
        )
      ) {
        return false
      }

      const startDate =
        new Date(
          offer.startsAt,
        )

      const endDate =
        offer.endsAt
          ? new Date(
            offer.endsAt,
          )
          : null

      if (now < startDate) {
        return false
      }

      if (
        endDate &&
        now > endDate
      ) {
        return false
      }

      return true
    })

  if (
    applicableOffers.length === 0
  ) {
    return null
  }

  return [
    ...applicableOffers,
  ].sort(
    (a, b) => {
      const priorityDifference =
        b.priority -
        a.priority

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference
      }

      const scopeDifference =
        getOfferScopeRank(
          b,
          service,
        ) -
        getOfferScopeRank(
          a,
          service,
        )

      if (
        scopeDifference !== 0
      ) {
        return scopeDifference
      }

      return (
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime()
      )
    },
  )[0]
}

/* =========================================================
   DISCOUNT
========================================================= */

function calculateDiscount(
  price: number,
  offer: Offer | null,
) {
  if (!offer) {
    return {
      originalPrice: price,
      discountAmount: 0,
      finalPrice: price,
    }
  }

  let discountAmount = 0

  if (
    offer.discountType ===
    'percentage'
  ) {
    discountAmount =
      price *
      (offer.discountValue / 100)
  } else {
    discountAmount =
      offer.discountValue
  }

  discountAmount = Math.min(
    Math.max(
      discountAmount,
      0,
    ),
    price,
  )

  return {
    originalPrice: price,
    discountAmount,
    finalPrice: Math.max(
      price - discountAmount,
      0,
    ),
  }
}

function discountText(
  offer: Offer,
) {
  if (
    offer.discountType ===
    'percentage'
  ) {
    return `${offer.discountValue}% OFF`
  }

  return `₹${Math.round(
    offer.discountValue,
  ).toLocaleString('en-IN')} OFF`
}

function formatPrice(
  value: number,
) {
  return `₹${Math.round(
    value,
  ).toLocaleString('en-IN')}`
}

function formatOfferDate(
  date: string | null,
) {
  if (!date) {
    return null
  }

  const parsedDate =
    new Date(date)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return null
  }

  return parsedDate.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Services() {
  const navigate =
    useNavigate()

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()


  const categoryParam =
    searchParams.get('category')

  const assignTo =
    searchParams.get('assignTo')

  const opCustomer =
    searchParams.get(
      'opCustomer',
    )

  const isOPCustomer =
    opCustomer === 'true'

  const modeParam =
    searchParams.get('mode')

  const mode =
    modeParam === 'enquiry'
      ? 'enquiry'
      : 'booking'

  /* =======================================================
     STATE
  ======================================================= */

  const [
    services,
    setServices,
  ] = useState<Service[]>([])

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([])

  const [
    offers,
    setOffers,
  ] = useState<Offer[]>([])

  const [
    selectedServices,
    setSelectedServices,
  ] = useState<string[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    offerLoading,
    setOfferLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    sortBy,
    setSortBy,
  ] = useState('recommended')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    sortOpen,
    setSortOpen,
  ] = useState(false)

  const [
    addingService,
    setAddingService,
  ] = useState(false)

  const sortRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const categoryScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const [
    categoryCanScrollLeft,
    setCategoryCanScrollLeft,
  ] = useState(false)

  const [
    categoryCanScrollRight,
    setCategoryCanScrollRight,
  ] = useState(false)

  /* =======================================================
     LOAD SERVICES
  ======================================================= */

  useEffect(() => {
    void loadServices()
  }, [])

  async function loadServices() {
    setLoading(true)
    setError('')

    try {
      const [
        categoryResult,
        serviceResult,
      ] = await Promise.all([
        supabase
          .from('service_categories')
          .select(
            `
              id,
              name,
              slug,
              description,
              image_url
            `,
          )
          .eq('is_active', true)
          .order('name', {
            ascending: true,
          }),

        supabase
          .from('services')
          .select(
            `
              id,
              category_id,
              category,
              name,
              description,
              duration_minutes,
              price,
              image_url
            `,
          )
          .eq('is_active', true)
          .order('created_at', {
            ascending: false,
          }),
      ])

      if (categoryResult.error) {
        throw new Error(
          categoryResult.error.message,
        )
      }

      if (serviceResult.error) {
        throw new Error(
          serviceResult.error.message,
        )
      }

      const categoryRows =
        (categoryResult.data ??
          []) as CategoryRow[]

      const serviceRows =
        (serviceResult.data ??
          []) as ServiceRow[]

      const categoryMap =
        new Map(
          categoryRows.map(
            (row) => [
              row.id,
              row,
            ],
          ),
        )

      setCategories(
        categoryRows.map(
          (row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description:
              row.description,
            image:
              row.image_url ||
              assets.hero,
          }),
        ),
      )

      setServices(
        serviceRows
          .filter((row) => {
            if (!row.category_id) {
              return false
            }

            return categoryMap.has(
              row.category_id,
            )
          })
          .map((row) => {
            const category =
              categoryMap.get(
                row.category_id!,
              )

            return {
              id: row.id,
              categoryId:
                row.category_id!,
              category:
                category?.name ?? '',
              name: row.name,
              description:
                row.description ??
                '',
              duration:
                row.duration_minutes &&
                  row.duration_minutes >
                  0
                  ? `${row.duration_minutes} min`
                  : 'By consultation',
              price:
                Number(
                  row.price,
                ) || 0,
              image:
                row.image_url ||
                assets.hero,
            }
          }),
      )
    } catch (
    loadError
    ) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load services.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     LOAD OFFERS
  ======================================================= */

  useEffect(() => {
    void loadOffers()
  }, [])

  async function loadOffers() {
    setOfferLoading(true)

    try {
      const now =
        new Date().toISOString()

      const [
        offerResult,
        serviceLinksResult,
        categoryLinksResult,
      ] = await Promise.all([
        supabase
          .from('offers')
          .select(
            `
              id,
              title,
              description,
              discount_type,
              discount_value,
              promo_code,
              image_url,
              starts_at,
              ends_at,
              service_id,
              category_id,
              is_active,
              priority,
              scope_type,
              service_group,
              applies_to_all,
              created_at
            `,
          )
          .eq('is_active', true)
          .eq('service_group', 'beauty')
          .lte('starts_at', now)
          .or(
            `ends_at.is.null,ends_at.gte.${now}`,
          )
          .order('priority', {
            ascending: false,
          })
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('offer_services')
          .select(
            `
              offer_id,
              service_id
            `,
          ),

        supabase
          .from('offer_categories')
          .select(
            `
              offer_id,
              category_id
            `,
          ),
      ])

      if (offerResult.error) {
        throw new Error(
          offerResult.error.message,
        )
      }

      if (
        serviceLinksResult.error
      ) {
        throw new Error(
          serviceLinksResult.error.message,
        )
      }

      if (
        categoryLinksResult.error
      ) {
        throw new Error(
          categoryLinksResult.error.message,
        )
      }

      const rows =
        (offerResult.data ??
          []) as OfferRow[]

      const serviceLinks =
        (serviceLinksResult.data ??
          []) as ServiceLinkRow[]

      const categoryLinks =
        (categoryLinksResult.data ??
          []) as CategoryLinkRow[]

      const mappedOffers =
        rows.map(
          (row) => {
            const serviceIds =
              serviceLinks
                .filter(
                  (link) =>
                    link.offer_id ===
                    row.id,
                )
                .map(
                  (link) =>
                    link.service_id,
                )

            const categoryIds =
              categoryLinks
                .filter(
                  (link) =>
                    link.offer_id ===
                    row.id,
                )
                .map(
                  (link) =>
                    link.category_id,
                )

            if (
              row.service_id &&
              !serviceIds.includes(
                row.service_id,
              )
            ) {
              serviceIds.push(
                row.service_id,
              )
            }

            if (
              row.category_id &&
              !categoryIds.includes(
                row.category_id,
              )
            ) {
              categoryIds.push(
                row.category_id,
              )
            }

            return {
              id: row.id,
              title: row.title,
              description:
                row.description ??
                '',
              discountType:
                row.discount_type,
              discountValue:
                Number(
                  row.discount_value,
                ) || 0,
              promoCode:
                row.promo_code,
              imageUrl:
                row.image_url,
              startsAt:
                row.starts_at,
              endsAt:
                row.ends_at,
              priority:
                Number(
                  row.priority ??
                  0,
                ),
              scopeType:
                row.scope_type,
              appliesToAll:
                Boolean(
                  row.applies_to_all,
                ),
              serviceIds: [
                ...new Set(
                  serviceIds,
                ),
              ],
              categoryIds: [
                ...new Set(
                  categoryIds,
                ),
              ],
              createdAt:
                row.created_at,
            }
          },
        )

      mappedOffers.sort(
        (a, b) => {
          const priorityDifference =
            b.priority -
            a.priority

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference
          }

          return (
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime()
          )
        },
      )

      setOffers(
        mappedOffers,
      )
    } catch (
    loadError
    ) {
      console.error(
        'Offers:',
        loadError,
      )

      setOffers([])
    } finally {
      setOfferLoading(false)
    }
  }

  /* =======================================================
     LOAD ASSIGNED SERVICES
  ======================================================= */

  /* =======================================================
   RESTORE SAVED SELECTION
======================================================= */

  useEffect(() => {
    /*
     * ENQUIRY MODE
     *
     * Enquiry data lives in:
     * wildfloral_enquiry_flow
     */
    if (mode === 'enquiry') {
      const enquiry =
        loadEnquiryFlow()

      if (!enquiry) {
        setSelectedServices([])
        return
      }

      const targetPersonId =
        assignTo ??
        enquiry.people[0]?.id

      const person =
        enquiry.people.find(
          (item) =>
            item.id === targetPersonId,
        )

      setSelectedServices(
        person?.serviceIds ?? [],
      )

      return
    }

    /*
     * NORMAL BOOKING MODE
     */
    if (assignTo) {
      const booking =
        loadBookingFlow()

      if (!booking) {
        setSelectedServices([])
        return
      }

      const person =
        booking.people.find(
          (item) =>
            item.id === assignTo,
        )

      setSelectedServices(
        person?.serviceIds ?? [],
      )

      return
    }

    const savedServiceIds =
      getBookingCartServiceIds()

    setSelectedServices(
      savedServiceIds,
    )
  }, [
    assignTo,
    mode,
  ])

  /* =======================================================
     SORT MENU
  ======================================================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        sortRef.current &&
        !sortRef.current.contains(
          event.target as Node,
        )
      ) {
        setSortOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  /* =======================================================
     ACTIVE CATEGORY
  ======================================================= */

  const activeCategory =
    useMemo(() => {
      if (!categoryParam) {
        return null
      }

      return (
        categories.find(
          (category) =>
            category.slug ===
            categoryParam,
        ) ?? null
      )
    }, [
      categories,
      categoryParam,
    ])

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filteredServices =
    useMemo(() => {
      let result =
        activeCategory
          ? services.filter(
            (service) =>
              service.categoryId ===
              activeCategory.id,
          )
          : [...services]

      if (
        sortBy === 'price-low'
      ) {
        result.sort(
          (a, b) => {
            const aPrice =
              calculateDiscount(
                a.price,
                getApplicableOffer(
                  a,
                  offers,
                ),
              ).finalPrice

            const bPrice =
              calculateDiscount(
                b.price,
                getApplicableOffer(
                  b,
                  offers,
                ),
              ).finalPrice

            return (
              aPrice - bPrice
            )
          },
        )
      }

      if (
        sortBy === 'price-high'
      ) {
        result.sort(
          (a, b) => {
            const aPrice =
              calculateDiscount(
                a.price,
                getApplicableOffer(
                  a,
                  offers,
                ),
              ).finalPrice

            const bPrice =
              calculateDiscount(
                b.price,
                getApplicableOffer(
                  b,
                  offers,
                ),
              ).finalPrice

            return (
              bPrice - aPrice
            )
          },
        )
      }

      if (
        sortBy === 'name-az'
      ) {
        result.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
            ),
        )
      }

      if (
        sortBy === 'name-za'
      ) {
        result.sort(
          (a, b) =>
            b.name.localeCompare(
              a.name,
            ),
        )
      }

      return result
    }, [
      services,
      activeCategory,
      sortBy,
      offers,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredServices.length /
        ITEMS_PER_PAGE,
      ),
    )

  useEffect(() => {
    setCurrentPage(
      (current) =>
        Math.min(
          current,
          totalPages,
        ),
    )
  }, [totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    categoryParam,
    sortBy,
  ])

  const paginatedServices =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE

      return filteredServices.slice(
        start,
        start +
        ITEMS_PER_PAGE,
      )
    }, [
      filteredServices,
      currentPage,
    ])

  /* =======================================================
     SELECTION
  ======================================================= */

  const selectedServiceObjects =
    useMemo(
      () =>
        services.filter(
          (service) =>
            selectedServices.includes(
              service.id,
            ),
        ),
      [
        services,
        selectedServices,
      ],
    )

  const selectedTotal =
    selectedServiceObjects.reduce(
      (
        total,
        service,
      ) => {
        const offer =
          getApplicableOffer(
            service,
            offers,
          )

        return (
          total +
          calculateDiscount(
            service.price,
            offer,
          ).finalPrice
        )
      },
      0,
    )

  /* =======================================================
     PROMOTIONS
  ======================================================= */

  const displayedOffers =
    useMemo(
      () =>
        [...offers]
          .sort(
            (a, b) => {
              const priorityDifference =
                b.priority -
                a.priority

              if (
                priorityDifference !==
                0
              ) {
                return priorityDifference
              }

              return (
                new Date(
                  b.createdAt,
                ).getTime() -
                new Date(
                  a.createdAt,
                ).getTime()
              )
            },
          )
          .slice(0, 2),
      [offers],
    )

  /* =======================================================
     CATEGORY SCROLL
  ======================================================= */

  function updateCategoryScrollState() {
    const element =
      categoryScrollRef.current

    if (!element) {
      return
    }

    const maxScroll =
      element.scrollWidth -
      element.clientWidth

    setCategoryCanScrollLeft(
      element.scrollLeft > 4,
    )

    setCategoryCanScrollRight(
      element.scrollLeft <
      maxScroll - 4,
    )
  }

  function scrollCategories(
    direction:
      | 'left'
      | 'right',
  ) {
    const element =
      categoryScrollRef.current

    if (!element) {
      return
    }

    const amount =
      Math.max(
        element.clientWidth *
        0.72,
        260,
      )

    element.scrollBy({
      left:
        direction === 'right'
          ? amount
          : -amount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    updateCategoryScrollState()

    const element =
      categoryScrollRef.current

    if (!element) {
      return
    }

    const handleScroll =
      () =>
        updateCategoryScrollState()

    window.addEventListener(
      'resize',
      updateCategoryScrollState,
    )

    element.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateCategoryScrollState,
      )

      element.removeEventListener(
        'scroll',
        handleScroll,
      )
    }
  }, [
    categories,
    loading,
  ])

  /* =======================================================
     CATEGORY ACTIONS
  ======================================================= */

  function selectAllServices() {
    const params =
      new URLSearchParams()

    if (assignTo) {
      params.set(
        'assignTo',
        assignTo,
      )
    }

    if (modeParam) {
      params.set(
        'mode',
        mode,
      )
    }

    setSearchParams(params)
    setCurrentPage(1)

    window.setTimeout(() => {
      document
        .getElementById(
          'service-list',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 0)
  }

  function selectCategory(
    category: Category,
  ) {
    const params =
      new URLSearchParams()

    params.set(
      'category',
      category.slug,
    )

    if (assignTo) {
      params.set(
        'assignTo',
        assignTo,
      )
    }

    if (modeParam) {
      params.set(
        'mode',
        mode,
      )
    }

    setSearchParams(params)
    setCurrentPage(1)

    window.setTimeout(() => {
      document
        .getElementById(
          'service-list',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 0)
  }

  /* =======================================================
     SERVICE ACTIONS
  ======================================================= */

  function isServiceSelected(
    serviceId: string,
  ) {
    return selectedServices.includes(
      serviceId,
    )
  }

  function saveServicePrice(
    serviceId: string,
  ) {
    const service =
      services.find(
        (item) =>
          item.id === serviceId,
      )

    if (!service) {
      return
    }

    const booking =
      loadBookingFlow()

    const offer =
      getApplicableOffer(
        service,
        offers,
      )

    const pricing =
      calculateDiscount(
        service.price,
        offer,
      )

    const currentPrices =
      booking?.servicePrices ??
      {}

    setServicePrices({
      ...currentPrices,
      [serviceId]:
        pricing.finalPrice,
    })
  }

  function toggleService(
    serviceId: string,
  ) {
    setError('')

    /*
   * =====================================================
   * ADMIN OP CUSTOMER
   * =====================================================
   *
   * OP customers use a completely separate temporary
   * flow. This branch executes before enquiry and normal
   * booking logic.
   */

    if (isOPCustomer) {
      const opFlow =
        loadOPFlow()

      if (!opFlow) {
        setError(
          'OP customer session has expired. Please return to OP Customers.',
        )

        return
      }

      const targetPersonId =
        opFlow.selectedPersonId

      if (!targetPersonId) {
        setError(
          'Please select a person before choosing services.',
        )

        return
      }

      toggleOPService(
        targetPersonId,
        serviceId,
      )

      const updatedFlow =
        loadOPFlow()

      setSelectedServices(
        updatedFlow?.people.find(
          (person) =>
            person.id ===
            targetPersonId,
        )?.serviceIds ?? [],
      )

      return
    }

    /*
     * =====================================================
     * ENQUIRY SERVICE ASSIGNMENT
     * =====================================================
     */
    if (mode === 'enquiry') {
      const enquiry =
        loadEnquiryFlow()

      if (!enquiry) {
        setError(
          'Your enquiry session has expired. Please return to the enquiry.',
        )

        return
      }

      const targetPersonId =
        assignTo ??
        enquiry.people[0]?.id

      if (!targetPersonId) {
        setError(
          'No enquiry person is available.',
        )

        return
      }

      const person =
        enquiry.people.find(
          (item) =>
            item.id === targetPersonId,
        )

      if (!person) {
        setError(
          'The selected enquiry person could not be found.',
        )

        return
      }

      const currentIds =
        currentServiceIds(
          person.serviceIds ?? [],
        )

      const isSelected =
        currentIds.includes(
          serviceId,
        )

      const nextIds =
        isSelected
          ? currentIds.filter(
            (id) =>
              id !== serviceId,
          )
          : [
            ...currentIds,
            serviceId,
          ]

      const nextEnquiry: BookingFlowState = {
        ...enquiry,
        mode: 'enquiry',
        people:
          enquiry.people.map(
            (item) =>
              item.id === targetPersonId
                ? {
                  ...item,
                  serviceIds: nextIds,
                }
                : item,
          ),
      }

      saveEnquiryFlow(
        nextEnquiry,
      )

      setSelectedServices(
        nextIds,
      )

      return
    }

    /*
     * =====================================================
     * NORMAL BOOKING PERSON ASSIGNMENT
     * =====================================================
     */
    if (assignTo) {
      const booking =
        loadBookingFlow()

      if (!booking) {
        setError(
          'Your booking session has expired. Please return to your booking.',
        )

        return
      }

      const targetPersonId =
        assignTo ??
        booking.people[0]?.id

      if (!targetPersonId) {
        setError(
          'No person is available for service selection.',
        )

        return
      }

      const person =
        booking.people.find(
          (item) =>
            item.id ===
            targetPersonId,
        )

      if (!person) {
        setError(
          'The selected booking person could not be found.',
        )

        return
      }

      const currentIds =
        currentServiceIds(
          person.serviceIds ?? [],
        )

      const isSelected =
        currentIds.includes(
          serviceId,
        )

      const nextIds =
        isSelected
          ? currentIds.filter(
            (id) =>
              id !== serviceId,
          )
          : [
            ...currentIds,
            serviceId,
          ]

      const nextPeople =
        booking.people.map(
          (item) =>
            item.id ===
              targetPersonId
              ? {
                ...item,
                serviceIds:
                  nextIds,
              }
              : item,
        )

      const nextBooking: BookingFlowState = {
        ...booking,

        mode: 'booking',

        people:
          nextPeople,
      }

      saveBookingFlow(
        nextBooking,
      )

      setSelectedServices(
        nextIds,
      )

      /*
       * Recalculate price for the newly selected
       * service without touching bookingCart.
       */
      if (!isSelected) {
        saveServicePrice(
          serviceId,
        )
      } else {
        const currentPrices =
          nextBooking.servicePrices ??
          {}

        const {
          [serviceId]:
          _removedPrice,
          ...remainingPrices
        } = currentPrices

        setServicePrices(
          remainingPrices,
        )

        saveBookingFlow({
          ...nextBooking,
          servicePrices:
            remainingPrices,
        })
      }

      return
    }

    /*
     * =====================================================
     * NORMAL PUBLIC BOOKING SELECTION
     * =====================================================
     *
     * ONLY normal /services selection uses bookingCart.
     */

    const selectedCurrentServiceIds =
      currentServiceIds(
        getBookingCartServiceIds(),
      )

    const isSelected =
      selectedCurrentServiceIds.includes(
        serviceId,
      )

    if (isSelected) {
      removeFromBookingCart(
        serviceId,
      )

      const booking =
        loadBookingFlow()

      if (booking) {
        const nextPeople =
          booking.people.map(
            (person) =>
              person.id ===
                booking.people[0]?.id
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
          )

        const currentPrices =
          booking.servicePrices ??
          {}

        const {
          [serviceId]:
          _removedPrice,
          ...remainingPrices
        } = currentPrices

        saveBookingFlow({
          ...booking,
          mode: 'booking',
          people:
            nextPeople,
          servicePrices:
            remainingPrices,
        })

        setServicePrices(
          remainingPrices,
        )
      }

      setSelectedServices(
        selectedCurrentServiceIds.filter(
          (id) =>
            id !== serviceId,
        ),
      )

      return
    }

    /*
     * Add new service.
     */

    addToBookingCart(
      serviceId,
    )

    saveServicePrice(
      serviceId,
    )

    setSelectedServices([
      ...selectedCurrentServiceIds,
      serviceId,
    ])
  }
  function clearSelection() {
    /*
     * =====================================================
     * ENQUIRY
     * =====================================================
     */

    if (mode === 'enquiry') {
      const enquiry =
        loadEnquiryFlow()

      if (!enquiry) {
        setSelectedServices([])
        return
      }

      const targetPersonId =
        assignTo ??
        enquiry.people[0]?.id

      const nextEnquiry: BookingFlowState = {
        ...enquiry,
        mode: 'enquiry',
        people:
          enquiry.people.map(
            (person) =>
              person.id === targetPersonId
                ? {
                  ...person,
                  serviceIds: [],
                }
                : person,
          ),
      }

      saveEnquiryFlow(
        nextEnquiry,
      )

      setSelectedServices([])

      return
    }

    /*
     * =====================================================
     * NORMAL BOOKING PERSON ASSIGNMENT
     * =====================================================
     */
    if (assignTo) {
      const booking =
        loadBookingFlow()

      if (!booking) {
        setSelectedServices([])
        setServicePrices({})
        return
      }

      const targetPersonId =
        assignTo ??
        booking.people[0]?.id

      const nextPeople =
        booking.people.map(
          (person) =>
            person.id ===
              targetPersonId
              ? {
                ...person,
                serviceIds: [],
              }
              : person,
        )

      const nextBooking: BookingFlowState = {
        ...booking,
        mode: 'booking',

        people:
          nextPeople,

        servicePrices: {},
      }

      saveBookingFlow(
        nextBooking,
      )

      setSelectedServices([])

      setServicePrices({})

      return
    }

    /*
     * =====================================================
     * NORMAL BOOKING
     * =====================================================
     *
     * Clear BOTH the public cart and Person 1's
     * bookingFlow services.
     *
     * This prevents the old services from coming back
     * when the user returns to /services.
     */

    clearBookingCart()

    const booking =
      loadBookingFlow()

    if (booking) {
      const nextBooking: BookingFlowState = {
        ...booking,

        mode: 'booking',

        people:
          booking.people.map(
            (person, index) =>
              index === 0
                ? {
                  ...person,
                  serviceIds: [],
                }
                : person,
          ),

        servicePrices: {},
      }

      saveBookingFlow(
        nextBooking,
      )
    }

    setSelectedServices([])

    setServicePrices({})
  }


  async function continueAssignment() {

    /*
   * =====================================================
   * ADMIN OP CUSTOMER
   * =====================================================
   */

    if (isOPCustomer) {
      const opFlow =
        loadOPFlow()

      if (!opFlow) {
        setError(
          'OP customer session has expired.',
        )

        return
      }

      const person =
        opFlow.people.find(
          (item) =>
            item.id ===
            opFlow.selectedPersonId,
        )

      if (!person) {
        setError(
          'Please select a person.',
        )

        return
      }

      if (
        person.serviceIds.length ===
        0
      ) {
        setError(
          'Please select at least one service for this person.',
        )

        return
      }

      navigate(
        '/admin/op-customers/beauty',
      )

      return
    }
    /*
     * =====================================================
     * ENQUIRY
     * =====================================================
     */
    if (mode === 'enquiry') {
      if (selectedServices.length === 0) {
        setError(
          assignTo
            ? 'Please select at least one service for this person.'
            : 'Please select at least one service.',
        )

        return
      }

      navigate('/enquiry')

      return
    }

    /*
     * =====================================================
     * NORMAL BOOKING
     * =====================================================
     */
    if (!assignTo) {
      if (selectedServices.length === 0) {
        setError(
          'Please select at least one service.',
        )

        return
      }

      saveSelectedServices(
        selectedServices,
      )

      setBookingMode('booking')
      setBookingStep(1)

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate(
          `/login?redirect=${encodeURIComponent(
            '/booking',
          )}`,
          {
            replace: true,
          },
        )

        return
      }

      navigate('/booking')

      return
    }

    if (selectedServices.length === 0) {
      setError(
        'Please select at least one service for this person.',
      )

      return
    }

    navigate('/booking')
  }
  function goToPage(
    page: number,
  ) {
    const nextPage =
      Math.max(
        1,
        Math.min(
          page,
          totalPages,
        ),
      )

    setCurrentPage(
      nextPage,
    )

    document
      .getElementById(
        'service-list',
      )
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="services-page">

      {/* =================================================
          ASSIGNMENT HEADER
      ================================================= */}

      {assignTo && (
        <section className="services-assignment-banner">

          <div>
            <span>
              {mode === 'enquiry'
                ? 'ENQUIRY'
                : 'BOOKING'}{' '}
              · SERVICE ASSIGNMENT
            </span>

            <h2>
              Choose services
              for this person
            </h2>

            <p>
              Services selected
              here will be added
              only to this person's
              booking card.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/booking')
            }
          >
            <BackIcon />
            Back to Booking
          </button>

        </section>
      )}

      {/* =================================================
          HERO
      ================================================= */}

      <section className="services-hero">

        <div className="services-hero-content">

          <span className="services-hero-label">
            WILDFLORAL BEAUTY
          </span>

          <h1>
            Beauty that feels
            <span>
              uniquely yours.
            </span>
          </h1>

          <p>
            Premium beauty care
            and styling created
            around your look,
            occasion, and personal
            style.
          </p>

          <div className="services-hero-actions">

            <button
              type="button"
              className="services-primary-button"
              onClick={() => {
                if (assignTo) {
                  navigate('/booking')
                  return
                }

                void continueAssignment()
              }}
            >
              {assignTo
                ? 'Back to Booking'
                : 'Book Appointment'}

              <ArrowIcon />
            </button>
            <a
              href="#our-services"
              className="services-secondary-button"
            >
              Explore Services
            </a>

          </div>

        </div>

        <div className="services-hero-image">

          <img
            src={assets.hero}
            alt="Beauty and fashion styling"
          />

        </div>

      </section>

      {/* =================================================
          CATEGORY SECTION
      ================================================= */}

      <section
        className="services-category-section"
        id="our-services"
      >

        {/* CENTERED HEADING */}

        <div className="services-category-heading">

          <div>

            <span>
              EXPLORE
            </span>

            <h2>
              Find your perfect
              <em>
                beauty service.
              </em>
            </h2>

            <p>
              Browse our professional
              beauty services by category.
            </p>

          </div>

        </div>

        {/* =================================================
            CATEGORY CAROUSEL
        ================================================= */}

        <div className="services-category-slider">

          {/* LEFT ARROW */}

          <button
            type="button"
            className="category-scroll-button category-scroll-button-left"
            disabled={
              !categoryCanScrollLeft
            }
            onClick={() =>
              scrollCategories('left')
            }
            aria-label="Previous categories"
          >
            ←
          </button>

          {/* CATEGORY LIST */}

          <div
            className="services-category-list"
            ref={
              categoryScrollRef
            }
          >

            {/* ALL SERVICES */}

            <button
              type="button"
              className={
                !activeCategory
                  ? 'service-category-card active'
                  : 'service-category-card'
              }
              onClick={
                selectAllServices
              }
            >

              <div className="service-category-image">

                <img
                  src={assets.hero}
                  alt=""
                />

              </div>

              <div>

                <span>
                  ALL SERVICES
                </span>

                <strong>
                  All Beauty
                </strong>

              </div>

            </button>

            {/* DATABASE CATEGORIES */}

            {categories.map(
              (category) => (
                <button
                  type="button"
                  key={category.id}
                  className={
                    activeCategory?.id ===
                      category.id
                      ? 'service-category-card active'
                      : 'service-category-card'
                  }
                  onClick={() =>
                    selectCategory(
                      category,
                    )
                  }
                >

                  <div className="service-category-image">

                    <img
                      src={
                        category.image ||
                        assets.hero
                      }
                      alt=""
                      loading="lazy"
                    />

                  </div>

                  <div>

                    <span>
                      CATEGORY
                    </span>

                    <strong>
                      {
                        category.name
                      }
                    </strong>

                  </div>

                </button>
              ),
            )}

          </div>

          {/* RIGHT ARROW */}

          <button
            type="button"
            className="category-scroll-button category-scroll-button-right"
            disabled={
              !categoryCanScrollRight
            }
            onClick={() =>
              scrollCategories('right')
            }
            aria-label="Next categories"
          >
            →
          </button>

        </div>

      </section>

      {/* =================================================
          SERVICE LIST
      ================================================= */}

      <section
        className="services-list-section"
        id="service-list"
      >

        <div className="services-list-heading">

          <div>

            <span>
              {activeCategory
                ? activeCategory.name
                : 'ALL BEAUTY SERVICES'}
            </span>

            <h2>
              {activeCategory
                ? `${activeCategory.name} services`
                : 'Our signature services'}
            </h2>

            <p>
              {filteredServices.length}{' '}
              {filteredServices.length ===
                1
                ? 'service'
                : 'services'}{' '}
              available
              {categories.length >
                0 &&
                ` across ${categories.length} categories`}
            </p>

          </div>

          <div
            className="services-sort-wrapper"
            ref={sortRef}
          >

            <button
              type="button"
              className="services-sort-button"
              onClick={() =>
                setSortOpen(
                  (current) =>
                    !current,
                )
              }
              aria-expanded={
                sortOpen
              }
            >

              <span>
                Sort by
              </span>

              <strong>
                {
                  SORT_OPTIONS.find(
                    (option) =>
                      option.value ===
                      sortBy,
                  )?.label
                }
              </strong>

              <span
                className={
                  sortOpen
                    ? 'sort-chevron open'
                    : 'sort-chevron'
                }
              >
                ↓
              </span>

            </button>

            {sortOpen && (
              <div className="services-sort-menu">

                {SORT_OPTIONS.map(
                  (option) => (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      className={
                        sortBy ===
                          option.value
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setSortBy(
                          option.value,
                        )

                        setSortOpen(
                          false,
                        )
                      }}
                    >

                      <span>
                        {
                          option.label
                        }
                      </span>

                      {sortBy ===
                        option.value && (
                          <span>
                            ✓
                          </span>
                        )}

                    </button>
                  ),
                )}

              </div>
            )}

          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="services-grid">

            {Array.from({
              length:
                ITEMS_PER_PAGE,
            }).map(
              (_, index) => (
                <div
                  className="service-skeleton"
                  key={index}
                >

                  <div className="service-skeleton-image" />

                  <div className="service-skeleton-content">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                </div>
              ),
            )}

          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="services-message">

              <h3>
                Something went
                <span>
                  wrong.
                </span>
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="services-primary-button"
                onClick={() => {
                  void loadServices()
                  void loadOffers()
                }}
              >
                Try Again
                <ArrowIcon />
              </button>

            </div>
          )}

        {/* SERVICES */}

        {!loading &&
          !error &&
          paginatedServices.length >
          0 && (

            <div className="services-grid">

              {paginatedServices.map(
                (
                  service,
                  index,
                ) => {

                  const isSelected =
                    isServiceSelected(
                      service.id,
                    )

                  const offer =
                    getApplicableOffer(
                      service,
                      offers,
                    )

                  const pricing =
                    calculateDiscount(
                      service.price,
                      offer,
                    )

                  const hasDiscount =
                    Boolean(
                      offer &&
                      pricing.discountAmount >
                      0,
                    )

                  return (
                    <article
                      className={
                        isSelected
                          ? 'service-card selected'
                          : 'service-card'
                      }
                      key={
                        service.id
                      }
                    >

                      <div className="service-card-image">

                        <img
                          src={
                            service.image ||
                            assets.hero
                          }
                          alt={
                            service.name
                          }
                          loading={
                            index < 3
                              ? 'eager'
                              : 'lazy'
                          }
                        />

                        <span className="service-card-category-pill">
                          {
                            service.category
                          }
                        </span>

                        {hasDiscount &&
                          offer && (
                            <span className="service-card-offer-pill">
                              {
                                discountText(
                                  offer,
                                )
                              }
                            </span>
                          )}

                        <button
                          type="button"
                          className={
                            isSelected
                              ? 'service-card-select selected'
                              : 'service-card-select'
                          }
                          onClick={() =>
                            toggleService(
                              service.id,
                            )
                          }
                          aria-label={
                            isSelected
                              ? `Remove ${service.name}`
                              : `Add ${service.name}`
                          }
                        >
                          {isSelected
                            ? '✓'
                            : '+'}
                        </button>

                      </div>

                      <div className="service-card-content">

                        <h3>
                          {
                            service.name
                          }
                        </h3>

                        <p>
                          {
                            service.description
                          }
                        </p>

                        <div className="service-card-meta">

                          <div className="service-price">

                            {hasDiscount &&
                              offer ? (
                              <>
                                <span>
                                  Regular price
                                </span>

                                <del>
                                  {formatPrice(
                                    pricing.originalPrice,
                                  )}
                                </del>

                                <strong className="service-offer-price">
                                  {formatPrice(
                                    pricing.finalPrice,
                                  )}
                                </strong>

                                <small>
                                  You save{' '}
                                  {formatPrice(
                                    pricing.discountAmount,
                                  )}
                                </small>
                              </>
                            ) : (
                              <>
                                <span>
                                  Regular price
                                </span>

                                <strong>
                                  {formatPrice(
                                    service.price,
                                  )}
                                </strong>
                              </>
                            )}

                          </div>

                          <div className="service-duration">

                            <ClockIcon />

                            <span>
                              {
                                service.duration
                              }
                            </span>

                          </div>

                        </div>

                        {hasDiscount &&
                          offer && (
                            <div className="service-card-current-offer">

                              <div>

                                <span>
                                  CURRENT OFFER
                                </span>

                                <strong>
                                  {
                                    offer.title
                                  }
                                </strong>

                              </div>

                              {offer.endsAt && (
                                <small>
                                  Ends{' '}
                                  {formatOfferDate(
                                    offer.endsAt,
                                  )}
                                </small>
                              )}

                            </div>
                          )}

                        <button
                          type="button"
                          className={
                            isSelected
                              ? 'service-book-button selected'
                              : 'service-book-button'
                          }
                          disabled={
                            addingService
                          }
                          onClick={() => {
                            if (
                              addingService
                            ) {
                              return
                            }

                            if (
                              assignTo
                            ) {
                              setAddingService(
                                true,
                              )

                              toggleService(
                                service.id,
                              )

                              window.setTimeout(
                                () =>
                                  setAddingService(
                                    false,
                                  ),
                                200,
                              )

                              return
                            }

                            toggleService(
                              service.id,
                            )
                          }}
                        >

                          <span>
                            {isSelected
                              ? assignTo
                                ? 'Remove from Person'
                                : 'Remove from Booking'
                              : assignTo
                                ? 'Add to Person'
                                : 'Add to Booking'}
                          </span>

                          <span>
                            {isSelected
                              ? '✓'
                              : '+'}
                          </span>

                        </button>

                      </div>

                    </article>
                  )
                },
              )}

            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          paginatedServices.length ===
          0 && (
            <div className="services-message">

              <h3>
                No services
                <span>
                  available.
                </span>
              </h3>

              <p>
                There are no services
                available in this category
                yet.
              </p>

              {activeCategory && (
                <button
                  type="button"
                  className="services-primary-button"
                  onClick={
                    selectAllServices
                  }
                >
                  View All Services
                  <ArrowIcon />
                </button>
              )}

            </div>
          )}

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="services-pagination">

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                goToPage(
                  currentPage - 1,
                )
              }
            >
              ←
            </button>

            {Array.from({
              length: totalPages,
            }).map(
              (_, index) => {
                const page =
                  index + 1

                return (
                  <button
                    type="button"
                    key={page}
                    className={
                      currentPage ===
                        page
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      goToPage(
                        page,
                      )
                    }
                  >
                    {page}
                  </button>
                )
              },
            )}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                goToPage(
                  currentPage + 1,
                )
              }
            >
              →
            </button>

          </div>
        )}

      </section>

      {/* =================================================
          PROMOTIONS
      ================================================= */}

      {!offerLoading &&
        displayedOffers.length >
        0 && (
          <section className="services-promo">

            {displayedOffers.map(
              (
                offer,
                index,
              ) => (
                <DealOfDay
                  key={
                    offer.id
                  }
                  offer={
                    offer
                  }
                  featured={
                    index === 0
                  }
                />
              ),
            )}

          </section>
        )}

      {/* =================================================
          SELECTION BAR
      ================================================= */}

      {selectedServices.length >
        0 && (
          <div className="service-selection-bar">

            <div className="service-selection-inner">

              <div className="selection-summary">

                <div className="selection-count">
                  {
                    selectedServices.length
                  }
                </div>

                <div>
                  <strong>
                    {isOPCustomer
                      ? 'Services for person'
                      : assignTo
                        ? 'Services for person'
                        : 'Services selected'}
                  </strong>
                  <span>
                    Total{' '}
                    {formatPrice(
                      selectedTotal,
                    )}
                  </span>
                </div>

              </div>

              <div className="selection-actions">

                <button
                  type="button"
                  className="selection-clear"
                  onClick={
                    clearSelection
                  }
                >
                  Clear
                </button>

                {isOPCustomer ? (
                  <button
                    type="button"
                    className="selection-book"
                    onClick={continueAssignment}
                  >
                    Done
                    <ArrowIcon />
                  </button>
                ) : assignTo ? (
                  <button
                    type="button"
                    className="selection-book"
                    onClick={
                      continueAssignment
                    }
                  >
                    Done
                    <ArrowIcon />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="selection-enquiry"
                      onClick={() =>
                        navigate(
                          `/enquiry?services=${encodeURIComponent(
                            selectedServices.join(','),
                          )}`,
                        )
                      }
                    >
                      Enquire Now
                    </button>

                    <button
                      type="button"
                      className="selection-book"
                      onClick={
                        continueAssignment
                      }
                    >
                      Book Appointment
                      <ArrowIcon />
                    </button>
                  </>
                )}

              </div>

            </div>

          </div>
        )}

      {/* =================================================
          ASSIGNMENT FOOTER
      ================================================= */}

      {assignTo &&
        selectedServices.length >
        0 && (
          <div className="services-assignment-footer">

            <div>

              <span>
                READY
              </span>

              <strong>
                {
                  selectedServices.length
                }{' '}
                service
                {selectedServices.length ===
                  1
                  ? ''
                  : 's'}{' '}
                selected for this person
              </strong>

            </div>

            <button
              type="button"
              onClick={
                continueAssignment
              }
            >
              Continue to Booking
              <ArrowIcon />
            </button>

          </div>
        )}

      {/* =================================================
          FINAL CTA
      ================================================= */}

      {!assignTo && (
        <section className="services-final">

          <span>
            WILDFLORAL BEAUTY
          </span>

          <h2>
            Your best look
            <em>
              starts here.
            </em>
          </h2>

          <button
            type="button"
            className="services-final-button"
            onClick={() => {
              void continueAssignment()
            }}
          >
            Book Appointment
            <ArrowIcon />
          </button>
        </section>
      )}

      {/* =================================================
    FASHION STATS
================================================= */}

      <section className="fashion-stats-strip">
        <div className="fashion-stats-container">

          {/* HAPPY CLIENTS */}
          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="16" r="6" />
                <circle cx="10" cy="20" r="5" />
                <circle cx="38" cy="20" r="5" />

                <path d="M13 37c0-7 5-11 11-11s11 4 11 11" />
                <path d="M3 36c0-5 3-8 8-8" />
                <path d="M45 36c0-5-3-8-8-8" />
              </svg>
            </div>

            <div className="fashion-stat-content">
              <strong>20+</strong>
              <span>Happy Clients</span>
            </div>
          </div>

          <div className="fashion-stat-divider" />

          {/* PROJECTS COMPLETED */}
          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <rect
                  x="9"
                  y="8"
                  width="30"
                  height="34"
                  rx="3"
                />

                <path d="M16 5v7" />
                <path d="M32 5v7" />

                <path d="M15 19h18" />
                <path d="M15 26h11" />
                <path d="M15 33h7" />

                <path d="M31 27l3 3 6-7" />
              </svg>
            </div>

            <div className="fashion-stat-content">
              <strong>50+</strong>
              <span>Projects Completed</span>
            </div>
          </div>

          <div className="fashion-stat-divider" />

          {/* CLIENT SATISFACTION */}
          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                />

                <path d="M16 24l5 5 11-11" />
              </svg>
            </div>

            <div className="fashion-stat-content">
              <strong>100%</strong>
              <span>Client Satisfaction</span>
            </div>
          </div>

          <div className="fashion-stat-divider" />

          {/* EXPERIENCE */}
          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle
                  cx="24"
                  cy="20"
                  r="13"
                />

                <path d="M18 31l-3 12 9-5 9 5-3-12" />

                <path d="M24 12l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.4-4.4 2.4.8-5-3.6-3.5 5-.7z" />
              </svg>
            </div>

            <div className="fashion-stat-content">
              <strong>2+</strong>
              <span>Years Experience</span>
            </div>
          </div>

        </div>
      </section>

    </main>
  )
}

/* =========================================================
   DEAL OF THE DAY
========================================================= */

function DealOfDay({
  offer,
  featured,
}: {
  offer: Offer
  featured: boolean
}) {
  const [
    remaining,
    setRemaining,
  ] = useState(
    getRemaining(
      offer.endsAt,
    ),
  )

  useEffect(() => {
    if (!offer.endsAt) {
      return
    }

    const timer =
      window.setInterval(
        () => {
          setRemaining(
            getRemaining(
              offer.endsAt,
            ),
          )
        },
        1000,
      )

    return () =>
      window.clearInterval(
        timer,
      )
  }, [
    offer.endsAt,
  ])

  return (
    <article
      className={
        featured
          ? 'services-promo-card services-promo-exclusive'
          : 'services-promo-card services-promo-deal'
      }
    >

      <div className="services-promo-copy">

        <span className="services-promo-label">
          {featured
            ? 'EXCLUSIVE OFFER'
            : 'DEAL OF THE DAY'}
        </span>

        <h2>
          {
            offer.title
          }
        </h2>

        <strong className="services-promo-discount">
          {
            discountText(
              offer,
            )
          }
        </strong>

        {offer.description && (
          <p>
            {
              offer.description
            }
          </p>
        )}

        {offer.promoCode && (
          <div className="services-promo-code">

            <span>
              USE CODE
            </span>

            <strong>
              {
                offer.promoCode
              }
            </strong>

          </div>
        )}

        {remaining && (
          <div className="promo-countdown">

            {remaining.days >
              0 && (
                <div>
                  <strong>
                    {String(
                      remaining.days,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </strong>

                  <span>
                    DAYS
                  </span>
                </div>
              )}

            <div>
              <strong>
                {String(
                  remaining.hours,
                ).padStart(
                  2,
                  '0',
                )}
              </strong>

              <span>
                HRS
              </span>
            </div>

            <div>
              <strong>
                {String(
                  remaining.minutes,
                ).padStart(
                  2,
                  '0',
                )}
              </strong>

              <span>
                MINS
              </span>
            </div>

            <div>
              <strong>
                {String(
                  remaining.seconds,
                ).padStart(
                  2,
                  '0',
                )}
              </strong>

              <span>
                SECS
              </span>
            </div>

          </div>
        )}

        {offer.endsAt && (
          <div className="services-promo-validity">
            Valid until{' '}
            {formatOfferDate(
              offer.endsAt,
            )}
          </div>
        )}

        <Link
          to="/booking"
          className="services-promo-button"
        >
          Book Now
          <ArrowIcon />
        </Link>

      </div>

      <div className="services-promo-art">

        {offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="promo-gift">
            <span>
              W
            </span>
          </div>
        )}

      </div>

    </article>
  )
}

/* =========================================================
   COUNTDOWN
========================================================= */

function getRemaining(
  endsAt: string | null,
) {
  if (!endsAt) {
    return null
  }

  const difference =
    new Date(
      endsAt,
    ).getTime() -
    Date.now()

  if (difference <= 0) {
    return null
  }

  const totalSeconds =
    Math.floor(
      difference / 1000,
    )

  return {
    days: Math.floor(
      totalSeconds /
      86400,
    ),

    hours: Math.floor(
      (totalSeconds %
        86400) /
      3600,
    ),

    minutes: Math.floor(
      (totalSeconds %
        3600) /
      60,
    ),

    seconds:
      totalSeconds % 60,
  }
}



export default Services