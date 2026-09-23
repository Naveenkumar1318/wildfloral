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
import './AdminFashionCategories.css'

type FashionCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CategoryRelation = {
  category_id: string
}

type DesignRelation = {
  id: string
  category_id: string
}

const PAGE_SIZE = 8

function AdminFashionCategories() {
  const navigate = useNavigate()

  const [categories, setCategories] =
    useState<FashionCategory[]>([])

  const [subcategoryRelations, setSubcategoryRelations] =
    useState<CategoryRelation[]>([])

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

  const [statusFilter, setStatusFilter] =
    useState<
      'all' | 'active' | 'inactive'
    >('all')

  const [page, setPage] =
    useState(1)

  const [deleteId, setDeleteId] =
    useState<string | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  /*
   * =========================================================
   * LOAD DATA
   * =========================================================
   */

  const loadCategories = useCallback(
    async () => {
      setLoading(true)
      setError('')

      const [
        categoriesResult,
        subcategoriesResult,
        designsResult,
      ] = await Promise.all([
        supabase
          .from('fashion_categories')
          .select(`
            id,
            name,
            slug,
            description,
            image_url,
            is_active,
            created_at,
            updated_at
          `)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('fashion_subcategories')
          .select('category_id'),

        supabase
          .from('fashion_designs')
          .select(`
            id,
            fashion_subcategories!inner (
              id,
              category_id
            )
          `),
      ])

      /*
       * CATEGORY ERROR
       */

      if (categoriesResult.error) {
        setError(
          `Unable to load fashion categories: ${categoriesResult.error.message}`,
        )

        setCategories([])
        setSubcategoryRelations([])
        setDesignRelations([])
        setLoading(false)

        return
      }

      /*
       * SUBCATEGORY ERROR
       */

      if (subcategoriesResult.error) {
        setError(
          `Unable to load subcategory information: ${subcategoriesResult.error.message}`,
        )

        setCategories(
          (categoriesResult.data ??
            []) as FashionCategory[],
        )

        setSubcategoryRelations([])
        setDesignRelations([])
        setLoading(false)

        return
      }

      /*
       * DESIGN ERROR
       */

      if (designsResult.error) {
        setError(
          `Unable to load fashion service information: ${designsResult.error.message}`,
        )

        setCategories(
          (categoriesResult.data ??
            []) as FashionCategory[],
        )

        setSubcategoryRelations(
          (subcategoriesResult.data ??
            []) as CategoryRelation[],
        )

        setDesignRelations([])
        setLoading(false)

        return
      }

      /*
       * NORMALIZE DESIGN RELATIONS
       */

      const normalizedDesignRelations:
        DesignRelation[] =
        (designsResult.data ?? [])
          .map((design) => {
            const subcategory =
              Array.isArray(
                design.fashion_subcategories,
              )
                ? design.fashion_subcategories[0]
                : design.fashion_subcategories

            return {
              id: design.id,
              category_id:
                subcategory?.category_id ?? '',
            }
          })
          .filter(
            (item) =>
              Boolean(item.category_id),
          )

      setCategories(
        (categoriesResult.data ??
          []) as FashionCategory[],
      )

      setSubcategoryRelations(
        (subcategoriesResult.data ??
          []) as CategoryRelation[],
      )

      setDesignRelations(
        normalizedDesignRelations,
      )

      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  /*
   * =========================================================
   * COUNTS
   * =========================================================
   */

  const getSubcategoryCount =
    useCallback(
      (categoryId: string) => {
        return subcategoryRelations.filter(
          (item) =>
            item.category_id ===
            categoryId,
        ).length
      },
      [subcategoryRelations],
    )

  const getServiceCount =
    useCallback(
      (categoryId: string) => {
        return designRelations.filter(
          (item) =>
            item.category_id ===
            categoryId,
        ).length
      },
      [designRelations],
    )

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const activeCount =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.is_active,
        ).length,
      [categories],
    )

  const inactiveCount =
    categories.length -
    activeCount

  /*
   * =========================================================
   * FILTERING
   * =========================================================
   */

  const filteredCategories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

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
            category.description
              ?.toLowerCase()
              .includes(query)

          const matchesStatus =
            statusFilter === 'all' ||
            (
              statusFilter ===
                'active' &&
              category.is_active
            ) ||
            (
              statusFilter ===
                'inactive' &&
              !category.is_active
            )

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      categories,
      search,
      statusFilter,
    ])

  /*
   * =========================================================
   * PAGINATION
   * =========================================================
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCategories.length /
          PAGE_SIZE,
      ),
    )

  const paginatedCategories =
    useMemo(() => {
      const start =
        (page - 1) *
        PAGE_SIZE

      return filteredCategories.slice(
        start,
        start + PAGE_SIZE,
      )
    }, [
      filteredCategories,
      page,
    ])

  useEffect(() => {
    setPage(1)
  }, [
    search,
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

  /*
   * =========================================================
   * STORAGE PATH
   * =========================================================
   */

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

  /*
   * =========================================================
   * DELETE CATEGORY
   * =========================================================
   */

  async function deleteCategory() {
    if (
      !deleteId ||
      deleting
    ) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    const category =
      categories.find(
        (item) =>
          item.id === deleteId,
      )

    if (!category) {
      setDeleteId(null)
      setDeleting(false)
      return
    }

    const subcategoryCount =
      getSubcategoryCount(
        deleteId,
      )

    const serviceCount =
      getServiceCount(
        deleteId,
      )

    /*
     * NEVER DELETE CATEGORY
     * WITH CHILD RECORDS
     */

    if (
      subcategoryCount > 0
    ) {
      setError(
        `Cannot delete "${category.name}" because it contains ${subcategoryCount} ${
          subcategoryCount === 1
            ? 'subcategory'
            : 'subcategories'
        }. Delete or move them first.`,
      )

      setDeleteId(null)
      setDeleting(false)

      return
    }

    if (
      serviceCount > 0
    ) {
      setError(
        `Cannot delete "${category.name}" because it contains ${serviceCount} ${
          serviceCount === 1
            ? 'fashion service'
            : 'fashion services'
        }. Delete or move them first.`,
      )

      setDeleteId(null)
      setDeleting(false)

      return
    }

    /*
     * DELETE DATABASE RECORD
     */

    const {
      error: deleteError,
    } = await supabase
      .from('fashion_categories')
      .delete()
      .eq(
        'id',
        deleteId,
      )

    if (deleteError) {
      const message =
        deleteError.message
          .toLowerCase()

      if (
        message.includes(
          'foreign key',
        ) ||
        message.includes(
          'violates',
        ) ||
        message.includes(
          'constraint',
        )
      ) {
        setError(
          `Unable to delete "${category.name}" because it is still being used by another fashion record.`,
        )
      } else {
        setError(
          deleteError.message,
        )
      }

      setDeleting(false)

      return
    }

    /*
     * DELETE IMAGE FROM STORAGE
     */

    const storagePath =
      getStoragePathFromUrl(
        category.image_url,
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
          'Category deleted but image cleanup failed:',
          storageError.message,
        )
      }
    }

    /*
     * UPDATE LOCAL STATE
     */

    setCategories(
      (current) =>
        current.filter(
          (item) =>
            item.id !== deleteId,
        ),
    )

    setSubcategoryRelations(
      (current) =>
        current.filter(
          (item) =>
            item.category_id !==
            deleteId,
        ),
    )

    setDesignRelations(
      (current) =>
        current.filter(
          (item) =>
            item.category_id !==
            deleteId,
        ),
    )

    setDeleteId(null)
    setDeleting(false)

    setSuccess(
      'Fashion main category deleted successfully.',
    )
  }

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  function viewSubcategories(
    categoryId: string,
  ) {
    navigate(
      `/admin/services/fashion/subcategories?category=${encodeURIComponent(
        categoryId,
      )}`,
    )
  }

  function viewServices(
    categoryId: string,
  ) {
    navigate(
      `/admin/services/fashion/designs?category=${encodeURIComponent(
        categoryId,
      )}`,
    )
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main className="fashion-categories-page">
      <div className="fashion-categories-shell">

        {/* BACK */}

        <Link
          to="/admin/services/fashion"
          className="fashion-categories-back"
          aria-label="Go back"
        >
          <span aria-hidden="true">
            ←
          </span>

          Back to fashion services
        </Link>

        {/* HEADER */}

        <header className="fashion-categories-header">

          <div className="fashion-page-heading">

            <span className="fashion-section-eyebrow">
              FASHION / CATALOGUE
            </span>

            <h1>
              Fashion Main Categories
            </h1>

            <p>
              Organize your fashion catalogue
              into clear, customer-friendly
              categories.
            </p>

          </div>

          <div className="fashion-header-actions">

            <button
              type="button"
              className="fashion-secondary-button"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/subcategories',
                )
              }
            >
              View Subcategories
            </button>

            <button
              type="button"
              className="fashion-secondary-button"
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
              className="fashion-primary-button"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/categories/new',
                )
              }
            >
              + Add Main Category
            </button>

          </div>

        </header>

        {/* STATISTICS */}

        <section
          className="fashion-category-stats"
          aria-label="Fashion category statistics"
        >

          <div className="fashion-stat-card">

            <span>
              Total Main Categories
            </span>

            <strong>
              {categories.length}
            </strong>

          </div>

          <div className="fashion-stat-card active">

            <span>
              Active
            </span>

            <strong>
              {activeCount}
            </strong>

          </div>

          <div className="fashion-stat-card inactive">

            <span>
              Inactive
            </span>

            <strong>
              {inactiveCount}
            </strong>

          </div>

        </section>

        {/* ALERTS */}

        {error && (
          <div
            className="fashion-alert fashion-alert-error"
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
            className="fashion-alert fashion-alert-success"
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

        {/* TOOLBAR */}

        <section className="fashion-category-toolbar">

          <div className="fashion-search">

            <span
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              placeholder="Search categories..."
              aria-label="Search fashion categories"
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

          <select
            value={statusFilter}
            aria-label="Filter categories by status"
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
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

        {/* CONTENT */}

        <section className="fashion-category-content">

          {loading ? (
            <div className="fashion-empty-state">

              <div className="fashion-spinner" />

              <h2>
                Loading categories
              </h2>

              <p>
                Please wait while we load
                your fashion catalogue.
              </p>

            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="fashion-empty-state">

              <div
                className="fashion-empty-icon"
                aria-hidden="true"
              >
                ◇
              </div>

              <h2>
                {search ||
                statusFilter !== 'all'
                  ? 'No matching categories'
                  : 'No main categories yet'}
              </h2>

              <p>
                {search ||
                statusFilter !== 'all'
                  ? 'Try changing your search or status filter.'
                  : 'Create your first main category to start building your fashion catalogue.'}
              </p>

              {search ||
              statusFilter !== 'all' ? (
                <button
                  type="button"
                  className="fashion-secondary-button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter(
                      'all',
                    )
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="fashion-primary-button"
                  onClick={() =>
                    navigate(
                      '/admin/services/fashion/categories/new',
                    )
                  }
                >
                  + Add Main Category
                </button>
              )}

            </div>
          ) : (
            <>

              <div className="fashion-category-grid">

                {paginatedCategories.map(
                  (category) => {
                    const subcategoryCount =
                      getSubcategoryCount(
                        category.id,
                      )

                    const serviceCount =
                      getServiceCount(
                        category.id,
                      )

                    return (
                      <article
                        className="fashion-category-card"
                        key={category.id}
                      >

                        {/* IMAGE */}

                        <div className="fashion-category-image">

                          {category.image_url ? (
                            <img
                              src={
                                category.image_url
                              }
                              alt={`${category.name} fashion category`}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="fashion-image-placeholder">

                              <span
                                aria-hidden="true"
                              >
                                ◇
                              </span>

                              <small>
                                No image available
                              </small>

                            </div>
                          )}

                          <span
                            className={`fashion-status ${
                              category.is_active
                                ? 'active'
                                : 'inactive'
                            }`}
                          >

                            <span
                              className="fashion-status-dot"
                              aria-hidden="true"
                            />

                            {category.is_active
                              ? 'Active'
                              : 'Inactive'}

                          </span>

                        </div>

                        {/* BODY */}

                        <div className="fashion-category-card-body">

                          {/* CATEGORY NAME */}

                          <div className="fashion-category-heading">

                            <span className="fashion-category-eyebrow">
                              SERVICE CATEGORY
                            </span>

                            <h2>
                              {category.name}
                            </h2>

                            <p>
                              {category.description ||
                                'Fashion collection for this category.'}
                            </p>

                          </div>

                          {/* SUMMARY */}

                          <div className="fashion-category-summary">

                            <div className="fashion-summary-item">

                              <span>
                                Subcategories
                              </span>

                              <strong>
                                {subcategoryCount}
                              </strong>

                            </div>

                            <div className="fashion-summary-item">

                              <span>
                                Services
                              </span>

                              <strong>
                                {serviceCount}
                              </strong>

                            </div>

                          </div>

                          {/* NAVIGATION */}

                          <div className="fashion-category-links">

                            <button
                              type="button"
                              onClick={() =>
                                viewSubcategories(
                                  category.id,
                                )
                              }
                            >
                              View Subcategories

                              <span aria-hidden="true">
                                →
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                viewServices(
                                  category.id,
                                )
                              }
                            >
                              View Services

                              <span aria-hidden="true">
                                →
                              </span>
                            </button>

                          </div>

                          {/* ACTIONS */}

                          <div className="fashion-card-actions">

                            <button
                              type="button"
                              className="fashion-card-edit"
                              onClick={() =>
                                navigate(
                                  `/admin/services/fashion/categories/${category.id}/edit`,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="fashion-card-delete"
                              onClick={() =>
                                setDeleteId(
                                  category.id,
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

              {/* PAGINATION */}

              <div className="fashion-pagination">

                <span>
                  Showing{' '}
                  {filteredCategories.length ===
                  0
                    ? 0
                    : (page - 1) *
                        PAGE_SIZE +
                      1}{' '}
                  –{' '}
                  {Math.min(
                    page * PAGE_SIZE,
                    filteredCategories.length,
                  )}{' '}
                  of{' '}
                  {filteredCategories.length}
                </span>

                {totalPages > 1 && (
                  <div className="fashion-pagination-controls">

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
                          aria-current={
                            page ===
                            pageNumber
                              ? 'page'
                              : undefined
                          }
                          onClick={() =>
                            setPage(
                              pageNumber,
                            )
                          }
                        >
                          {
                            pageNumber
                          }
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
                )}

              </div>

            </>
          )}

        </section>

      </div>

      {/* DELETE MODAL */}

      {deleteId && (
        <div
          className="fashion-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !deleting
            ) {
              setDeleteId(null)
            }
          }}
        >

          <div
            className="fashion-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
          >

            <div
              className="fashion-confirm-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h2 id="delete-category-title">
              Delete main category?
            </h2>

            <p>
              This action cannot be undone.
              A category containing
              subcategories or fashion
              services cannot be deleted.
            </p>

            <div className="fashion-modal-actions">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={
                  deleteCategory
                }
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete Category'}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default AdminFashionCategories