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
import './AdminFashionDesigns.css'

type FashionCategory = {
  id: string
  name: string
  is_active: boolean
}

type FashionSubcategory = {
  id: string
  name: string
  category_id: string
  is_active: boolean
  fashion_categories:
    | FashionCategory
    | FashionCategory[]
    | null
}

type FashionDesignImage = {
  image_url: string
  is_primary: boolean
  display_order: number
}

type FashionDesignSize = {
  id: string
  size: string
  price: number
  stock_quantity: number
  is_active: boolean
}

type FashionDesign = {
  id: string
  subcategory_id: string
  name: string
  slug: string
  description: string
  is_active: boolean
  is_featured: boolean
  created_at: string

  fashion_subcategories:
    | FashionSubcategory
    | FashionSubcategory[]
    | null

  fashion_design_images: FashionDesignImage[]
  fashion_design_sizes: FashionDesignSize[]
}

const PAGE_SIZE = 8

function AdminFashionDesigns() {
  const navigate = useNavigate()

  const [designs, setDesigns] =
    useState<FashionDesign[]>([])

  const [categories, setCategories] =
    useState<FashionCategory[]>([])

  const [subcategories, setSubcategories] =
    useState<FashionSubcategory[]>([])

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

  const [subcategoryFilter, setSubcategoryFilter] =
    useState('all')

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

  const loadData = useCallback(
    async () => {
      setLoading(true)
      setError('')

      const [
        designsResult,
        categoriesResult,
        subcategoriesResult,
      ] = await Promise.all([
        supabase
          .from('fashion_designs')
          .select(`
            id,
            subcategory_id,
            name,
            slug,
            description,
            is_active,
            is_featured,
            created_at,

            fashion_subcategories (
              id,
              name,
              category_id,
              is_active,

              fashion_categories (
                id,
                name,
                is_active
              )
            ),

            fashion_design_images (
              image_url,
              is_primary,
              display_order
            ),

            fashion_design_sizes (
              id,
              size,
              price,
              stock_quantity,
              is_active
            )
          `)
          .order(
            'created_at',
            {
              ascending: false,
            },
          ),

        supabase
          .from('fashion_categories')
          .select(
            'id, name, is_active',
          )
          .order(
            'name',
            {
              ascending: true,
            },
          ),

        supabase
          .from('fashion_subcategories')
          .select(`
            id,
            name,
            category_id,
            is_active,

            fashion_categories (
              id,
              name,
              is_active
            )
          `)
          .order(
            'name',
            {
              ascending: true,
            },
          ),
      ])

      /*
       * =======================================================
       * DESIGNS
       * =======================================================
       */

      if (designsResult.error) {
        setError(
          designsResult.error.message,
        )

        setDesigns([])
      } else {
        const normalized =
          (designsResult.data ?? []).map(
            (design: any) => {
              const rawSubcategory =
                design.fashion_subcategories

              const subcategory =
                Array.isArray(
                  rawSubcategory,
                )
                  ? rawSubcategory[0] ??
                    null
                  : rawSubcategory ??
                    null

              let category =
                subcategory?.fashion_categories ??
                null

              if (Array.isArray(category)) {
                category =
                  category[0] ??
                  null
              }

              return {
                ...design,

                fashion_subcategories:
                  subcategory
                    ? {
                        ...subcategory,
                        fashion_categories:
                          category,
                      }
                    : null,

                fashion_design_images:
                  design.fashion_design_images ??
                  [],

                fashion_design_sizes:
                  design.fashion_design_sizes ??
                  [],
              }
            },
          ) as FashionDesign[]

        setDesigns(normalized)
      }

      /*
       * =======================================================
       * CATEGORIES
       * =======================================================
       */

      if (categoriesResult.error) {
        setError(
          categoriesResult.error.message,
        )

        setCategories([])
      } else {
        setCategories(
          categoriesResult.data ?? [],
        )
      }

      /*
       * =======================================================
       * SUBCATEGORIES
       * =======================================================
       */

      if (subcategoriesResult.error) {
        setError(
          subcategoriesResult.error.message,
        )

        setSubcategories([])
      } else {
        const normalized =
          (subcategoriesResult.data ?? []).map(
            (item: any) => ({
              ...item,

              fashion_categories:
                Array.isArray(
                  item.fashion_categories,
                )
                  ? item.fashion_categories[0] ??
                    null
                  : item.fashion_categories ??
                    null,
            }),
          ) as FashionSubcategory[]

        setSubcategories(
          normalized,
        )
      }

      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  /*
   * =========================================================
   * AVAILABLE SUBCATEGORIES
   * =========================================================
   */

  const availableSubcategories =
    useMemo(() => {
      if (
        categoryFilter === 'all'
      ) {
        return subcategories
      }

      return subcategories.filter(
        (subcategory) =>
          subcategory.category_id ===
          categoryFilter,
      )
    }, [
      subcategories,
      categoryFilter,
    ])

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredDesigns =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return designs.filter(
        (design) => {
          const rawSubcategory =
            design.fashion_subcategories

          const subcategory =
            Array.isArray(
              rawSubcategory,
            )
              ? rawSubcategory[0] ??
                null
              : rawSubcategory ??
                null

          const rawCategory =
            subcategory?.fashion_categories

          const category =
            Array.isArray(
              rawCategory,
            )
              ? rawCategory[0] ??
                null
              : rawCategory ??
                null

          const matchesSearch =
            !query ||
            design.name
              .toLowerCase()
              .includes(query) ||
            design.description
              .toLowerCase()
              .includes(query) ||
            design.slug
              .toLowerCase()
              .includes(query) ||
            subcategory?.name
              .toLowerCase()
              .includes(query) ||
            category?.name
              .toLowerCase()
              .includes(query)

          const matchesCategory =
            categoryFilter ===
              'all' ||
            category?.id ===
              categoryFilter

          const matchesSubcategory =
            subcategoryFilter ===
              'all' ||
            subcategory?.id ===
              subcategoryFilter

          const matchesStatus =
            statusFilter ===
              'all' ||
            (statusFilter ===
              'active' &&
              design.is_active) ||
            (statusFilter ===
              'inactive' &&
              !design.is_active)

          return (
            matchesSearch &&
            matchesCategory &&
            matchesSubcategory &&
            matchesStatus
          )
        },
      )
    }, [
      designs,
      search,
      categoryFilter,
      subcategoryFilter,
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
        filteredDesigns.length /
          PAGE_SIZE,
      ),
    )

  const paginatedDesigns =
    useMemo(() => {
      const start =
        (page - 1) *
        PAGE_SIZE

      return filteredDesigns.slice(
        start,
        start + PAGE_SIZE,
      )
    }, [
      filteredDesigns,
      page,
    ])

  useEffect(() => {
    setPage(1)
  }, [
    search,
    categoryFilter,
    subcategoryFilter,
    statusFilter,
  ])

  useEffect(() => {
    if (
      page >
      totalPages
    ) {
      setPage(totalPages)
    }
  }, [
    page,
    totalPages,
  ])

  /*
   * =========================================================
   * CATEGORY FILTER
   * =========================================================
   */

  function handleCategoryFilter(
    value: string,
  ) {
    setCategoryFilter(value)

    if (
      value === 'all'
    ) {
      setSubcategoryFilter(
        'all',
      )
      return
    }

    const validSubcategory =
      subcategories.some(
        (item) =>
          item.id ===
            subcategoryFilter &&
          item.category_id ===
            value,
      )

    if (!validSubcategory) {
      setSubcategoryFilter(
        'all',
      )
    }
  }

  /*
   * =========================================================
   * PRIMARY IMAGE
   * =========================================================
   */

  function getPrimaryImage(
    design: FashionDesign,
  ) {
    const sortedImages =
      [
        ...design.fashion_design_images,
      ].sort(
        (a, b) =>
          a.display_order -
          b.display_order,
      )

    return (
      sortedImages.find(
        (image) =>
          image.is_primary,
      )?.image_url ||
      sortedImages[0]
        ?.image_url ||
      ''
    )
  }

  /*
   * =========================================================
   * ACTIVE SIZE COUNT
   * =========================================================
   */

  function getActiveSizes(
  design: FashionDesign,
) {
  return design.fashion_design_sizes
    .filter(
      (size) =>
        size.is_active,
    )
    .sort((a, b) =>
      a.size.localeCompare(
        b.size,
        undefined,
        {
          numeric: true,
          sensitivity: 'base',
        },
      ),
    )
}

  /*
   * =========================================================
   * STORAGE PATH
   * =========================================================
   */

  function getStoragePathFromUrl(
    url: string,
  ) {
    const marker =
      '/storage/v1/object/public/fashion-images/'

    if (
      !url.includes(marker)
    ) {
      return null
    }

    return url.split(
      marker,
    )[1]
  }

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  async function deleteDesign() {
    if (
      !deleteId ||
      deleting
    ) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    const design =
      designs.find(
        (item) =>
          item.id ===
          deleteId,
      )

    if (!design) {
      setDeleteId(null)
      setDeleting(false)
      return
    }

    const imagePaths =
      design.fashion_design_images
        .map(
          (image) =>
            getStoragePathFromUrl(
              image.image_url,
            ),
        )
        .filter(
          Boolean,
        ) as string[]

    const {
      error: deleteError,
    } = await supabase
      .from('fashion_designs')
      .delete()
      .eq(
        'id',
        deleteId,
      )

    if (deleteError) {
      setError(
        deleteError.message,
      )

      setDeleting(false)
      return
    }

    /*
     * Remove images from storage
     */

    if (
      imagePaths.length
    ) {
      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from(
            'fashion-images',
          )
          .remove(
            imagePaths,
          )

      if (storageError) {
        console.warn(
          'Fashion service deleted but image cleanup failed:',
          storageError.message,
        )
      }
    }

    /*
     * Update local state
     */

    setDesigns(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            deleteId,
        ),
    )

    setDeleteId(null)
    setDeleting(false)

    setSuccess(
      'Fashion service deleted successfully.',
    )
  }

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const totalActive =
    designs.filter(
      (design) =>
        design.is_active,
    ).length

  const totalInactive =
    designs.length -
    totalActive

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="fashion-designs-page">
        <div className="fashion-design-loading">
          <div className="fashion-design-spinner" />

          <p>
            Loading fashion services...
          </p>
        </div>
      </main>
    )
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main className="fashion-designs-page">
      <div className="fashion-designs-shell">

        {/* ===================================================
            BACK
        =================================================== */}

        <Link
          to="/admin"
          className="fashion-designs-back"
        >
          ← Back to Dashboard
        </Link>

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="fashion-designs-header">

          <div className="fashion-design-heading">

            <span className="fashion-design-eyebrow">
              FASHION / CATALOGUE
            </span>

            <h1>
              Fashion Services
            </h1>

            <p>
              Manage your fashion
              services across main
              categories and
              subcategories.
            </p>

          </div>

          <div className="fashion-design-header-actions">

            <button
              type="button"
              className="fashion-design-secondary"
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
              className="fashion-design-secondary"
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
              className="fashion-design-primary"
              onClick={() =>
                navigate(
                  '/admin/services/fashion/designs/new',
                )
              }
            >
              + Add Fashion Service
            </button>

          </div>

        </header>

        {/* ===================================================
            STATS
        =================================================== */}

        <section className="fashion-design-stats">

          <article className="fashion-design-stat">
            <span>
              Total Services
            </span>

            <strong>
              {designs.length}
            </strong>
          </article>

          <article className="fashion-design-stat active">
            <span>
              Active
            </span>

            <strong>
              {totalActive}
            </strong>
          </article>

          <article className="fashion-design-stat inactive">
            <span>
              Inactive
            </span>

            <strong>
              {totalInactive}
            </strong>
          </article>

          <article className="fashion-design-stat">
            <span>
              Subcategories
            </span>

            <strong>
              {subcategories.length}
            </strong>
          </article>

        </section>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="fashion-design-alert error">
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
          <div className="fashion-design-alert success">
            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
              aria-label="Close success"
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            FILTERS
        =================================================== */}

        <section className="fashion-design-toolbar">

          <div className="fashion-design-search">

            <span>
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search fashion services..."
              aria-label="Search fashion services"
            />

          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              handleCategoryFilter(
                event.target.value,
              )
            }
            aria-label="Filter by main category"
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
            value={subcategoryFilter}
            onChange={(event) =>
              setSubcategoryFilter(
                event.target.value,
              )
            }
            aria-label="Filter by subcategory"
          >
            <option value="all">
              All Subcategories
            </option>

            {availableSubcategories.map(
              (subcategory) => (
                <option
                  key={
                    subcategory.id
                  }
                  value={
                    subcategory.id
                  }
                >
                  {subcategory.name}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | 'active'
                  | 'inactive',
              )
            }
            aria-label="Filter by status"
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

        {/* ===================================================
            TABLE
        =================================================== */}

        <section className="fashion-design-table-card">

          {paginatedDesigns.length ===
          0 ? (
            <div className="fashion-design-empty">

              <div className="fashion-design-empty-icon">
                ◇
              </div>

              <h2>
                No fashion services found
              </h2>

              <p>
                Create a fashion
                service inside a
                subcategory to build
                your catalogue.
              </p>

              <button
                type="button"
                className="fashion-design-primary"
                onClick={() =>
                  navigate(
                    '/admin/services/fashion/designs/new',
                  )
                }
              >
                + Add Fashion Service
              </button>

            </div>
          ) : (
            <>

              <div className="fashion-design-table-wrapper">

                <table className="fashion-design-table">

                  <thead>
                    <tr>

                      <th>
                        SERVICE
                      </th>

                      <th>
                        MAIN CATEGORY
                      </th>

                      <th>
                        SUB CATEGORY
                      </th>

                      <th>
                        SIZE / STOCK
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

                    {paginatedDesigns.map(
                      (design) => {
                        const image =
                          getPrimaryImage(
                            design,
                          )

                        const rawSubcategory =
                          design.fashion_subcategories

                        const subcategory =
                          Array.isArray(
                            rawSubcategory,
                          )
                            ? rawSubcategory[0] ??
                              null
                            : rawSubcategory ??
                              null

                        const rawCategory =
                          subcategory?.fashion_categories

                        const category =
                          Array.isArray(
                            rawCategory,
                          )
                            ? rawCategory[0] ??
                              null
                            : rawCategory ??
                              null

                        const activeSizes =
                            getActiveSizes(
                              design,
                            )

                        return (
                          <tr
                            key={
                              design.id
                            }
                          >

                            {/* SERVICE */}

                            <td>
                              <div className="fashion-table-service">

                                <div className="fashion-table-image">

                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt={
                                        design.name
                                      }
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : (
                                    <div className="fashion-table-image-placeholder">
                                      ◇
                                    </div>
                                  )}

                                </div>

                                <div className="fashion-table-service-info">

                                  <strong>
                                    {
                                      design.name
                                    }
                                  </strong>

                                  <span>
                                    {design.description ||
                                      'No description added.'}
                                  </span>

                                </div>

                              </div>
                            </td>

                            {/* MAIN CATEGORY */}

                            <td>
                              <span className="fashion-table-category">
                                {
                                  category?.name ||
                                  'Uncategorized'
                                }
                              </span>
                            </td>

                            {/* SUB CATEGORY */}

                            <td>
                              <span className="fashion-table-subcategory">
                                {
                                  subcategory?.name ||
                                  'Uncategorized'
                                }
                              </span>
                            </td>

                            {/* SIZE / STOCK */}

<td>
  <div className="fashion-table-stock-list">
    {activeSizes.length > 0 ? (
      activeSizes.map((size, index) => (
        <span
          key={size.id}
          className="fashion-table-stock-item"
        >
          <span className="fashion-table-stock-size">
            {size.size}
          </span>

          <span
            className={`fashion-table-stock-quantity ${
              Number(size.stock_quantity) === 0
                ? 'out'
                : Number(size.stock_quantity) <= 5
                  ? 'low'
                  : ''
            }`}
          >
            {Number(size.stock_quantity)}
          </span>

          {index < activeSizes.length - 1 && (
            <span className="fashion-table-stock-separator">
              ,
            </span>
          )}
        </span>
      ))
    ) : (
      <span className="fashion-table-no-stock">
        No active sizes
      </span>
    )}
  </div>
</td>
                            {/* STATUS */}

                            <td>
                              <span
                                className={`fashion-table-status ${
                                  design.is_active
                                    ? 'active'
                                    : 'inactive'
                                }`}
                              >
                                <i />

                                {design.is_active
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td>
                              <div className="fashion-table-actions">

                                <button
                                  type="button"
                                  className="fashion-table-edit"
                                  onClick={() =>
                                    navigate(
                                      `/admin/services/fashion/designs/${design.id}/edit`,
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="fashion-table-delete"
                                  onClick={() =>
                                    setDeleteId(
                                      design.id,
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

              {/* =================================================
                  PAGINATION
              ================================================= */}

              <div className="fashion-design-pagination">

                <span>
                  Showing{' '}
                  {filteredDesigns.length ===
                  0
                    ? 0
                    : (page - 1) *
                        PAGE_SIZE +
                      1}{' '}
                  -{' '}
                  {Math.min(
                    page *
                      PAGE_SIZE,
                    filteredDesigns.length,
                  )}{' '}
                  of{' '}
                  {
                    filteredDesigns.length
                  }
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
                    (
                      pageNumber,
                    ) => (
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

              </div>

            </>
          )}

        </section>

      </div>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deleteId && (
        <div
          className="fashion-design-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!deleting) {
                setDeleteId(null)
              }
            }
          }}
        >

          <div
            className="fashion-design-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-fashion-service-title"
          >

            <div className="fashion-design-modal-icon">
              !
            </div>

            <h2 id="delete-fashion-service-title">
              Delete fashion service?
            </h2>

            <p>
              This action cannot be
              undone. The service,
              its size records and
              image records will be
              deleted.
            </p>

            <div className="fashion-design-modal-actions">

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
                onClick={() =>
                  void deleteDesign()
                }
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete Service'}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default AdminFashionDesigns