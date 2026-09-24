import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './AdminbeautyServices.css'

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

type Service = {
  id: string
  name: string
  category_id: string | null
  description: string | null
  price: number
  duration_minutes: number
  image_url: string | null
  is_active: boolean
}



const SERVICES_PER_PAGE = 10

const ADMIN_BEAUTY_SERVICES_PAGE_KEY =
  'wildfloral_admin_beauty_services_page'

/* =========================================================
   COMPONENT
========================================================= */

function AdminBeautyServices() {
  const navigate = useNavigate()

  const dropdownRef =
    useRef<HTMLDivElement>(null)

  /* =======================================================
     STATE
  ======================================================= */

  const [categories, setCategories] =
    useState<Category[]>([])

  const [services, setServices] =
    useState<Service[]>([])


  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [categoryFilter, setCategoryFilter] =
    useState('all')

  const [dropdownOpen, setDropdownOpen] =
    useState(false)

  const [currentPage, setCurrentPage] =
    useState(() => {
      try {
        const storedPage =
          window.sessionStorage.getItem(
            ADMIN_BEAUTY_SERVICES_PAGE_KEY,
          )

        const page = Number(storedPage)

        return Number.isInteger(page) &&
          page >= 1
          ? page
          : 1
      } catch {
        return 1
      }
    })

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    const [
      categoriesResponse,
      servicesResponse,
    ] = await Promise.all([
      /* -----------------------------------------------------
         CATEGORIES
      ----------------------------------------------------- */

      supabase
        .from('service_categories')
        .select(
          `
          id,
          name,
          description,
          image_url,
          is_active
          `,
        )
        .order('name', {
          ascending: true,
        }),

      /* -----------------------------------------------------
         SERVICES
      ----------------------------------------------------- */

      supabase
        .from('services')
        .select(
          `
          id,
          name,
          category_id,
          description,
          price,
          duration_minutes,
          image_url,
          is_active
          `,
        )
        .order('created_at', {
          ascending: false,
        }),

    ])

    /* =====================================================
       CATEGORY ERROR
    ===================================================== */

    if (categoriesResponse.error) {
      setError(
        categoriesResponse.error.message,
      )

      setLoading(false)

      return
    }

    /* =====================================================
       SERVICE ERROR
    ===================================================== */

    if (servicesResponse.error) {
      setError(
        servicesResponse.error.message,
      )

      setLoading(false)

      return
    }



    /* =====================================================
       SET DATA
    ===================================================== */

    setCategories(
      (categoriesResponse.data ??
        []) as Category[],
    )

    setServices(
      (servicesResponse.data ??
        []) as Service[],
    )

    setLoading(false)
  }

  /* =======================================================
     CLOSE DROPDOWN
  ======================================================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setDropdownOpen(false)
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
     ACTIVE CATEGORIES
  ======================================================= */

  const activeCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.is_active,
        ),
      [categories],
    )

  /* =======================================================
     ACTIVE SERVICES COUNT
  ======================================================= */

  const activeServices =
    useMemo(
      () =>
        services.filter(
          (service) =>
            service.is_active,
        ).length,
      [services],
    )

  /* =======================================================
     CATEGORY NAME
  ======================================================= */

  function getCategoryName(
    categoryId: string | null,
  ) {
    if (!categoryId) {
      return 'Uncategorized'
    }

    return (
      categories.find(
        (category) =>
          category.id === categoryId,
      )?.name ??
      'Uncategorized'
    )
  }

  /* =======================================================
     CATEGORY SERVICE COUNT
  ======================================================= */

  function getCategoryServiceCount(
    categoryId: string,
  ) {
    return services.filter(
      (service) =>
        service.category_id ===
        categoryId,
    ).length
  }

 
  /* =======================================================
     FILTER SERVICES
  ======================================================= */

  const filteredServices =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return services.filter(
        (service) => {
          const serviceName =
            service.name.toLowerCase()

          const categoryName =
            getCategoryName(
              service.category_id,
            ).toLowerCase()

          const description =
            (
              service.description ??
              ''
            ).toLowerCase()

          const matchesSearch =
            !query ||
            serviceName.includes(
              query,
            ) ||
            categoryName.includes(
              query,
            ) ||
            description.includes(
              query,
            )

          const matchesCategory =
            categoryFilter ===
              'all' ||
            service.category_id ===
              categoryFilter

          return (
            matchesSearch &&
            matchesCategory
          )
        },
      )
    }, [
      services,
      categories,
      search,
      categoryFilter,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredServices.length /
          SERVICES_PER_PAGE,
      ),
    )

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    )

  useEffect(() => {
    if (
      loading ||
      services.length === 0
    ) {
      return
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages)

      try {
        window.sessionStorage.setItem(
          ADMIN_BEAUTY_SERVICES_PAGE_KEY,
          String(totalPages),
        )
      } catch {
        // Ignore storage errors.
      }
    }
  }, [
    currentPage,
    totalPages,
    loading,
    services.length,
  ])

  const startIndex =
    (safePage - 1) *
    SERVICES_PER_PAGE

  const visibleServices =
    filteredServices.slice(
      startIndex,
      startIndex +
        SERVICES_PER_PAGE,
    )

  const firstItem =
    filteredServices.length === 0
      ? 0
      : startIndex + 1

  const lastItem =
    Math.min(
      startIndex +
        SERVICES_PER_PAGE,
      filteredServices.length,
    )



  /* =======================================================
     CATEGORY FILTER LABEL
  ======================================================= */

  const selectedCategoryName =
    categoryFilter === 'all'
      ? 'All Categories'
      : categories.find(
          (category) =>
            category.id ===
            categoryFilter,
        )?.name ??
        'All Categories'

  /* =======================================================
     SELECT CATEGORY
  ======================================================= */

  function selectCategory(
    categoryId: string,
  ) {
    setCategoryFilter(categoryId)
    setDropdownOpen(false)
    setCurrentPage(1)

    try {
      window.sessionStorage.setItem(
        ADMIN_BEAUTY_SERVICES_PAGE_KEY,
        '1',
      )
    } catch {
      // Ignore storage errors.
    }
  }

  /* =======================================================
     CATEGORY CARD CLICK
  ======================================================= */

  function handleCategoryCard(
    categoryId: string,
  ) {
    setCategoryFilter(categoryId)
    setCurrentPage(1)

    try {
      window.sessionStorage.setItem(
        ADMIN_BEAUTY_SERVICES_PAGE_KEY,
        '1',
      )
    } catch {
      // Ignore storage errors.
    }

    window.setTimeout(() => {
      document
        .getElementById(
          'admin-beauty-services-list',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 50)
  }

  /* =======================================================
     TOGGLE SERVICE
  ======================================================= */

  async function toggleService(
    service: Service,
  ) {
    setError('')

    const nextStatus =
      !service.is_active

    const { error } =
      await supabase
        .from('services')
        .update({
          is_active: nextStatus,
        })
        .eq('id', service.id)

    if (error) {
      setError(error.message)

      return
    }

    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? {
              ...item,
              is_active:
                nextStatus,
            }
          : item,
      ),
    )
  }

  /* =======================================================
     DELETE SERVICE
  ======================================================= */

  async function deleteService(
    service: Service,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${service.name}"?`,
      )

    if (!confirmed) {
      return
    }

    setError('')

    const { error } =
      await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

    if (error) {
      setError(error.message)

      return
    }

    setServices((current) =>
      current.filter(
        (item) =>
          item.id !== service.id,
      ),
    )
  }

  /* =======================================================
     PAGINATION
  ======================================================= */

  function goToPage(
    page: number,
  ) {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return
    }

    try {
      window.sessionStorage.setItem(
        ADMIN_BEAUTY_SERVICES_PAGE_KEY,
        String(page),
      )
    } catch {
      // Ignore storage errors.
    }

    setCurrentPage(page)

    window.setTimeout(() => {
      document
        .getElementById(
          'admin-beauty-services-list',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 50)
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="beauty-services-page">

      <div className="beauty-services-card">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="beauty-services-header">

          <div className="beauty-services-header-left">

            <button
              type="button"
              className="beauty-services-back"
              onClick={() =>
                navigate('/admin')
              }
            >
              ← Back to Dashboard
            </button>

            <span className="beauty-services-eyebrow">
              BEAUTY SERVICES / CATALOGUE
            </span>

            <h1>
              Services Management
            </h1>

            <p>
              Manage beauty categories,
              services, pricing, offers,
              and customer visibility.
            </p>

          </div>

          <div className="beauty-services-header-actions">

            <Link
              to="/admin/services/categories/new"
              className="beauty-header-button secondary"
            >
              <span>+</span>

              <div>
                <strong>
                  Add Category
                </strong>

                <small>
                  Create category
                </small>
              </div>
            </Link>

            <Link
              to="/admin/services/new"
              className="beauty-header-button primary"
            >
              <span>+</span>

              <div>
                <strong>
                  New Service
                </strong>

                <small>
                  Add service
                </small>
              </div>
            </Link>

          </div>

        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="beauty-services-error">
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="beauty-services-stats">

          <article className="beauty-stat blue">

            <div className="beauty-stat-icon">
              #
            </div>

            <div>
              <span>
                TOTAL SERVICES
              </span>

              <strong>
                {services.length}
              </strong>

              <small>
                Services in catalogue
              </small>
            </div>

          </article>

          <article className="beauty-stat green">

            <div className="beauty-stat-icon">
              ✓
            </div>

            <div>
              <span>
                ACTIVE SERVICES
              </span>

              <strong>
                {activeServices}
              </strong>

              <small>
                Visible to customers
              </small>
            </div>

          </article>

          <article className="beauty-stat purple">

            <div className="beauty-stat-icon">
              ◇
            </div>

            <div>
              <span>
                CATEGORIES
              </span>

              <strong>
                {activeCategories.length}
              </strong>

              <small>
                Active categories
              </small>
            </div>

          </article>

        </section>

        {/* =================================================
            ACTIVE CATEGORIES
        ================================================= */}

        <section className="beauty-section">

          <div className="beauty-section-heading">

            <div>

              <span>
                BEAUTY SERVICE CATEGORIES
              </span>

              <h2>
                Active Categories
              </h2>

              <p>
                Browse services by category.
              </p>

            </div>

            <Link
              to="/admin/services/categories"
              className="beauty-view-all"
            >
              View All Categories →
            </Link>

          </div>

          {loading ? (

            <div className="beauty-loading">
              Loading categories...
            </div>

          ) : activeCategories.length === 0 ? (

            <div className="beauty-empty">

              <div className="beauty-empty-icon">
                +
              </div>

              <h3>
                No categories yet
              </h3>

              <p>
                Create your first service
                category.
              </p>

              <Link
                to="/admin/services/categories/new"
              >
                Add Category
              </Link>

            </div>

          ) : (

            <div className="beauty-category-grid">

              {activeCategories
                .slice(0, 4)
                .map((category) => (

                  <article
                    key={category.id}
                    className="beauty-category-card"
                    onClick={() =>
                      handleCategoryCard(
                        category.id,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault()

                        handleCategoryCard(
                          category.id,
                        )
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >

                    <div className="beauty-category-image">

                      {category.image_url ? (

                        <img
                          src={
                            category.image_url
                          }
                          alt={
                            category.name
                          }
                          loading="lazy"
                          draggable={false}
                        />

                      ) : (

                        <div className="beauty-category-placeholder">
                          <span>
                            {category.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>

                      )}

                      <span className="beauty-category-status">

                        <span className="beauty-category-status-dot" />

                        Active

                      </span>

                    </div>

                    <div className="beauty-category-content">

                      <span className="beauty-category-label">
                        CATEGORY
                      </span>

                      <h3 className="beauty-category-title">
                        {
                          category.name
                        }
                      </h3>

                      <p className="beauty-category-description">
                        {
                          category.description ||
                          'No description provided for this category.'
                        }
                      </p>

                      <div className="beauty-category-bottom">

                        <span className="beauty-category-count">
                          {
                            getCategoryServiceCount(
                              category.id,
                            )
                          }{' '}
                          Services
                        </span>

                        <span className="beauty-category-arrow">
                          →
                        </span>

                      </div>

                    </div>

                  </article>

                ))}

            </div>

          )}

        </section>

        {/* =================================================
            ALL SERVICES
        ================================================= */}

        <section
          id="admin-beauty-services-list"
          className="beauty-section beauty-all-services"
        >

          <div className="beauty-section-heading">

            <div>

              <span>
                ALL BEAUTY SERVICES
              </span>

              <h2>
                Manage Beauty Services
              </h2>

              <p>
                Search, filter, edit, and
                manage your services.
              </p>

            </div>

            <Link
              to="/admin/services/new"
              className="beauty-view-all"
            >
              Add New Service +
            </Link>

          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="beauty-filter-bar">

            <div className="beauty-search">

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="m16 16 4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

              </svg>

              <input
                type="search"
                value={search}
                placeholder="Search services..."
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)

                  try {
                    window.sessionStorage.setItem(
                      ADMIN_BEAUTY_SERVICES_PAGE_KEY,
                      '1',
                    )
                  } catch {
                    // Ignore storage errors.
                  }
                }}
              />

            </div>

            <div
              ref={dropdownRef}
              className={`beauty-dropdown ${
                dropdownOpen
                  ? 'open'
                  : ''
              }`}
            >

              <button
                type="button"
                className="beauty-dropdown-trigger"
                onClick={() =>
                  setDropdownOpen(
                    (value) =>
                      !value,
                  )
                }
              >

                <span className="beauty-filter-symbol">
                  ☰
                </span>

                <span>
                  {selectedCategoryName}
                </span>

                <span className="beauty-chevron">
                  ▾
                </span>

              </button>

              {dropdownOpen && (

                <div className="beauty-dropdown-menu">

                  <button
                    type="button"
                    className={
                      categoryFilter ===
                      'all'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      selectCategory(
                        'all',
                      )
                    }
                  >

                    <span>
                      All Categories
                    </span>

                    {categoryFilter ===
                      'all' && (
                      <span>
                        ✓
                      </span>
                    )}

                  </button>

                  {activeCategories.map(
                    (category) => (

                      <button
                        type="button"
                        key={category.id}
                        className={
                          categoryFilter ===
                          category.id
                            ? 'selected'
                            : ''
                        }
                        onClick={() =>
                          selectCategory(
                            category.id,
                          )
                        }
                      >

                        <span>
                          {category.name}
                        </span>

                        {categoryFilter ===
                          category.id && (
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
              SERVICE TABLE
          ================================================= */}

          {loading ? (

            <div className="beauty-table-message">
              Loading services...
            </div>

          ) : visibleServices.length === 0 ? (

            <div className="beauty-table-message">

              <strong>
                No services found
              </strong>

              <span>
                Try changing your search
                or category filter.
              </span>

            </div>

          ) : (

            <div className="beauty-table-wrap">

              <table className="beauty-service-table">

                <thead>

                  <tr>

                    <th>
                      SERVICE
                    </th>

                    <th>
                      CATEGORY
                    </th>

                    <th>
                      PRICE
                    </th>

                    <th>
                      DURATION
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      ACTIONS
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {visibleServices.map(
                    (service) => {
                      return (
                        <tr
                          key={service.id}
                        >

                          {/* SERVICE */}

                          <td>

                            <div className="beauty-service-name">

                              <div className="beauty-service-image">

                                {service.image_url ? (

                                  <img
                                    src={
                                      service.image_url
                                    }
                                    alt=""
                                  />

                                ) : (

                                  <span>
                                    WF
                                  </span>

                                )}

                              </div>

                              <div>

                                <strong>
                                  {
                                    service.name
                                  }
                                </strong>

                                <small>
                                  {
                                    service.description ||
                                    'No description'
                                  }
                                </small>

                              </div>

                            </div>

                          </td>

                          {/* CATEGORY */}

                          <td>

                            <span className="beauty-category-badge">
                              {getCategoryName(
                                service.category_id,
                              )}
                            </span>

                          </td>

                          {/* PRICE */}

                          <td>

                            <strong className="beauty-price">
                              ₹
                              {Number(
                                service.price,
                              ).toLocaleString(
                                'en-IN',
                              )}
                            </strong>

                          </td>

                          {/* DURATION */}

                          <td>

                            <span className="beauty-duration">
                              {
                                service.duration_minutes
                              }{' '}
                              min
                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            <button
                              type="button"
                              className={`beauty-status ${
                                service.is_active
                                  ? 'active'
                                  : 'hidden'
                              }`}
                              onClick={() =>
                                void toggleService(
                                  service,
                                )
                              }
                            >

                              <i />

                              {service.is_active
                                ? 'Active'
                                : 'Hidden'}

                            </button>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="beauty-service-actions">

                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    window.sessionStorage.setItem(
                                      ADMIN_BEAUTY_SERVICES_PAGE_KEY,
                                      String(safePage),
                                    )
                                  } catch {
                                    // Ignore storage errors.
                                  }

                                  navigate(
                                    `/admin/services/${service.id}/edit`,
                                  )
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete"
                                onClick={() =>
                                  void deleteService(
                                    service,
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    },
                  )}

                </tbody>

              </table>

            </div>

          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            filteredServices.length > 0 && (

              <footer className="beauty-pagination">

                <span>

                  Showing{' '}

                  <strong>
                    {firstItem}
                  </strong>

                  {' – '}

                  <strong>
                    {lastItem}
                  </strong>

                  {' of '}

                  <strong>
                    {
                      filteredServices.length
                    }
                  </strong>{' '}

                  services

                </span>

                <div className="beauty-pagination-buttons">

                  <button
                    type="button"
                    disabled={
                      safePage === 1
                    }
                    onClick={() =>
                      goToPage(
                        safePage - 1,
                      )
                    }
                  >
                    ‹
                  </button>

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) =>
                      index + 1,
                  ).map(
                    (page) => (

                      <button
                        type="button"
                        key={page}
                        className={
                          page ===
                          safePage
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          goToPage(page)
                        }
                      >
                        {page}
                      </button>

                    ),
                  )}

                  <button
                    type="button"
                    disabled={
                      safePage ===
                      totalPages
                    }
                    onClick={() =>
                      goToPage(
                        safePage + 1,
                      )
                    }
                  >
                    ›
                  </button>

                </div>

              </footer>

            )}

        </section>

      </div>

    </main>
  )
}

export default AdminBeautyServices