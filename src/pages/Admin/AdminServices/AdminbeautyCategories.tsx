import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './AdminbeautyCategories.css'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

type FilterType =
  | 'all'
  | 'active'
  | 'inactive'

const ITEMS_PER_PAGE = 10

const ADMIN_BEAUTY_CATEGORIES_PAGE_KEY =
  'admin_beauty_categories_page'

function AdminBeautyCategories() {
  const navigate = useNavigate()

  const [categories, setCategories] =
    useState<Category[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState<FilterType>('all')

  const [currentPage, setCurrentPage] =
    useState(() => {
      try {
        const stored =
          window.sessionStorage.getItem(
            ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
          )

        const page = Number(stored)

        return Number.isInteger(page) &&
          page >= 1
          ? page
          : 1
      } catch {
        return 1
      }
    })

  /* =====================================================
     LOAD CATEGORIES
  ===================================================== */

  async function loadCategories() {
    setLoading(true)
    setError('')

    const {
      data,
      error,
    } = await supabase
      .from('service_categories')
      .select(
        `
          id,
          name,
          slug,
          description,
          image_url,
          is_active
        `,
      )
      .order('name', {
        ascending: true,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setCategories(
      (data ?? []) as Category[],
    )

    setLoading(false)
  }

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    void loadCategories()
  }, [])

  /* =====================================================
     SEARCH + FILTER
  ===================================================== */

  const filteredCategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return categories.filter(
        (category) => {
          const matchesSearch =
            !query ||
            category.name
              .toLowerCase()
              .includes(query) ||
            category.slug
              .toLowerCase()
              .includes(query) ||
            (
              category.description ?? ''
            )
              .toLowerCase()
              .includes(query)

          const matchesFilter =
            filter === 'all' ||
            (
              filter === 'active' &&
              category.is_active
            ) ||
            (
              filter === 'inactive' &&
              !category.is_active
            )

          return (
            matchesSearch &&
            matchesFilter
          )
        },
      )
    }, [
      categories,
      search,
      filter,
    ])

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCategories.length /
          ITEMS_PER_PAGE,
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
      categories.length === 0
    ) {
      return
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages)

      try {
        window.sessionStorage.setItem(
          ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
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
    categories.length,
  ])

  const startIndex =
    (safePage - 1) *
    ITEMS_PER_PAGE

  const visibleCategories =
    filteredCategories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    )

  const firstItem =
    filteredCategories.length === 0
      ? 0
      : startIndex + 1

  const lastItem =
    Math.min(
      startIndex + ITEMS_PER_PAGE,
      filteredCategories.length,
    )

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalCategories =
    categories.length

  const activeCategories =
    categories.filter(
      (category) =>
        category.is_active,
    ).length

  const inactiveCategories =
    categories.filter(
      (category) =>
        !category.is_active,
    ).length

  /* =====================================================
     DELETE CATEGORY
  ===================================================== */

  async function deleteCategory(
    category: Category,
  ) {
    setError('')

    const {
      count,
      error: countError,
    } = await supabase
      .from('services')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq(
        'category_id',
        category.id,
      )

    if (countError) {
      setError(
        countError.message,
      )
      return
    }

    if ((count ?? 0) > 0) {
      setError(
        `Cannot delete "${category.name}" because it contains ${count} services.`,
      )
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${category.name}"?`,
      )

    if (!confirmed) {
      return
    }

    const {
      error: deleteError,
    } = await supabase
      .from('service_categories')
      .delete()
      .eq(
        'id',
        category.id,
      )

    if (deleteError) {
      setError(
        deleteError.message,
      )
      return
    }

    setCategories(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            category.id,
        ),
    )

    setCurrentPage(1)
  }

  /* =====================================================
     PAGE NAVIGATION
  ===================================================== */

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
        ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
        String(page),
      )
    } catch {
      // Ignore storage errors.
    }

    setCurrentPage(page)
  }

  /* =====================================================
     FILTER
  ===================================================== */

  function handleFilterChange(
    value: FilterType,
  ) {
    setFilter(value)
    setCurrentPage(1)

    try {
      window.sessionStorage.setItem(
        ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
        '1',
      )
    } catch {
      // Ignore storage errors.
    }
  }

  function clearFilters() {
    setSearch('')
    setFilter('all')
    setCurrentPage(1)

    try {
      window.sessionStorage.setItem(
        ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
        '1',
      )
    } catch {
      // Ignore storage errors.
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="admin-categories-page">

      <div className="admin-categories-container">

        <section className="admin-category-main-card">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="admin-categories-header">

            <div className="admin-categories-header-content">

              <button
                type="button"
                className="admin-page-back-button"
                onClick={() =>
                  navigate(
                    '/admin/services/beauty',
                  )
                }
              >
                <span>←</span>

                <span>
                  Back to Services
                </span>
              </button>

              <span className="admin-categories-eyebrow">
                BEAUTY SERVICES / CATEGORIES
              </span>

              <h1>
                Service Categories
              </h1>

              <p></p>

            </div>

            <Link
              to="/admin/services/categories/new"
              className="admin-new-category-button"
            >
              <span className="plus">
                +
              </span>

              <span className="new-category-content">

                <strong>
                  New Category
                </strong>

                <small>
                  Create category
                </small>

              </span>
            </Link>

          </header>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="admin-category-stats">

            <article className="admin-category-stat-card blue">

              <div className="stat-icon">
                #
              </div>

              <div className="stat-content">

                <span>
                  TOTAL CATEGORIES
                </span>

                <strong>
                  {totalCategories}
                </strong>

                <small>
                  All catalogue groups
                </small>

              </div>

            </article>

            <article className="admin-category-stat-card green">

              <div className="stat-icon">
                ✓
              </div>

              <div className="stat-content">

                <span>
                  ACTIVE
                </span>

                <strong>
                  {activeCategories}
                </strong>

                <small>
                  Visible to customers
                </small>

              </div>

            </article>

            <article className="admin-category-stat-card orange">

              <div className="stat-icon">
                ○
              </div>

              <div className="stat-content">

                <span>
                  INACTIVE
                </span>

                <strong>
                  {inactiveCategories}
                </strong>

                <small>
                  Hidden categories
                </small>

              </div>

            </article>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="admin-categories-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* =================================================
              CATALOGUE
          ================================================= */}

          <section className="admin-catalogue-card">

            <div className="admin-catalogue-header">

              <div className="admin-catalogue-heading">

                <span className="admin-catalogue-eyebrow">
                  CATALOGUE STRUCTURE
                </span>

                <div className="admin-catalogue-title">

                  <h2>
                    Categories
                  </h2>

                 

                </div>

                <p></p>

              </div>

              <div className="admin-catalogue-summary">

                <strong>
                  {filteredCategories.length}
                </strong>

                <span>
                  categories
                </span>

              </div>

            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="admin-categories-toolbar">

              <div className="admin-category-search">

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
                  placeholder="Search categories..."
                  aria-label="Search categories"
                  onChange={(event) => {
                    setSearch(
                      event.target.value,
                    )

                    setCurrentPage(1)

                    try {
                      window.sessionStorage.setItem(
                        ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
                        '1',
                      )
                    } catch {
                      // Ignore storage errors.
                    }
                  }}
                />

              </div>

              <div className="admin-filter-wrapper">

                <svg
                  className="admin-filter-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6h16M7 12h10M10 18h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                <select
                  value={filter}
                  aria-label="Filter categories"
                  onChange={(event) =>
                    handleFilterChange(
                      event.target
                        .value as FilterType,
                    )
                  }
                >
                  <option value="all">
                    All Categories
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

                <svg
                  className="admin-filter-chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="m7 10 5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

              </div>

            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            {loading ? (

              <div className="admin-category-loading">

                <span className="loading-spinner" />

                <span>
                  Loading categories...
                </span>

              </div>

            ) : visibleCategories.length === 0 ? (

              <div className="admin-category-empty">

                <div className="empty-icon">
                  +
                </div>

                <h3>
                  No categories found
                </h3>

                <p>
                  Try changing your search
                  or filter.
                </p>

                {search ||
                filter !== 'all' ? (

                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>

                ) : (

                  <Link
                    to="/admin/services/categories/new"
                  >
                    Create Category
                  </Link>

                )}

              </div>

            ) : (

              <div className="admin-category-grid">

                {visibleCategories.map(
                  (category) => (

                    <article
                      key={category.id}
                      className="admin-category-card"
                    >
                      <div className="admin-category-card-image">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="admin-category-card-placeholder">
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <span
                          className={
                            category.is_active
                              ? 'admin-category-card-status active'
                              : 'admin-category-card-status inactive'
                          }
                        >
                          <i />
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="admin-category-card-content">
                        <span className="admin-category-card-eyebrow">
                          SERVICE CATEGORY
                        </span>

                        <h3 title={category.name}>
                          {category.name}
                        </h3>

                        <p>
                          {category.description ||
                            'No description provided for this category.'}
                        </p>

                      </div>

                      <div className="admin-category-card-actions">
                        <button
                          type="button"
                          className="admin-category-card-edit"
                          onClick={() => {
                            try {
                              window.sessionStorage.setItem(
                                ADMIN_BEAUTY_CATEGORIES_PAGE_KEY,
                                String(safePage),
                              )
                            } catch {
                              // Ignore storage errors.
                            }

                            navigate(
                              `/admin/services/categories/${category.id}/edit`,
                            )
                          }}
                          aria-label={`Edit ${category.name}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 20h9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-category-card-delete"
                          onClick={() =>
                            void deleteCategory(category)
                          }
                          aria-label={`Delete ${category.name}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </article>

                  ),
                )}

              </div>

            )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading &&
              filteredCategories.length > 0 && (

                <footer className="admin-pagination">

                  <span className="pagination-info">

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
                      {filteredCategories.length}
                    </strong>

                  </span>

                  <div className="pagination-controls">

                    <button
                      type="button"
                      className="pagination-arrow"
                      disabled={
                        safePage === 1
                      }
                      onClick={() =>
                        goToPage(
                          safePage - 1,
                        )
                      }
                      aria-label="Previous page"
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
                          key={page}
                          type="button"
                          className={
                            page === safePage
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
                      className="pagination-arrow"
                      disabled={
                        safePage ===
                        totalPages
                      }
                      onClick={() =>
                        goToPage(
                          safePage + 1,
                        )
                      }
                      aria-label="Next page"
                    >
                      ›
                    </button>

                  </div>

                  <span className="per-page">
                    10 per page
                  </span>

                </footer>

              )}

          </section>

        </section>

      </div>

    </main>
  )
}

export default AdminBeautyCategories