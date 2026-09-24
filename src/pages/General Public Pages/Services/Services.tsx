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
      width="16"
      height="16"
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

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M14.5 5l-7 7 7 7' : 'M9.5 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      width="16"
      height="16"
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
      width="15"
      height="15"
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



function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 12.5l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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

  /* =======================================================
     HERO SLIDESHOW SLIDER (FASHION HERITAGE STYLE)
  ======================================================= */
  const heroSlides = useMemo(() => {
    const list = [
      {
        id: 'sanctuary-main',
        title: 'Royal Lavender & Amethyst Soak',
        category: 'FEATURED TREATMENT',
        duration: '60 mins',
        price: 2800,
        oldPrice: 3800,
        image: assets.hero,
      },
    ]

    services.forEach((service) => {
      if (list.length >= 6) return
      if (service.image) {
        list.push({
          id: service.id,
          title: service.name,
          category: service.category ? service.category.toUpperCase() : 'LAVENDER SERVICE',
          duration: service.duration,
          price: service.price,
          oldPrice: Math.round(service.price * 1.25),
          image: service.image,
        })
      }
    })

    return list
  }, [services])

  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)

  const heroSlideCount = heroSlides.length
  const activeHeroIndex = Math.min(heroSlideIndex, heroSlideCount - 1)
  const activeHeroSlide = heroSlides[activeHeroIndex] ?? heroSlides[0]

  useEffect(() => {
    if (heroSlideCount < 2 || heroPaused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setTimeout(() => {
      setHeroSlideIndex((current) => (current + 1) % heroSlideCount)
    }, 5600)

    return () => window.clearTimeout(timer)
  }, [heroSlideCount, heroPaused, activeHeroIndex])

  function moveHeroSlide(direction: number) {
    setHeroSlideIndex((current) => (current + direction + heroSlideCount) % heroSlideCount)
  }

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
      if (selectedServices.length > 0) {
        saveSelectedServices(
          selectedServices,
        )
      }

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
          ASSIGNMENT HEADER BANNER
      ================================================= */}

      {assignTo && (
        <section className="services-assignment-banner">
          <div>
            <span>
              {mode === 'enquiry' ? 'ENQUIRY' : 'BOOKING'} · SERVICE ASSIGNMENT
            </span>
            <h2>Choose services for this person</h2>
            <p>
              Services selected here will be added only to this person's booking card.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/booking')}
          >
            <BackIcon />
            Back to Booking
          </button>
        </section>
      )}

      {/* =================================================
          1. HERO SECTION (LAVENDER SANCTUARY EDITORIAL)
      ================================================= */}

      <section className="services-hero">
        <div className="services-hero-bg-glow glow-1" />
        <div className="services-hero-bg-glow glow-2" />

        <div className="services-hero-container">
          <div className="services-hero-content">
            <div className="services-hero-badge">
              <span>✦</span>
              <span>WILDFLORAL VIOLET SANCTUARY &amp; SPA</span>
            </div>

            <h1>
              Awaken Your Senses in{' '}
              <span>Lavender Radiance.</span>
            </h1>

            <p>
              Immerse in bespoke restorative services crafted around aromatic French lavender, royal purple orchid soaks, amethyst crystal bodywork, and restorative botanical tranquility.
            </p>


            {/* HERO ACTION BUTTONS */}
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
                <span>{assignTo ? 'Back to Booking' : 'Book Appointment'} ✦</span>
              </button>

              <a href="#services" className="services-secondary-button">
                Explore Services
              </a>
            </div>

            {/* TRUST STRIP POINTS */}
            <ul className="services-hero-points">
              <li>
                <span className="hero-point-icon"><CheckIcon /></span>
                Licensed Master Therapists
              </li>
              <li>
                <span className="hero-point-icon"><CheckIcon /></span>
                100% Lavender &amp; Botanical Oils
              </li>
              <li>
                <span className="hero-point-icon"><CheckIcon /></span>
                Instant Bespoke Concierge
              </li>
            </ul>
          </div>

          {/* RIGHT ARCHED SHOWCASE SLIDER & FLOATING SPOTLIGHT CARD (FASHION HERITAGE EDITORIAL) */}
          <div
            className="services-hero-stage"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
            onFocus={() => setHeroPaused(true)}
            onBlur={() => setHeroPaused(false)}
          >
            <div className="services-hero-frame">
              {heroSlides.map((slide, slideIndex) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.title}
                  className={slideIndex === activeHeroIndex ? 'active' : ''}
                  loading={slideIndex === 0 ? 'eager' : 'lazy'}
                  aria-hidden={slideIndex !== activeHeroIndex}
                  draggable={false}
                />
              ))}

              {heroSlideCount > 1 && (
                <div className="services-hero-controls">
                  <button
                    type="button"
                    className="services-hero-arrow"
                    onClick={() => moveHeroSlide(-1)}
                    aria-label="Previous slide"
                  >
                    <ChevronIcon direction="left" />
                  </button>

                  <div className="services-hero-progress">
                    {heroSlides.map((slide, slideIndex) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={slideIndex === activeHeroIndex ? 'active' : ''}
                        onClick={() => setHeroSlideIndex(slideIndex)}
                        aria-label={`Show slide ${slideIndex + 1} of ${heroSlideCount}`}
                      >
                        {slideIndex === activeHeroIndex && (
                          <span
                            key={`${slide.id}-${heroPaused ? 'paused' : 'running'}`}
                            className={`services-hero-fill ${heroPaused ? 'paused' : ''}`}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="services-hero-arrow"
                    onClick={() => moveHeroSlide(1)}
                    aria-label="Next slide"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
              )}
            </div>

            {/* FLOATING GLASS SPOTLIGHT CARD */}
            <div className="services-hero-spotlight" key={activeHeroSlide.id}>
              <div className="services-spotlight-header">
                <span className="services-spotlight-badge">{activeHeroSlide.category}</span>
                <span className="services-spotlight-duration">{activeHeroSlide.duration}</span>
              </div>
              <strong>{activeHeroSlide.title}</strong>
              <div className="services-spotlight-price-row">
                <span className="services-spotlight-price">{formatPrice(activeHeroSlide.price)}</span>
                {activeHeroSlide.oldPrice > activeHeroSlide.price && (
                  <del className="services-spotlight-old-price">{formatPrice(activeHeroSlide.oldPrice)}</del>
                )}
              </div>
              <div className="services-spotlight-footer">
                <span className="services-spotlight-validity">Available Today</span>
                <a href="#service-list" className="services-spotlight-button">
                  View Service →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          2. EXPLORE BY CATEGORY SECTION
      ================================================= */}

      <section className="services-category-section" id="services">
        <div className="services-category-heading centered">
          <span>LAVENDER ATELIER</span>
          <h2>
            Curated Lavender &amp; <em>Amethyst Services</em>
          </h2>
          <p>
            Find your perfect service from our curated collections
          </p>
        </div>

        {/* CAROUSEL WITH ARROW NAVIGATION */}
        <div className="services-category-slider">
          <button
            type="button"
            className="category-scroll-button category-scroll-button-left"
            disabled={!categoryCanScrollLeft}
            onClick={() => scrollCategories('left')}
            aria-label="Previous categories"
          >
            ←
          </button>

          <div className="services-category-list" ref={categoryScrollRef}>
            {/* ALL SERVICES BUTTON */}
            <button
              type="button"
              className={!activeCategory ? 'service-category-circle-item active' : 'service-category-circle-item'}
              onClick={selectAllServices}
            >
              <div className="service-category-circle-avatar all-rituals-avatar">
                <div className="service-category-circle-inner">
                  <span className="all-rituals-sparkle">✦</span>
                </div>
              </div>
              <div className="service-category-circle-info">
                <strong>All Services</strong>
                <span>{services.length} {services.length === 1 ? 'Service' : 'Services'}</span>
              </div>
            </button>

            {/* CATEGORIES FROM DATABASE */}
            {categories.map((category) => {
              const serviceCount = services.filter((s) => s.categoryId === category.id).length
              return (
                <button
                  type="button"
                  key={category.id}
                  className={activeCategory?.id === category.id ? 'service-category-circle-item active' : 'service-category-circle-item'}
                  onClick={() => selectCategory(category)}
                >
                  <div className="service-category-circle-avatar">
                    <img
                      src={category.image || assets.hero}
                      alt={category.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="service-category-circle-info">
                    <strong>{category.name}</strong>
                    <span>{serviceCount > 0 ? `${serviceCount} ${serviceCount === 1 ? 'Service' : 'Services'}` : 'Service Collection'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="category-scroll-button category-scroll-button-right"
            disabled={!categoryCanScrollRight}
            onClick={() => scrollCategories('right')}
            aria-label="Next categories"
          >
            →
          </button>
        </div>
      </section>

      {/* =================================================
          3. PREMIUM CATALOG GRID SECTION
      ================================================= */}

      <section className="services-list-section" id="service-list">
        <div className="services-list-heading">
          <div>
            <span>
              {activeCategory ? activeCategory.name.toUpperCase() : 'ALL CURATED OFFERINGS'}
            </span>
            <h2>
              {activeCategory ? `${activeCategory.name} Services` : 'All Curated Offerings'}
            </h2>
            <p>
              {filteredServices.length}{' '}
              {filteredServices.length === 1 ? 'Service' : 'Services'} available
              {categories.length > 0 && ` across ${categories.length} categories`}
            </p>
          </div>

          {/* SORT MENU DROPDOWN */}
          <div className="services-sort-wrapper" ref={sortRef}>
            <button
              type="button"
              className="services-sort-button"
              onClick={() => setSortOpen((current) => !current)}
              aria-expanded={sortOpen}
            >
              <span>Sort by:</span>
              <strong>
                {SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
              </strong>
              <span>↓</span>
            </button>

            {sortOpen && (
              <div className="services-sort-menu">
                {SORT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={sortBy === option.value ? 'active' : ''}
                    onClick={() => {
                      setSortBy(option.value)
                      setSortOpen(false)
                    }}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="services-grid">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div className="service-card" key={index}>
                <div className="service-card-image" style={{ background: '#f3e8ff' }} />
                <div style={{ height: '120px', background: '#f5f0ff', borderRadius: '12px' }} />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="services-final">
            <h2>Something went <em>wrong.</em></h2>
            <p>{error}</p>
            <button
              type="button"
              className="services-primary-button"
              onClick={() => {
                void loadServices()
                void loadOffers()
              }}
            >
              Try Again <ArrowIcon />
            </button>
          </div>
        )}

        {/* SERVICES CARDS GRID */}
        {!loading && !error && paginatedServices.length > 0 && (
          <div className="services-grid">
            {paginatedServices.map((service, index) => {
              const isSelected = isServiceSelected(service.id)
              const offer = getApplicableOffer(service, offers)
              const pricing = calculateDiscount(service.price, offer)
              const hasDiscount = Boolean(offer && pricing.discountAmount > 0)

              return (
                <article
                  className={isSelected ? 'service-card selected' : 'service-card'}
                  key={service.id}
                >
                  {/* UN-CROPPED IMAGE CONTAINER WITH BADGES */}
                  <div className="service-card-image">
                    <img
                      src={service.image || assets.hero}
                      alt={service.name}
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />

                    {hasDiscount && offer ? (
                      <span className="service-card-offer-pill">
                        {discountText(offer)}
                      </span>
                    ) : (
                      <span className="service-card-category-pill">
                        {service.category}
                      </span>
                    )}

                    <div className="service-duration-badge">
                      <ClockIcon />
                      <span>{service.duration}</span>
                    </div>

                    <button
                      type="button"
                      className={isSelected ? 'service-card-select selected' : 'service-card-select'}
                      onClick={() => toggleService(service.id)}
                      aria-label={isSelected ? `Remove ${service.name}` : `Add ${service.name}`}
                    >
                      {isSelected ? '✓' : '+'}
                    </button>
                  </div>

                  {/* CARD BODY CONTENT */}
                  <div className="service-card-content">
                    <div className="service-card-meta">
                      <span className="service-category-tag">{service.category}</span>
                      <div className="service-rating">
                        <span>★</span>
                        <span>4.98</span>
                      </div>
                    </div>

                    <div className="service-card-header">
                      <h3>{service.name}</h3>
                      <p>{service.description}</p>
                    </div>

                    {/* OFFER BANNER IF APPLICABLE */}
                    {hasDiscount && offer && (
                      <div className="service-card-current-offer">
                        <div className="offer-title-group">
                          <span className="offer-tag-icon">🏷️</span>
                          <strong className="offer-title-text">{offer.title}</strong>
                        </div>
                        {offer.endsAt && (
                          <span className="offer-expiry-text">
                            Valid until {formatOfferDate(offer.endsAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* CARD FOOTER WITH PRICE & ACTION */}
                    <div className="service-card-footer">
                      <div className="service-price-block">
                        <div className="service-price-row">
                          <div className="price-details">
                            {hasDiscount && offer ? (
                              <>
                                <strong className="service-offer-price">
                                  {formatPrice(pricing.finalPrice)}
                                </strong>
                                <del className="original-price">
                                  {formatPrice(pricing.originalPrice)}
                                </del>
                              </>
                            ) : (
                              <strong className="service-normal-price">
                                {formatPrice(service.price)}
                              </strong>
                            )}
                          </div>
                        </div>

                        {hasDiscount && offer && pricing.discountAmount > 0 && (
                          <span className="service-save-badge">
                            Save {formatPrice(pricing.discountAmount)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={isSelected ? 'service-book-button selected' : 'service-book-button'}
                        disabled={addingService}
                        onClick={() => {
                          if (addingService) return
                          if (assignTo) {
                            setAddingService(true)
                            toggleService(service.id)
                            window.setTimeout(() => setAddingService(false), 200)
                            return
                          }
                          toggleService(service.id)
                        }}
                      >
                        {isSelected
                          ? assignTo
                            ? '✓ Added'
                            : '✓ Added to Booking'
                          : assignTo
                            ? '+ Add to Person'
                            : '+ Add to Booking'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && paginatedServices.length === 0 && (
          <div className="services-final">
            <h2>No services <em>found.</em></h2>
            <p>Try searching for a different therapy or reset search filters.</p>
            <button
              type="button"
              className="services-primary-button"
              onClick={() => {
                selectAllServices()
              }}
            >
              View All Services <ArrowIcon />
            </button>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="services-pagination">
            <button
              type="button"
              className="pagination-arrow"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Previous Page"
            >
              ←
            </button>

            <div className="services-pagination-numbers">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      type="button"
                      key={page}
                      className={currentPage === page ? 'active' : ''}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  )
                }

                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={`ellipsis-${page}`} className="pagination-ellipsis">
                      …
                    </span>
                  )
                }

                return null
              })}
            </div>

            <button
              type="button"
              className="pagination-arrow"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Next Page"
            >
              →
            </button>
          </div>
        )}
      </section>

      {/* =================================================
          4. PROMOTIONS & SPECIAL OFFERS SECTION
      ================================================= */}

      {!offerLoading && displayedOffers.length > 0 && (
        <section className="services-promo">
          {displayedOffers.map((offer, index) => (
            <DealOfDay
              key={offer.id}
              offer={offer}
              featured={index === 0}
            />
          ))}
        </section>
      )}

      {/* =================================================
          5. FINAL BRAND INVITATION & METRICS STRIP
      ================================================= */}

      {!assignTo && (
        <section className="services-final">
          <span>WILDFLORAL VIOLET SANCTUARY</span>
          <h2>
            Your serene transformation <em>begins here.</em>
          </h2>
          <p style={{ maxWidth: '580px', margin: '0 auto 24px', color: 'var(--text-subtle)' }}>
            Surrender to an immersive twilight haven of French lavender and restorative botanical bodywork designed to rejuvenate body and soul.
          </p>
          <button
            type="button"
            className="services-final-button"
            onClick={() => void continueAssignment()}
          >
            Book Appointment <ArrowIcon />
          </button>
        </section>
      )}

      {/* LUXURY METRICS STRIP */}
      <section className="fashion-stats-strip">
        <div className="fashion-stats-container">
          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="fashion-stat-content">
              <strong>20k+</strong>
              <span>Sanctuary Guests</span>
            </div>
          </div>

          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="fashion-stat-content">
              <strong>50+</strong>
              <span>Master Therapists</span>
            </div>
          </div>

          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="fashion-stat-content">
              <strong>100%</strong>
              <span>Organic Botanicals</span>
            </div>
          </div>

          <div className="fashion-stat-item">
            <div className="fashion-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="fashion-stat-content">
              <strong>15+</strong>
              <span>Years Heritage</span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          6. FLOATING STICKY SELECTION BAR
      ================================================= */}

      {selectedServices.length > 0 && (
        <div className="service-selection-bar">
          <div className="service-selection-inner">
            <div className="selection-summary">
              <div className="selection-count">
                {selectedServices.length}
              </div>
              <div className="selection-summary-text">
                <strong>
                  {isOPCustomer ? (
                    <>
                      <span className="desktop-text">Services for person</span>
                      <span className="mobile-text">Person</span>
                    </>
                  ) : assignTo ? (
                    <>
                      <span className="desktop-text">Services for person</span>
                      <span className="mobile-text">Person</span>
                    </>
                  ) : (
                    <>
                      <span className="desktop-text">Services selected</span>
                      <span className="mobile-text">Selected</span>
                    </>
                  )}
                </strong>
                <span>Total {formatPrice(selectedTotal)}</span>
              </div>
            </div>

            <div className="selection-actions">
              <button
                type="button"
                className="selection-clear"
                onClick={clearSelection}
              >
                Clear
              </button>

              {isOPCustomer ? (
                <button
                  type="button"
                  className="selection-book"
                  onClick={continueAssignment}
                >
                  <span className="desktop-text">Done</span>
                  <span className="mobile-text">Done</span> <ArrowIcon />
                </button>
              ) : assignTo ? (
                <button
                  type="button"
                  className="selection-book"
                  onClick={continueAssignment}
                >
                  <span className="desktop-text">Done</span>
                  <span className="mobile-text">Done</span> <ArrowIcon />
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
                    <span className="desktop-text">Enquire Now</span>
                    <span className="mobile-text">Enquire</span>
                  </button>

                  <button
                    type="button"
                    className="selection-book"
                    onClick={continueAssignment}
                  >
                    <span className="desktop-text">Book Appointment</span>
                    <span className="mobile-text">Book Now</span> <ArrowIcon />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
  const [remaining, setRemaining] = useState(getRemaining(offer.endsAt))

  useEffect(() => {
    if (!offer.endsAt) {
      return
    }

    const timer = window.setInterval(() => {
      setRemaining(getRemaining(offer.endsAt))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [offer.endsAt])

  const discountVal = discountText(offer)

  return (
    <article
      className={
        featured
          ? 'services-promo-card services-promo-exclusive'
          : 'services-promo-card services-promo-deal'
      }
    >
      <span className="services-promo-sparkle" aria-hidden="true">✦</span>

      <div className="services-promo-card-top">
        <span className="services-promo-label">
          {featured ? 'EXCLUSIVE OFFER' : 'SPECIAL SPA OFFER'}
        </span>

        {discountVal && (
          <span className="services-promo-discount-badge">
            {discountVal}
          </span>
        )}
      </div>

      <h2 className="services-promo-title">{offer.title}</h2>

      {offer.description && (
        <p className="services-promo-description">{offer.description}</p>
      )}

      {remaining && (
        <div className="promo-countdown">
          <div className="countdown-box">
            <strong>{String(remaining.days).padStart(2, '0')}</strong>
            <span>DAYS</span>
          </div>

          <span className="countdown-colon">:</span>

          <div className="countdown-box">
            <strong>{String(remaining.hours).padStart(2, '0')}</strong>
            <span>HRS</span>
          </div>

          <span className="countdown-colon">:</span>

          <div className="countdown-box">
            <strong>{String(remaining.minutes).padStart(2, '0')}</strong>
            <span>MINS</span>
          </div>

          <span className="countdown-colon">:</span>

          <div className="countdown-box">
            <strong>{String(remaining.seconds).padStart(2, '0')}</strong>
            <span>SECS</span>
          </div>
        </div>
      )}

      <div className="services-promo-divider" />

      <div className="services-promo-footer">
        <div className="services-promo-info-group">
          {offer.promoCode && (
            <div className="services-promo-code">
              <span>CODE:</span>
              <strong>{offer.promoCode}</strong>
            </div>
          )}

          {offer.endsAt && (
            <span className="services-promo-validity">
              Ends {formatOfferDate(offer.endsAt)}
            </span>
          )}
        </div>

        <Link to="/booking" className="services-promo-button">
          Book Now
          <ArrowIcon />
        </Link>
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