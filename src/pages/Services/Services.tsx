import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useSearchParams,
} from 'react-router'

import { supabase } from '../../lib/supabase'
import { assets } from '../../assets/assets'

import './Services.css'

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
  is_active: boolean
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
  is_active: boolean
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
  serviceId: string | null
  categoryId: string | null
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
}

/* =========================================================
   CONSTANTS
========================================================= */

const ITEMS_PER_PAGE = 6

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

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* =========================================================
   SERVICES PAGE
========================================================= */

function Services() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const categoryParam =
    searchParams.get('category')

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

  const sortRef =
    useRef<HTMLDivElement | null>(null)

  const categoryScrollRef =
    useRef<HTMLDivElement | null>(null)

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

  /* =======================================================
     LOAD OFFERS
  ======================================================= */

  useEffect(() => {
    void loadOffers()
  }, [])

  /* =======================================================
     CLOSE SORT DROPDOWN
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
     LOAD SERVICES
  ======================================================= */

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
              is_active
            `,
          )
          .eq(
            'is_active',
            true,
          )
          .order(
            'name',
            {
              ascending: true,
            },
          ),

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
              image_url,
              is_active
            `,
          )
          .eq(
            'is_active',
            true,
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          ),
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

      const mappedServices =
        serviceRows.map(
          (row) => {
            const category =
              categoryRows.find(
                (item) =>
                  item.id ===
                  row.category_id,
              )

            return {
              id: row.id,

              categoryId:
                row.category_id ??
                '',

              category:
                category?.name ??
                row.category ??
                'Beauty',

              name:
                row.name,

              description:
                row.description ??
                '',

              duration:
                row.duration_minutes
                  ? `${row.duration_minutes} min`
                  : 'By consultation',

              price:
                Number(row.price),

              image:
                row.image_url ||
                assets.hero,
            }
          },
        )

      const mappedCategories =
        categoryRows.map(
          (row) => {
            const categoryService =
              mappedServices.find(
                (service) =>
                  service.categoryId ===
                  row.id,
              )

            return {
              id: row.id,

              name: row.name,

              slug: row.slug,

              description:
                row.description,

              image:
                categoryService?.image ||
                assets.hero,
            }
          },
        )

      setServices(
        mappedServices,
      )

      setCategories(
        mappedCategories,
      )
    } catch (loadError) {
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

  async function loadOffers() {
    setOfferLoading(true)

    try {
      const now =
        new Date().toISOString()

      const {
        data,
        error: offerError,
      } =
        await supabase
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
              category_id
            `,
          )
          .eq(
            'is_active',
            true,
          )
          .lte(
            'starts_at',
            now,
          )
          .or(
            `ends_at.is.null,ends_at.gte.${now}`,
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          )

      if (offerError) {
        console.error(
          'Offers:',
          offerError.message,
        )

        setOffers([])

        return
      }

      const rows =
        (data ?? []) as OfferRow[]

      const mappedOffers =
        rows.map(
          (row) => ({
            id:
              row.id,

            title:
              row.title,

            description:
              row.description ??
              '',

            discountType:
              row.discount_type,

            discountValue:
              Number(
                row.discount_value,
              ),

            promoCode:
              row.promo_code,

            imageUrl:
              row.image_url,

            startsAt:
              row.starts_at,

            endsAt:
              row.ends_at,

            serviceId:
              row.service_id,

            categoryId:
              row.category_id,
          }),
        )

      setOffers(
        mappedOffers,
      )
    } catch (offerError) {
      console.error(
        'Offers:',
        offerError,
      )

      setOffers([])
    } finally {
      setOfferLoading(false)
    }
  }

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
     FILTER SERVICES
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
          : services

      if (
        sortBy ===
        'price-low'
      ) {
        result = [
          ...result,
        ].sort(
          (a, b) =>
            a.price -
            b.price,
        )
      }

      if (
        sortBy ===
        'price-high'
      ) {
        result = [
          ...result,
        ].sort(
          (a, b) =>
            b.price -
            a.price,
        )
      }

      if (
        sortBy ===
        'name-az'
      ) {
        result = [
          ...result,
        ].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
            ),
        )
      }

      if (
        sortBy ===
        'name-za'
      ) {
        result = [
          ...result,
        ].sort(
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
  }, [
    totalPages,
  ])

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
     SELECTED SERVICE OBJECTS
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
      (total, service) =>
        total +
        service.price,
      0,
    )

  /* =======================================================
     CATEGORY CAROUSEL
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
    direction: 'left' | 'right',
  ) {
    const element =
      categoryScrollRef.current

    if (!element) {
      return
    }

    const amount =
      Math.max(
        element.clientWidth * 0.72,
        360,
      )

    element.scrollBy({
      left:
        direction === 'right'
          ? amount
          : -amount,
      behavior:
        'smooth',
    })
  }

  useEffect(() => {
    const element =
      categoryScrollRef.current

    if (!element) {
      return
    }

    const handleScroll =
      () =>
        updateCategoryScrollState()

    const handleResize =
      () =>
        updateCategoryScrollState()

    element.scrollLeft = 0
    updateCategoryScrollState()

    element.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      element.removeEventListener(
        'scroll',
        handleScroll,
      )

      window.removeEventListener(
        'resize',
        handleResize,
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
    setSearchParams({})

    setCurrentPage(1)

    document
      .getElementById(
        'service-list',
      )
      ?.scrollIntoView({
        behavior:
          'smooth',
        block:
          'start',
      })
  }

  function selectCategory(
    category: Category,
  ) {
    setSearchParams({
      category:
        category.slug,
    })

    setCurrentPage(1)

    document
      .getElementById(
        'service-list',
      )
      ?.scrollIntoView({
        behavior:
          'smooth',
        block:
          'start',
      })
  }

  /* =======================================================
     SERVICE SELECTION
  ======================================================= */

  function toggleService(
    serviceId: string,
  ) {
    setSelectedServices(
      (current) =>
        current.includes(
          serviceId,
        )
          ? current.filter(
              (id) =>
                id !==
                serviceId,
            )
          : [
              ...current,
              serviceId,
            ],
    )
  }

  function clearSelection() {
    setSelectedServices([])
  }

  /* =======================================================
     PAGINATION
  ======================================================= */

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
        behavior:
          'smooth',
        block:
          'start',
      })
  }

  /* =======================================================
     OFFER HELPERS
  ======================================================= */

  function discountText(
    offer: Offer,
  ) {
    if (
      offer.discountType ===
      'percentage'
    ) {
      return `${offer.discountValue}% OFF`
    }

    return `₹${offer.discountValue.toLocaleString(
      'en-IN',
    )} OFF`
  }

  const leftOffer =
    offers[0] ?? null

  const rightOffer =
    offers[1] ?? null

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="services-page">

      {/* ===================================================
          HERO
      =================================================== */}

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
            Premium beauty care and
            styling created around your
            look, occasion, and personal
            style.
          </p>

          <div className="services-hero-actions">

            <Link
              to="/booking"
              className="services-primary-button"
            >
              Book Appointment
              <ArrowIcon />
            </Link>

            <a
              href="#our-services"
              className="services-secondary-button"
            >
              Explore Services
              <ArrowIcon />
            </a>

          </div>

          <div className="services-hero-benefits">

            <div>
              <SparkleIcon />
              <span>
                Professional Care
              </span>
            </div>

            <div>
              <SparkleIcon />
              <span>
                Personalised Styling
              </span>
            </div>

            <div>
              <SparkleIcon />
              <span>
                Premium Experience
              </span>
            </div>

          </div>

        </div>

        <div className="services-hero-image">

          <div className="services-hero-image-shape" />

          <img
            src={
              assets.hero
            }
            alt="WildFloral beauty styling"
          />

          <div className="services-hero-floating-card">

            <span>
              WILDFLORAL
            </span>

            <strong>
              Beauty,
              <br />
              made personal.
            </strong>

          </div>

        </div>

      </section>

      {/* ===================================================
          BENEFITS
      =================================================== */}

      <section className="services-benefits">

        <div className="services-benefit">

          <div className="services-benefit-icon">
            <SparkleIcon />
          </div>

          <div>
            <strong>
              Expert Professionals
            </strong>

            <span>
              Skilled beauty specialists
            </span>
          </div>

        </div>

        <div className="services-benefit">

          <div className="services-benefit-icon">
            <ClockIcon />
          </div>

          <div>
            <strong>
              Flexible Appointments
            </strong>

            <span>
              Choose your preferred time
            </span>
          </div>

        </div>

        <div className="services-benefit">

          <div className="services-benefit-icon">
            <SparkleIcon />
          </div>

          <div>
            <strong>
              Premium Products
            </strong>

            <span>
              Quality care and products
            </span>
          </div>

        </div>

        <div className="services-benefit">

          <div className="services-benefit-icon">
            <HeartIcon />
          </div>

          <div>
            <strong>
              Personalised Care
            </strong>

            <span>
              Designed around you
            </span>
          </div>

        </div>

      </section>

      {/* ===================================================
          CATEGORY SECTION
      =================================================== */}

      <section
        className="services-category-section"
        id="our-services"
      >

        <div className="services-centered-heading">

          <span className="services-section-label">
            OUR SERVICES
          </span>

          <h2>
            Choose your
            <span>
              perfect experience.
            </span>
          </h2>

          <p>
            Explore our beauty services
            and choose what feels right
            for you.
          </p>

        </div>

        {/* =================================================
            HORIZONTAL CATEGORY STRIP
        ================================================= */}

        <div className="services-category-wrapper">

          <button
            type="button"
            className="services-category-arrow services-category-arrow-left"
            onClick={() =>
              scrollCategories('left')
            }
            disabled={
              !categoryCanScrollLeft
            }
            aria-label="Previous service categories"
          >
            <ArrowIcon />
          </button>

          <div
            ref={categoryScrollRef}
            className="services-category-scroll"
            role="tablist"
            aria-label="Service categories"
          >

            {/* ALL SERVICES */}

            <button
              type="button"
              role="tab"
              aria-selected={
                !activeCategory
              }
              className={
                !activeCategory
                  ? 'service-category-round active'
                  : 'service-category-round'
              }
              onClick={
                selectAllServices
              }
            >

              <span className="service-category-round-image all-services-image">
                <span>
                  ✦
                </span>
              </span>

              <span className="service-category-round-name">
                All Services
              </span>

              <span className="service-category-round-link">
                View All
                <ArrowIcon />
              </span>

            </button>

            {/* LOADING */}

            {loading &&
              Array.from({
                length: 6,
              }).map(
                (_, index) => (
                  <div
                    className="category-loading-item"
                    key={index}
                  >
                    <div className="category-circle-skeleton" />
                    <span />
                  </div>
                ),
              )}

            {/* CATEGORIES */}

            {!loading &&
              categories.map(
                (category) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={
                      activeCategory?.id ===
                      category.id
                    }
                    key={
                      category.id
                    }
                    className={
                      activeCategory?.id ===
                      category.id
                        ? 'service-category-round active'
                        : 'service-category-round'
                    }
                    onClick={() =>
                      selectCategory(
                        category,
                      )
                    }
                  >

                    <span className="service-category-round-image">

                      <img
                        src={
                          category.image ||
                          assets.hero
                        }
                        alt=""
                        loading="lazy"
                      />

                    </span>

                    <span className="service-category-round-name">
                      {
                        category.name
                      }
                    </span>

                    <span className="service-category-round-link">
                      View Services
                      <ArrowIcon />
                    </span>

                  </button>
                ),
              )}

          </div>

          <button
            type="button"
            className="services-category-arrow services-category-arrow-right"
            onClick={() =>
              scrollCategories('right')
            }
            disabled={
              !categoryCanScrollRight
            }
            aria-label="Next service categories"
          >
            <ArrowIcon />
          </button>

        </div>

      </section>

      {/* ===================================================
          SERVICE COLLECTION
      =================================================== */}

      <section
        className="services-collection"
        id="service-list"
      >

        <div className="services-collection-heading">

          <div>

            <div className="services-breadcrumb" aria-label="Breadcrumb">
              <Link to="/services">
                Our Services
              </Link>

              <ArrowIcon />

              <span>
                {activeCategory
                  ? activeCategory.name
                  : 'All Services'}
              </span>
            </div>

            <span className="services-section-label">
              {activeCategory
                ? activeCategory.name
                : 'ALL SERVICES'}
            </span>

            <h2>
              Our signature services
            </h2>

            <p className="services-result-count">
              {filteredServices.length}{' '}
              {filteredServices.length ===
              1
                ? 'service'
                : 'services'}{' '}
              available
            </p>

          </div>

          {/* SORT */}

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
                    (item) =>
                      item.value ===
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

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="services-grid">

            {Array.from({
              length: 6,
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

        {/* =================================================
            ERROR
        ================================================= */}

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
                onClick={
                  loadServices
                }
              >
                Try Again
                <ArrowIcon />
              </button>

            </div>

          )}

        {/* =================================================
            SERVICE CARDS
        ================================================= */}

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
                    selectedServices.includes(
                      service.id,
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

                      {/* IMAGE */}

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
                            index <
                            3
                              ? 'eager'
                              : 'lazy'
                          }
                        />

                        <span className="service-card-category-pill">
                          {
                            service.category
                          }
                        </span>

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

                      {/* CONTENT */}

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

                            <span>
                              Starting from
                            </span>

                            <strong>
                              ₹
                              {service.price.toLocaleString(
                                'en-IN',
                              )}
                            </strong>

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

                        <button
                          type="button"
                          className={
                            isSelected
                              ? 'service-book-button selected'
                              : 'service-book-button'
                          }
                          onClick={() =>
                            toggleService(
                              service.id,
                            )
                          }
                        >

                          <span>
                            {isSelected
                              ? 'Added to Selection'
                              : 'Add to Selection'}
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

        {/* =================================================
            NO SERVICES
        ================================================= */}

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

        {/* =================================================
            PAGINATION
        ================================================= */}

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
              aria-label="Previous page"
            >
              ←
            </button>

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1,
            ).map(
              (page) => (
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
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              ),
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
              aria-label="Next page"
            >
              →
            </button>

          </div>

        )}

      </section>

      {/* ===================================================
          OFFERS
      =================================================== */}

      {!offerLoading &&
        (leftOffer ||
          rightOffer) && (

          <section className="services-promo">

            {/* LEFT OFFER */}

            {leftOffer && (

              <article className="services-promo-card services-promo-exclusive">

                <div className="services-promo-copy">

                  <span className="services-promo-label">
                    EXCLUSIVE OFFER
                  </span>

                  <h2>
                    {
                      leftOffer.title
                    }
                  </h2>

                  <strong className="services-promo-discount">
                    {
                      discountText(
                        leftOffer,
                      )
                    }
                  </strong>

                  <p>
                    {
                      leftOffer.description
                    }
                  </p>

                  {leftOffer.promoCode && (

                    <div className="services-promo-code">

                      <span>
                        USE CODE
                      </span>

                      <strong>
                        {
                          leftOffer.promoCode
                        }
                      </strong>

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

                  <div className="promo-gift">

                    <span>
                      W
                    </span>

                  </div>

                </div>

              </article>

            )}

            {/* RIGHT OFFER */}

            {rightOffer && (

              <DealOfDay
                offer={
                  rightOffer
                }
              />

            )}

          </section>

        )}

      {/* ===================================================
          SELECTION BAR
      =================================================== */}

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
                  Services selected
                </strong>

                <span>
                  Total ₹
                  {selectedTotal.toLocaleString(
                    'en-IN',
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

              <Link
                to={`/booking?services=${selectedServices.join(
                  ',',
                )}`}
                className="selection-enquiry"
              >
                Enquire Now
              </Link>

              <Link
                to={`/booking?services=${selectedServices.join(
                  ',',
                )}`}
                className="selection-book"
              >
                Book Appointment
                <ArrowIcon />
              </Link>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          FINAL CTA
      =================================================== */}

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

        <Link
          to="/booking"
          className="services-final-button"
        >
          Book Appointment
          <ArrowIcon />
        </Link>

      </section>

    </main>
  )
}

/* =========================================================
   DEAL OF THE DAY
========================================================= */

function DealOfDay({
  offer,
}: {
  offer: Offer
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
    <article className="services-promo-card services-promo-deal">

      <div className="services-deal-content">

        <span className="services-promo-deal-label">
          DEAL OF THE DAY
        </span>

        <h3>
          {
            offer.title
          }
        </h3>

        <p>
          {
            offer.description
          }
        </p>

        {remaining && (

          <div className="promo-countdown">

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

        <Link
          to="/booking"
          className="services-deal-button"
        >
          Book Now
          <ArrowIcon />
        </Link>

      </div>

      <div className="services-promo-deal-image">

        <img
          src={
            offer.imageUrl ||
            assets.hero
          }
          alt=""
          loading="lazy"
        />

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
      difference /
        1000,
    )

  return {
    hours:
      Math.floor(
        totalSeconds /
          3600,
      ),

    minutes:
      Math.floor(
        (totalSeconds %
          3600) /
          60,
      ),

    seconds:
      totalSeconds %
      60,
  }
}

export default Services