import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import { supabase } from '../../../../../lib/supabase'
import './AdminFashionSubCategories.css'

type FashionCategory = {
  id: string
  name: string
}

type FashionSubCategory = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  fashion_categories:
    | FashionCategory
    | FashionCategory[]
    | null
}

type DesignRelation = {
  id: string
  subcategory_id: string
}

const PAGE_SIZE = 9

function AdminFashionSubCategories() {
  const navigate = useNavigate()

  const [subCategories, setSubCategories] =
    useState<FashionSubCategory[]>([])

  const [categories, setCategories] =
    useState<FashionCategory[]>([])

  const [designRelations, setDesignRelations] =
    useState<DesignRelation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [categoryFilter, setCategoryFilter] =
    useState('all')

  const [statusFilter, setStatusFilter] =
    useState<'all' | 'active' | 'inactive'>('all')

  const [page, setPage] =
    useState(1)

  const [deleteId, setDeleteId] =
    useState<string | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  /* =========================================================
     LOAD ALL DATA
  ========================================================= */

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [
      categoriesResult,
      subcategoriesResult,
      designsResult,
    ] = await Promise.all([
      supabase
        .from('fashion_categories')
        .select('id, name')
        .order('name', {
          ascending: true,
        }),

      supabase
        .from('fashion_subcategories')
        .select(`
          id,
          category_id,
          name,
          slug,
          description,
          image_url,
          is_active,
          created_at,
          updated_at,
          fashion_categories (
            id,
            name
          )
        `)
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('fashion_designs')
        .select(`
          id,
          fashion_subcategories!inner (
            id
          )
        `),
    ])

    /* =========================================================
       CATEGORY ERROR
    ========================================================= */

    if (categoriesResult.error) {
      setError(
        `Unable to load fashion categories: ${categoriesResult.error.message}`,
      )

      setCategories([])
      setSubCategories([])
      setDesignRelations([])
      setLoading(false)

      return
    }

    /* =========================================================
       SUBCATEGORY ERROR
    ========================================================= */

    if (subcategoriesResult.error) {
      setError(
        `Unable to load fashion subcategories: ${subcategoriesResult.error.message}`,
      )

      setCategories(
        categoriesResult.data ?? [],
      )

      setSubCategories([])
      setDesignRelations([])
      setLoading(false)

      return
    }

    /* =========================================================
       DESIGN ERROR
    ========================================================= */

    if (designsResult.error) {
      setError(
        `Unable to load fashion service information: ${designsResult.error.message}`,
      )

      setCategories(
        categoriesResult.data ?? [],
      )

      setSubCategories(
        (subcategoriesResult.data ?? []) as FashionSubCategory[],
      )

      setDesignRelations([])
      setLoading(false)

      return
    }

    /* =========================================================
       NORMALIZE SUBCATEGORIES
    ========================================================= */

    const normalizedSubCategories =
      (subcategoriesResult.data ?? []).map(
        (item) => ({
          ...item,

          fashion_categories:
            Array.isArray(
              item.fashion_categories,
            )
              ? item.fashion_categories[0] ?? null
              : item.fashion_categories ?? null,
        }),
      ) as FashionSubCategory[]

    /* =========================================================
       NORMALIZE DESIGN RELATIONS
    ========================================================= */

    const normalizedDesignRelations:
      DesignRelation[] =
      (designsResult.data ?? [])
        .map((design) => {
          const relation =
            Array.isArray(
              design.fashion_subcategories,
            )
              ? design.fashion_subcategories[0]
              : design.fashion_subcategories

          return {
            id: design.id,
            subcategory_id:
              relation?.id ?? '',
          }
        })
        .filter(
          (item) =>
            Boolean(item.subcategory_id),
        )

    setCategories(
      categoriesResult.data ?? [],
    )

    setSubCategories(
      normalizedSubCategories,
    )

    setDesignRelations(
      normalizedDesignRelations,
    )

    setLoading(false)
  }, [])

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void loadData()
  }, [loadData])

  /* =========================================================
     SERVICE COUNT
  ========================================================= */

  const getServiceCount = useCallback(
    (subcategoryId: string) => {
      return designRelations.filter(
        (item) =>
          item.subcategory_id ===
          subcategoryId,
      ).length
    },
    [designRelations],
  )

  /* =========================================================
     STATISTICS
  ========================================================= */

  const activeCount = useMemo(
    () =>
      subCategories.filter(
        (item) =>
          item.is_active,
      ).length,
    [subCategories],
  )

  const inactiveCount =
    subCategories.length -
    activeCount

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredSubCategories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return subCategories.filter(
        (subCategory) => {
          const categoryName =
            !subCategory.fashion_categories
              ? ''
              : Array.isArray(
                    subCategory.fashion_categories,
                  )
                ? (
                    subCategory
                      .fashion_categories[0]
                      ?.name ?? ''
                  )
                : subCategory
                    .fashion_categories
                    .name

          const matchesSearch =
            !query ||
            subCategory.name
              .toLowerCase()
              .includes(query) ||
            subCategory.slug
              .toLowerCase()
              .includes(query) ||
            (
              subCategory.description ??
              ''
            )
              .toLowerCase()
              .includes(query) ||
            categoryName
              .toLowerCase()
              .includes(query)

          const matchesCategory =
            categoryFilter === 'all' ||
            subCategory.category_id ===
              categoryFilter

          const matchesStatus =
            statusFilter === 'all' ||
            (
              statusFilter === 'active' &&
              subCategory.is_active
            ) ||
            (
              statusFilter === 'inactive' &&
              !subCategory.is_active
            )

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          )
        },
      )
    }, [
      subCategories,
      search,
      categoryFilter,
      statusFilter,
    ])

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredSubCategories.length /
          PAGE_SIZE,
      ),
    )

  const paginatedSubCategories =
    useMemo(() => {
      const start =
        (page - 1) *
        PAGE_SIZE

      return filteredSubCategories.slice(
        start,
        start + PAGE_SIZE,
      )
    }, [
      filteredSubCategories,
      page,
    ])

  useEffect(() => {
    setPage(1)
  }, [
    search,
    categoryFilter,
    statusFilter,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [
    page,
    totalPages,
  ])

  /* =========================================================
     STORAGE PATH
  ========================================================= */

  function getStoragePathFromUrl(
    url: string | null,
  ) {
    if (!url) {
      return null
    }

    const marker =
      '/storage/v1/object/public/fashion-images/'

    if (!url.includes(marker)) {
      return null
    }

    return url.split(marker)[1]
  }

  /* =========================================================
     DELETE SUBCATEGORY
  ========================================================= */

  async function deleteSubCategory() {
    if (
      !deleteId ||
      deleting
    ) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    const subCategory =
      subCategories.find(
        (item) =>
          item.id === deleteId,
      )

    if (!subCategory) {
      setDeleteId(null)
      setDeleting(false)
      return
    }

    const serviceCount =
      getServiceCount(deleteId)

    /* =======================================================
       PROTECT SUBCATEGORY WITH SERVICES
    ======================================================= */

    if (serviceCount > 0) {
      setError(
        `Cannot delete "${subCategory.name}" because it contains ${serviceCount} ${
          serviceCount === 1
            ? 'fashion service'
            : 'fashion services'
        }. Delete or move them first.`,
      )

      setDeleteId(null)
      setDeleting(false)

      return
    }

    /* =======================================================
       DELETE DATABASE RECORD
    ======================================================= */

    const {
      error: deleteError,
    } = await supabase
      .from('fashion_subcategories')
      .delete()
      .eq(
        'id',
        deleteId,
      )

    if (deleteError) {
      const message =
        deleteError.message.toLowerCase()

      if (
        message.includes(
          'foreign key',
        ) ||
        message.includes(
          'violates',
        ) ||
        message.includes(
          'constraint',
        ) ||
        message.includes(
          'fashion_designs',
        )
      ) {
        setError(
          `Unable to delete "${subCategory.name}" because it is still being used by a fashion service.`,
        )
      } else {
        setError(
          deleteError.message,
        )
      }

      setDeleting(false)

      return
    }

    /* =======================================================
       DELETE IMAGE FROM STORAGE
    ======================================================= */

    const storagePath =
      getStoragePathFromUrl(
        subCategory.image_url,
      )

    if (storagePath) {
      const {
        error: storageError,
      } =
        await supabase.storage
          .from(
            'fashion-images',
          )
          .remove([
            storagePath,
          ])

      if (storageError) {
        console.warn(
          'Subcategory deleted but image cleanup failed:',
          storageError.message,
        )
      }
    }

    /* =======================================================
       UPDATE LOCAL STATE
    ======================================================= */

    setSubCategories(
      (current) =>
        current.filter(
          (item) =>
            item.id !== deleteId,
        ),
    )

    setDesignRelations(
      (current) =>
        current.filter(
          (item) =>
            item.subcategory_id !==
            deleteId,
        ),
    )

    setDeleteId(null)
    setDeleting(false)

    setSuccess(
      'Fashion subcategory deleted successfully.',
    )
  }

  /* =========================================================
     CATEGORY NAME
  ========================================================= */

  function getCategoryName(
    subCategory: FashionSubCategory,
  ) {
    if (
      subCategory.fashion_categories
    ) {
      if (
        Array.isArray(
          subCategory.fashion_categories,
        )
      ) {
        return (
          subCategory
            .fashion_categories[0]
            ?.name ??
          'Unknown Category'
        )
      }

      return (
        subCategory
          .fashion_categories
          .name
      )
    }

    return 'Unknown Category'
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function viewCategory(
    categoryId: string,
  ) {
    navigate(
      `/admin/services/fashion/categories`,
    )

    void categoryId
  }

  function viewServices(
    subcategoryId: string,
  ) {
    navigate(
      `/admin/services/fashion/designs?subcategory=${encodeURIComponent(
        subcategoryId,
      )}`,
    )
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="fashion-subcategories-page">

        <div className="fashion-subcategories-loading">

          <div className="fashion-subcategories-spinner" />

          <span>
            Loading fashion subcategories...
          </span>

        </div>

      </main>
    )
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="fashion-subcategories-page">

      <div className="fashion-subcategories-shell">

        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          to="/admin/services/fashion"
          className="fashion-subcategories-back"
        >
          <span aria-hidden="true">
            ←
          </span>

          Back to fashion services
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="fashion-subcategories-header">

          <div className="fashion-subcategories-heading">

            <span className="fashion-subcategories-eyebrow">
              FASHION / CATALOGUE
            </span>

            <h1>
              Fashion Subcategories
            </h1>

            <p>
              Organize fashion services
              under their main customer
              categories.
            </p>

          </div>

          <div className="fashion-subcategories-actions">

            <button
              type="button"
              className="fashion-subcategories-secondary"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/categories',
                )
              }
            >
              View Main Categories
            </button>

            <button
              type="button"
              className="fashion-subcategories-secondary"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/designs',
                )
              }
            >
              View Fashion Services
            </button>

            <button
              type="button"
              className="fashion-subcategories-primary"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/subcategories/new',
                )
              }
            >
              + Add Subcategory
            </button>

          </div>

        </header>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section
          className="fashion-subcategories-stats"
          aria-label="Fashion subcategory statistics"
        >

          <article className="fashion-subcategory-stat">

            <span>
              Total Subcategories
            </span>

            <strong>
              {subCategories.length}
            </strong>

          </article>

          <article className="fashion-subcategory-stat active">

            <span>
              Active
            </span>

            <strong>
              {activeCount}
            </strong>

          </article>

          <article className="fashion-subcategory-stat inactive">

            <span>
              Inactive
            </span>

            <strong>
              {inactiveCount}
            </strong>

          </article>

          <article className="fashion-subcategory-stat">

            <span>
              Main Categories
            </span>

            <strong>
              {categories.length}
            </strong>

          </article>

        </section>

        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <div
            className="fashion-subcategory-alert error"
            role="alert"
          >

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              aria-label="Close error"
            >
              ×
            </button>

          </div>
        )}

        {success && (
          <div
            className="fashion-subcategory-alert success"
            role="status"
          >

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
              aria-label="Close success message"
            >
              ×
            </button>

          </div>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="fashion-subcategory-toolbar">

          <div className="fashion-subcategory-search">

            <span
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              placeholder="Search subcategories..."
              aria-label="Search subcategories"
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

            {search && (
              <button
                type="button"
                className="fashion-subcategory-search-clear"
                onClick={() =>
                  setSearch('')
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

          <select
            value={categoryFilter}
            aria-label="Filter by main category"
            onChange={(event) =>
              setCategoryFilter(
                event.target.value,
              )
            }
          >

            <option value="all">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}

          </select>

          <select
            value={statusFilter}
            aria-label="Filter by status"
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | 'active'
                  | 'inactive',
              )
            }
          >

            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

          </select>

        </section>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="fashion-subcategory-content">

          {paginatedSubCategories.length === 0 ? (

            <div className="fashion-subcategory-empty">

              <div className="fashion-subcategory-empty-icon">
                ◇
              </div>

              <h2>
                {search ||
                categoryFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'No matching subcategories'
                  : 'No subcategories yet'}
              </h2>

              <p>
                {search ||
                categoryFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'Try changing your search or filters.'
                  : 'Create your first subcategory to start building your fashion catalogue.'}
              </p>

              {search ||
              categoryFilter !== 'all' ||
              statusFilter !== 'all' ? (

                <button
                  type="button"
                  className="fashion-subcategories-secondary"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </button>

              ) : (

                <button
                  type="button"
                  className="fashion-subcategories-primary"
                  onClick={() =>
                    navigate(
                      '/admin/services/fashion/subcategories/new',
                    )
                  }
                >
                  + Add Subcategory
                </button>

              )}

            </div>

          ) : (

            <>

              <div className="fashion-subcategory-grid">

                {paginatedSubCategories.map(
                  (subCategory) => {

                    const serviceCount =
                      getServiceCount(
                        subCategory.id,
                      )

                    const categoryName =
                      getCategoryName(
                        subCategory,
                      )

                    return (
                      <article
                        className="fashion-subcategory-card"
                        key={
                          subCategory.id
                        }
                      >

                        {/* =================================================
                            IMAGE
                        ================================================= */}

                        <div className="fashion-subcategory-image">

                          {subCategory.image_url ? (

                            <img
                              src={
                                subCategory.image_url
                              }
                              alt={`${subCategory.name} fashion subcategory`}
                              loading="lazy"
                              decoding="async"
                            />

                          ) : (

                            <div className="fashion-subcategory-image-placeholder">

                              <span
                                aria-hidden="true"
                              >
                                {subCategory.name
                                  .charAt(0)
                                  .toUpperCase() ||
                                  'S'}
                              </span>

                              <small>
                                No image available
                              </small>

                            </div>

                          )}

                          <span
                            className={`fashion-subcategory-status ${
                              subCategory.is_active
                                ? 'active'
                                : 'inactive'
                            }`}
                          >

                            <span
                              className="fashion-subcategory-status-dot"
                              aria-hidden="true"
                            />

                            {subCategory.is_active
                              ? 'Active'
                              : 'Inactive'}

                          </span>

                        </div>

                        {/* =================================================
                            BODY
                        ================================================= */}

                        <div className="fashion-subcategory-card-body">

                          <div className="fashion-subcategory-heading">

                            <span className="fashion-subcategory-eyebrow">
                              FASHION SUBCATEGORY
                            </span>

                            <h2>
                              {subCategory.name}
                            </h2>

                            <p>
                              {subCategory.description ||
                                'Fashion services available under this subcategory.'}
                            </p>

                          </div>

                          {/* =================================================
                              SUMMARY
                          ================================================= */}

                          <div className="fashion-subcategory-summary">

                            <div className="fashion-subcategory-summary-item">

                              <span>
                                Main Category
                              </span>

                              <strong>
                                {categoryName}
                              </strong>

                            </div>

                            <div className="fashion-subcategory-summary-item">

                              <span>
                                Services
                              </span>

                              <strong>
                                {serviceCount}
                              </strong>

                            </div>

                          </div>

                          {/* =================================================
                              NAVIGATION
                          ================================================= */}

                          <div className="fashion-subcategory-links">

                            <button
                              type="button"
                              onClick={() =>
                                viewCategory(
                                  subCategory.category_id,
                                )
                              }
                            >
                              View Main Category

                              <span aria-hidden="true">
                                →
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                viewServices(
                                  subCategory.id,
                                )
                              }
                            >
                              View Fashion Services

                              <span aria-hidden="true">
                                →
                              </span>
                            </button>

                          </div>

                          {/* =================================================
                              ACTIONS
                          ================================================= */}

                          <div className="fashion-subcategory-card-actions">

                            <button
                              type="button"
                              className="fashion-subcategory-card-edit"
                              onClick={() =>
                                navigate(
                                  `/admin/services/fashion/subcategories/${subCategory.id}/edit`,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="fashion-subcategory-card-delete"
                              onClick={() =>
                                setDeleteId(
                                  subCategory.id,
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </div>

                      </article>
                    )
                  },
                )}

              </div>

              {/* =================================================
                  PAGINATION
              ================================================= */}

              <div className="fashion-subcategory-pagination">

                <span>
                  Showing{' '}
                  {filteredSubCategories.length ===
                  0
                    ? 0
                    : (page - 1) *
                        PAGE_SIZE +
                      1}{' '}
                  -{' '}
                  {Math.min(
                    page * PAGE_SIZE,
                    filteredSubCategories.length,
                  )}{' '}
                  of{' '}
                  {filteredSubCategories.length}
                </span>

                <div>

                  <button
                    type="button"
                    disabled={
                      page === 1
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          value - 1,
                      )
                    }
                  >
                    Previous
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1,
                  ).map(
                    (pageNumber) => (
                      <button
                        type="button"
                        key={
                          pageNumber
                        }
                        className={
                          page ===
                          pageNumber
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setPage(
                            pageNumber,
                          )
                        }
                      >
                        {pageNumber}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    disabled={
                      page ===
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (value) =>
                          value + 1,
                      )
                    }
                  >
                    Next
                  </button>

                </div>

              </div>

            </>

          )}

        </section>

      </div>

      {/* =========================================================
          DELETE MODAL
      ========================================================= */}

      {deleteId && (

        <div
          className="fashion-subcategory-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !deleting
            ) {
              setDeleteId(
                null,
              )
            }
          }}
        >

          <div
            className="fashion-subcategory-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-subcategory-title"
          >

            <div className="fashion-subcategory-modal-icon">
              !
            </div>

            <h2 id="delete-subcategory-title">
              Delete subcategory?
            </h2>

            <p>
              This action cannot be
              undone. A subcategory
              containing fashion
              services cannot be
              deleted.
            </p>

            <div className="fashion-subcategory-modal-actions">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    null,
                  )
                }
                disabled={
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={() =>
                  void deleteSubCategory()
                }
                disabled={
                  deleting
                }
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete Subcategory'}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}

export default AdminFashionSubCategories