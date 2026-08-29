import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import './AdminBeautyServices.css'
import { supabase } from '../../../lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
}

type Service = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  description: string
  price: number
  durationMinutes: number
  image: string
  isActive: boolean
}

type ServiceForm = {
  name: string
  categoryId: string
  description: string
  price: string
  duration: string
  image: string
  isActive: boolean
}

type CategoryForm = {
  name: string
  description: string
}

type ServiceRow = {
  id: string
  name: string
  category_id: string | null
  category: string | null
  description: string
  price: number
  duration_minutes: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

const ITEMS_PER_PAGE = 10

const emptyServiceForm: ServiceForm = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  duration: '',
  image: '',
  isActive: true,
}

const emptyCategoryForm: CategoryForm = {
  name: '',
  description: '',
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.is_active,
  }
}

function mapService(
  row: ServiceRow,
  categories: Category[],
): Service {
  const category = categories.find(
    (item) => item.id === row.category_id,
  )

  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? '',
    categoryName:
      row.category ?? category?.name ?? 'Uncategorized',
    description: row.description ?? '',
    price: Number(row.price),
    durationMinutes: Number(row.duration_minutes),
    image: row.image_url ?? '',
    isActive: row.is_active,
  }
}

function getStoragePathFromUrl(url: string) {
  const marker = '/storage/v1/object/public/service-images/'
  const index = url.indexOf(marker)

  if (index === -1) {
    return null
  }

  return decodeURIComponent(
    url.slice(index + marker.length),
  )
}

type PaginationProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  label: string
  onPageChange: (page: number) => void
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  label,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const startItem =
    (currentPage - 1) * itemsPerPage + 1

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems,
  )

  return (
    <nav
      className="admin-pagination"
      aria-label={`${label} pagination`}
    >
      <span className="admin-pagination-summary">
        Showing <strong>{startItem}</strong>–
        <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> {label}
      </span>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-pagination-button"
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          disabled={currentPage === 1}
          aria-label={`Previous ${label} page`}
        >
          ←
        </button>

        <div className="admin-pagination-pages">
          {Array.from(
            { length: totalPages },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              type="button"
              className={
                page === currentPage
                  ? 'admin-pagination-page active'
                  : 'admin-pagination-page'
              }
              onClick={() => onPageChange(page)}
              aria-current={
                page === currentPage
                  ? 'page'
                  : undefined
              }
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="admin-pagination-button"
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          disabled={currentPage === totalPages}
          aria-label={`Next ${label} page`}
        >
          →
        </button>
      </div>
    </nav>
  )
}

function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [categoryPage, setCategoryPage] = useState(1)
  const [servicePage, setServicePage] = useState(1)

  const [isServiceModalOpen, setIsServiceModalOpen] =
    useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] =
    useState(false)

  const [categoryOpenedFromService, setCategoryOpenedFromService] =
    useState(false)

  const [editingService, setEditingService] =
    useState<Service | null>(null)

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null)

  const [serviceForm, setServiceForm] =
    useState<ServiceForm>(emptyServiceForm)

  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(emptyCategoryForm)

  const [selectedImageFile, setSelectedImageFile] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] = useState('')

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    const [
      { data: categoryData, error: categoryFetchError },
      { data: serviceData, error: serviceFetchError },
    ] = await Promise.all([
      supabase
        .from('service_categories')
        .select('*')
        .order('name', { ascending: true }),

      supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (categoryFetchError) {
      setError(categoryFetchError.message)
      setLoading(false)
      return
    }

    if (serviceFetchError) {
      setError(serviceFetchError.message)
      setLoading(false)
      return
    }

    const mappedCategories = (
      (categoryData ?? []) as CategoryRow[]
    ).map(mapCategory)

    const mappedServices = (
      (serviceData ?? []) as ServiceRow[]
    ).map((row) =>
      mapService(row, mappedCategories),
    )

    setCategories(mappedCategories)
    setServices(mappedServices)
    setLoading(false)
  }

  const activeCategories = useMemo(
    () => categories.filter((item) => item.isActive),
    [categories],
  )

  const serviceCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {}

    services.forEach((service) => {
      if (!service.categoryId) return

      counts[service.categoryId] =
        (counts[service.categoryId] ?? 0) + 1
    })

    return counts
  }, [services])

  const filteredServices = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return services.filter((service) => {
      const matchesSearch =
        !searchValue ||
        service.name.toLowerCase().includes(searchValue) ||
        service.description.toLowerCase().includes(searchValue) ||
        service.categoryName.toLowerCase().includes(searchValue)

      const matchesCategory =
        categoryFilter === 'All' ||
        service.categoryId === categoryFilter

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && service.isActive) ||
        (statusFilter === 'Inactive' && !service.isActive)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [
    services,
    search,
    categoryFilter,
    statusFilter,
  ])

  const categoryTotalPages = Math.max(
    1,
    Math.ceil(categories.length / ITEMS_PER_PAGE),
  )

  const serviceTotalPages = Math.max(
    1,
    Math.ceil(
      filteredServices.length / ITEMS_PER_PAGE,
    ),
  )

  const paginatedCategories = useMemo(() => {
    const start =
      (categoryPage - 1) * ITEMS_PER_PAGE

    return categories.slice(
      start,
      start + ITEMS_PER_PAGE,
    )
  }, [categories, categoryPage])

  const paginatedServices = useMemo(() => {
    const start =
      (servicePage - 1) * ITEMS_PER_PAGE

    return filteredServices.slice(
      start,
      start + ITEMS_PER_PAGE,
    )
  }, [filteredServices, servicePage])

  useEffect(() => {
    setCategoryPage((current) =>
      Math.min(current, categoryTotalPages),
    )
  }, [categoryTotalPages])

  useEffect(() => {
    setServicePage((current) =>
      Math.min(current, serviceTotalPages),
    )
  }, [serviceTotalPages])

  useEffect(() => {
    setServicePage(1)
  }, [search, categoryFilter, statusFilter])

  const activeServiceCount = services.filter(
    (service) => service.isActive,
  ).length

  function openAddServiceModal() {
    setEditingService(null)

    setServiceForm({
      ...emptyServiceForm,
      categoryId: activeCategories[0]?.id ?? '',
    })

    setSelectedImageFile(null)
    setImagePreview('')
    setError('')
    setIsServiceModalOpen(true)
  }

  function openEditServiceModal(service: Service) {
    setEditingService(service)

    setServiceForm({
      name: service.name,
      categoryId: service.categoryId,
      description: service.description,
      price: String(service.price),
      duration: String(service.durationMinutes),
      image: service.image,
      isActive: service.isActive,
    })

    setSelectedImageFile(null)
    setImagePreview(service.image)
    setError('')
    setIsServiceModalOpen(true)
  }

  function closeServiceModal() {
    if (saving) return

    setIsServiceModalOpen(false)
    setEditingService(null)
    setServiceForm(emptyServiceForm)
    setSelectedImageFile(null)
    setImagePreview('')
    setError('')

    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  function openCategoryModal(fromService = false) {
    setEditingCategory(null)
    setCategoryForm(emptyCategoryForm)
    setCategoryError('')
    setCategoryOpenedFromService(fromService)
    setIsCategoryModalOpen(true)
  }

  function openEditCategoryModal(category: Category) {
    setEditingCategory(category)

    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
    })

    setCategoryError('')
    setCategoryOpenedFromService(false)
    setIsCategoryModalOpen(true)
  }

  function closeCategoryModal() {
    if (savingCategory) return

    setIsCategoryModalOpen(false)
    setEditingCategory(null)
    setCategoryForm(emptyCategoryForm)
    setCategoryError('')
    setCategoryOpenedFromService(false)
  }

  function handleServiceFormChange(
    field: keyof ServiceForm,
    value: string | boolean,
  ) {
    setServiceForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleImageSelect(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }

    setError('')
    setSelectedImageFile(file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  async function uploadServiceImage(file: File) {
    const extension =
      file.name.split('.').pop()?.toLowerCase() ?? 'jpg'

    const filePath =
      `services/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}`,
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleServiceSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const price = Number(serviceForm.price)
    const duration = Number(serviceForm.duration)

    if (!serviceForm.name.trim()) {
      setError('Service name is required.')
      return
    }

    if (!serviceForm.categoryId) {
      setError('Please select a category.')
      return
    }

    if (!serviceForm.description.trim()) {
      setError('Description is required.')
      return
    }

    if (
      !serviceForm.price ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setError('Enter a valid price.')
      return
    }

    if (
      !serviceForm.duration ||
      Number.isNaN(duration) ||
      duration <= 0
    ) {
      setError('Enter a valid duration.')
      return
    }

    if (!editingService && !selectedImageFile) {
      setError('Please upload a service image.')
      return
    }

    setSaving(true)

    let uploadedImageUrl = serviceForm.image
    let newImagePath: string | null = null

    try {
      if (selectedImageFile) {
        uploadedImageUrl =
          await uploadServiceImage(selectedImageFile)

        newImagePath =
          getStoragePathFromUrl(uploadedImageUrl)
      }

      const selectedCategory = activeCategories.find(
        (category) => category.id === serviceForm.categoryId,
      )

      if (!selectedCategory) {
        throw new Error(
          'The selected category is no longer available. Please select another category.',
        )
      }

      const serviceData = {
        name: serviceForm.name.trim(),
        category_id: selectedCategory.id,
        category: selectedCategory.name,
        description: serviceForm.description.trim(),
        price,
        duration_minutes: duration,
        image_url: uploadedImageUrl.trim() || null,
        is_active: serviceForm.isActive,
      }

      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (updateError) {
          if (newImagePath) {
            await supabase.storage
              .from('service-images')
              .remove([newImagePath])
          }

          throw new Error(updateError.message)
        }

        if (
          selectedImageFile &&
          editingService.image
        ) {
          const oldImagePath =
            getStoragePathFromUrl(editingService.image)

          if (oldImagePath) {
            await supabase.storage
              .from('service-images')
              .remove([oldImagePath])
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData)

        if (insertError) {
          if (newImagePath) {
            await supabase.storage
              .from('service-images')
              .remove([newImagePath])
          }

          throw new Error(insertError.message)
        }
      }

      await loadData()
      closeServiceModal()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong while saving the service.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteService(service: Service) {
    const confirmed = window.confirm(
      `Delete "${service.name}"?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    setError('')

    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', service.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (service.image) {
      const imagePath =
        getStoragePathFromUrl(service.image)

      if (imagePath) {
        await supabase.storage
          .from('service-images')
          .remove([imagePath])
      }
    }

    setServices((current) =>
      current.filter((item) => item.id !== service.id),
    )
  }

  async function handleToggleService(service: Service) {
    setError('')

    const nextStatus = !service.isActive

    const { error: updateError } = await supabase
      .from('services')
      .update({
        is_active: nextStatus,
      })
      .eq('id', service.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? {
              ...item,
              isActive: nextStatus,
            }
          : item,
      ),
    )
  }

  async function handleCategorySubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setCategoryError('')

    const name = categoryForm.name.trim()
    const slug = createSlug(name)

    if (!name) {
      setCategoryError('Category name is required.')
      return
    }

    if (!slug) {
      setCategoryError('Enter a valid category name.')
      return
    }

    setSavingCategory(true)

    try {
      if (editingCategory) {
        const { data, error: updateError } =
          await supabase
            .from('service_categories')
            .update({
              name,
              slug,
              description:
                categoryForm.description.trim() || null,
            })
            .eq('id', editingCategory.id)
            .select('*')
            .single()

        if (updateError) {
          const message =
            updateError.message.toLowerCase()

          setCategoryError(
            message.includes('duplicate') ||
              message.includes('unique')
              ? 'Another category already uses this name.'
              : updateError.message,
          )

          return
        }

        const { error: serviceCategorySyncError } =
          await supabase
            .from('services')
            .update({
              category: name,
            })
            .eq('category_id', editingCategory.id)

        if (serviceCategorySyncError) {
          setCategoryError(
            `Category was renamed, but related services could not be synchronised: ${serviceCategorySyncError.message}`,
          )
          await loadData()
          return
        }

        const updatedCategory = mapCategory(
          data as CategoryRow,
        )

        setCategories((current) =>
          current
            .map((category) =>
              category.id === updatedCategory.id
                ? updatedCategory
                : category,
            )
            .sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
        )

        setServices((current) =>
          current.map((service) =>
            service.categoryId === editingCategory.id
              ? {
                  ...service,
                  categoryName: name,
                }
              : service,
          ),
        )

        setIsCategoryModalOpen(false)
        setEditingCategory(null)
        setCategoryForm(emptyCategoryForm)
        setCategoryError('')

        return
      }

      const { data, error: insertError } =
        await supabase
          .from('service_categories')
          .insert({
            name,
            slug,
            description:
              categoryForm.description.trim() || null,
            is_active: true,
          })
          .select('*')
          .single()

      if (insertError) {
        const message =
          insertError.message.toLowerCase()

        setCategoryError(
          message.includes('duplicate') ||
            message.includes('unique')
            ? 'This category already exists.'
            : insertError.message,
        )

        return
      }

      const newCategory = mapCategory(
        data as CategoryRow,
      )

      setCategories((current) =>
        [...current, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      )

      if (categoryOpenedFromService) {
        setServiceForm((current) => ({
          ...current,
          categoryId: newCategory.id,
        }))
      }

      setIsCategoryModalOpen(false)
      setEditingCategory(null)
      setCategoryForm(emptyCategoryForm)
      setCategoryError('')
      setCategoryOpenedFromService(false)
    } catch (categorySaveError) {
      setCategoryError(
        categorySaveError instanceof Error
          ? categorySaveError.message
          : 'Unable to save category.',
      )
    } finally {
      setSavingCategory(false)
    }
  }

  async function handleDeleteCategory(
    category: Category,
  ) {
    setCategoryError('')

    const serviceCount =
      serviceCountByCategory[category.id] ?? 0

    if (serviceCount > 0) {
      setCategoryError(
        `Cannot delete "${category.name}" because it contains ${serviceCount} ${
          serviceCount === 1
            ? 'service'
            : 'services'
        }. Delete or move those services first.`,
      )

      return
    }

    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nThis category has no services and can be safely removed.\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    setSavingCategory(true)

    try {
      const { error: deleteError } =
        await supabase
          .from('service_categories')
          .delete()
          .eq('id', category.id)

      if (deleteError) {
        setCategoryError(deleteError.message)
        return
      }

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id,
        ),
      )

      if (categoryFilter === category.id) {
        setCategoryFilter('All')
      }
    } catch (categoryDeleteError) {
      setCategoryError(
        categoryDeleteError instanceof Error
          ? categoryDeleteError.message
          : 'Unable to delete category.',
      )
    } finally {
      setSavingCategory(false)
    }
  }

  return (
    <main className="admin-services-page">
      <div className="admin-services-shell">
        <header className="admin-services-header">
          <div className="admin-services-heading">
            <span className="admin-eyebrow">
              WILDFLORAL · ADMINISTRATION
            </span>

            <h1>Services</h1>

            <p>
              Build and manage the beauty and fashion
              experiences your clients can discover and book.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => openCategoryModal(false)}
            >
              <span>+</span>
              New Category
            </button>

            <button
              type="button"
              className="admin-primary-button"
              onClick={openAddServiceModal}
              disabled={activeCategories.length === 0}
              title={
                activeCategories.length === 0
                  ? 'Create a category first'
                  : 'Create a new service'
              }
            >
              <span>+</span>
              Add Service
            </button>
          </div>
        </header>

        {error && !isServiceModalOpen && (
          <div className="admin-form-error" role="alert">
            <strong>Something needs attention.</strong>
            <span>{error}</span>
          </div>
        )}

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Catalogue</span>
            <strong>{services.length}</strong>
            <small>Total services</small>
          </article>

          <article className="admin-stat-card featured">
            <span>Published</span>
            <strong>{activeServiceCount}</strong>
            <small>Visible to clients</small>
          </article>

          <article className="admin-stat-card">
            <span>Categories</span>
            <strong>{activeCategories.length}</strong>
            <small>Active categories</small>
          </article>

          <article className="admin-stat-card">
            <span>Filtered</span>
            <strong>{filteredServices.length}</strong>
            <small>Current view</small>
          </article>
        </section>

        <section className="admin-category-panel">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">
                CATALOGUE STRUCTURE
              </span>

              <div className="admin-category-title-row">
                <h2>Categories</h2>
                <span className="admin-category-total">
                  {categories.length} total
                </span>
              </div>

              <p>
                Keep your service catalogue organised with
                simple admin-only categories.
              </p>
            </div>

            <button
              type="button"
              className="admin-outline-button"
              onClick={() => openCategoryModal(false)}
            >
              <span>+</span>
              New Category
            </button>
          </div>

          {categoryError && !isCategoryModalOpen && (
            <div
              className="admin-form-error category-panel-error"
              role="alert"
            >
              <strong>Category action failed.</strong>
              <span>{categoryError}</span>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="admin-category-empty">
              <div className="admin-category-empty-icon">
                +
              </div>

              <div>
                <h3>Create your first category</h3>
                <p>
                  Start with Nails, Hair, Makeup, Bridal,
                  Skin Care or any category that matches
                  your business.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => openCategoryModal(false)}
              >
                Create Category
              </button>
            </div>
          ) : (
            <>
            <div
              className="admin-category-rail"
              aria-label="Service categories"
            >
              {paginatedCategories.map((item) => {
                const serviceCount =
                  serviceCountByCategory[item.id] ?? 0

                return (
                  <article
                    className={
                      categoryFilter === item.id
                        ? 'admin-category-card selected'
                        : 'admin-category-card'
                    }
                    key={item.id}
                  >
                    <button
                      type="button"
                      className="admin-category-main"
                      onClick={() =>
                        setCategoryFilter(
                          categoryFilter === item.id
                            ? 'All'
                            : item.id,
                        )
                      }
                    >
                      <span className="admin-category-mark">
                        {item.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="admin-category-main-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {serviceCount}{' '}
                          {serviceCount === 1
                            ? 'service'
                            : 'services'}
                        </small>
                      </span>

                      <span
                        className={
                          item.isActive
                            ? 'admin-category-dot active'
                            : 'admin-category-dot'
                        }
                        title={
                          item.isActive
                            ? 'Active'
                            : 'Hidden'
                        }
                      />
                    </button>

                    <div className="admin-category-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openEditCategoryModal(item)
                        }
                        disabled={savingCategory}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          void handleDeleteCategory(item)
                        }
                        disabled={savingCategory}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {categories.length > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={categoryPage}
                totalPages={categoryTotalPages}
                totalItems={categories.length}
                itemsPerPage={ITEMS_PER_PAGE}
                label="categories"
                onPageChange={setCategoryPage}
              />
            )}
            </>
          )}
        </section>

        <section className="admin-catalogue-panel">
          <div className="admin-catalogue-heading">
            <div>
              <span className="admin-section-kicker">
                SERVICE CATALOGUE
              </span>

              <h2>Manage experiences</h2>
            </div>

            <span className="admin-catalogue-count">
              {filteredServices.length} shown
            </span>
          </div>

          <div className="admin-services-toolbar">
            <div className="admin-search">
              <label htmlFor="service-search">
                Search
              </label>

              <div className="admin-search-input">
                <span aria-hidden="true">⌕</span>

                <input
                  id="service-search"
                  type="search"
                  placeholder="Search by service or category..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="admin-filter">
              <label htmlFor="service-category-filter">
                Category
              </label>

              <select
                id="service-category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
              >
                <option value="All">
                  All categories
                </option>

                {activeCategories.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-filter">
              <label htmlFor="service-status-filter">
                Status
              </label>

              <select
                id="service-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">
                  All statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="admin-services-empty loading">
              <div className="admin-loading-orb" />

              <h2>Preparing your catalogue</h2>

              <p>
                Fetching services and categories...
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="admin-services-empty">
              <span className="admin-empty-kicker">
                SERVICE CATALOGUE
              </span>

              <h2>
                {services.length === 0
                  ? 'Your catalogue is ready to begin'
                  : 'No services match your filters'}
              </h2>

              <p>
                {services.length === 0
                  ? activeCategories.length === 0
                    ? 'Create your first category, then add a service to it.'
                    : 'Create your first service and make it available to your clients.'
                  : 'Try a different search or reset the current filters.'}
              </p>

              {services.length === 0 &&
              activeCategories.length > 0 ? (
                <button
                  type="button"
                  onClick={openAddServiceModal}
                >
                  Add First Service
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('All')
                    setStatusFilter('All')
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="admin-services-table-wrapper">
              <table className="admin-services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {paginatedServices.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="admin-service-info">
                          <div className="admin-service-image">
                            {service.image ? (
                              <img
                                src={service.image}
                                alt=""
                              />
                            ) : (
                              <span>WF</span>
                            )}
                          </div>

                          <div>
                            <strong>{service.name}</strong>
                            <p>{service.description}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-category">
                          {service.categoryName}
                        </span>
                      </td>

                      <td>
                        <strong className="admin-price">
                          ₹
                          {service.price.toLocaleString(
                            'en-IN',
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-duration">
                          {service.durationMinutes} min
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            service.isActive
                              ? 'admin-status active'
                              : 'admin-status inactive'
                          }
                          onClick={() =>
                            void handleToggleService(
                              service,
                            )
                          }
                          aria-label={`Set ${service.name} ${
                            service.isActive
                              ? 'inactive'
                              : 'active'
                          }`}
                        >
                          <span />
                          {service.isActive
                            ? 'Published'
                            : 'Hidden'}
                        </button>
                      </td>

                      <td>
                        <div className="admin-service-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() =>
                              openEditServiceModal(
                                service,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-action-button danger"
                            onClick={() =>
                              void handleDeleteService(
                                service,
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredServices.length > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={servicePage}
                totalPages={serviceTotalPages}
                totalItems={filteredServices.length}
                itemsPerPage={ITEMS_PER_PAGE}
                label="services"
                onPageChange={setServicePage}
              />
            )}
            </>
          )}
        </section>
      </div>

      {isServiceModalOpen && (
        <div
          className="admin-service-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-form-title"
        >
          <div
            className="admin-service-modal-backdrop"
            onClick={closeServiceModal}
          />

          <div className="admin-service-modal-panel">
            <div className="admin-service-modal-header">
              <div>
                <span>
                  {editingService
                    ? 'EDIT SERVICE'
                    : 'NEW SERVICE'}
                </span>

                <h2 id="service-form-title">
                  {editingService
                    ? 'Refine the experience'
                    : 'Create a service'}
                </h2>

                <p>
                  Add the details clients need to discover
                  and book this experience.
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeServiceModal}
                aria-label="Close service form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="admin-service-form"
              onSubmit={handleServiceSubmit}
            >
              {error && (
                <div className="admin-form-error" role="alert">
                  <strong>Please review the form.</strong>
                  <span>{error}</span>
                </div>
              )}

              <div className="admin-form-layout">
                <div className="admin-image-upload-column">
                  <div className="admin-form-label-row">
                    <label>
                      Service image <span>*</span>
                    </label>

                    <small>
                      JPG · PNG · WEBP · 5MB
                    </small>
                  </div>

                  <button
                    type="button"
                    className={
                      imagePreview
                        ? 'admin-image-upload has-image'
                        : 'admin-image-upload'
                    }
                    onClick={() =>
                      imageInputRef.current?.click()
                    }
                    disabled={saving}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Service preview"
                        />

                        <span className="admin-image-overlay">
                          Change image
                        </span>
                      </>
                    ) : (
                      <span className="admin-image-placeholder">
                        <strong>+</strong>

                        <span>
                          Upload service image
                        </span>

                        <small>
                          Use a clean vertical image for
                          the best catalogue presentation.
                        </small>
                      </span>
                    )}
                  </button>

                  <input
                    ref={imageInputRef}
                    className="admin-hidden-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    disabled={saving}
                  />
                </div>

                <div className="admin-form-fields">
                  <div className="admin-form-group">
                    <label htmlFor="service-name">
                      Service name *
                    </label>

                    <input
                      id="service-name"
                      type="text"
                      value={serviceForm.name}
                      onChange={(event) =>
                        handleServiceFormChange(
                          'name',
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Signature Bridal Makeup"
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-group">
                    <div className="admin-form-label-row">
                      <label htmlFor="service-category-form">
                        Category *
                      </label>

                      <button
                        type="button"
                        className="admin-inline-create"
                        onClick={() =>
                          openCategoryModal(true)
                        }
                        disabled={saving}
                      >
                        + New category
                      </button>
                    </div>

                    <select
                      id="service-category-form"
                      value={serviceForm.categoryId}
                      onChange={(event) =>
                        handleServiceFormChange(
                          'categoryId',
                          event.target.value,
                        )
                      }
                      disabled={saving}
                    >
                      <option value="">
                        Select category
                      </option>

                      {activeCategories.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label htmlFor="service-price">
                        Starting price *
                      </label>

                      <div className="admin-input-prefix">
                        <span>₹</span>

                        <input
                          id="service-price"
                          type="number"
                          min="0"
                          step="1"
                          value={serviceForm.price}
                          onChange={(event) =>
                            handleServiceFormChange(
                              'price',
                              event.target.value,
                            )
                          }
                          placeholder="8500"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="service-duration">
                        Duration *
                      </label>

                      <div className="admin-input-suffix">
                        <input
                          id="service-duration"
                          type="number"
                          min="1"
                          step="1"
                          value={serviceForm.duration}
                          onChange={(event) =>
                            handleServiceFormChange(
                              'duration',
                              event.target.value,
                            )
                          }
                          placeholder="120"
                          disabled={saving}
                        />

                        <span>min</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="service-description">
                      Description *
                    </label>

                    <textarea
                      id="service-description"
                      rows={5}
                      value={serviceForm.description}
                      onChange={(event) =>
                        handleServiceFormChange(
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder="Describe what is included, who it is for, and what makes the service special..."
                      disabled={saving}
                    />
                  </div>

                  <label className="admin-form-toggle">
                    <input
                      type="checkbox"
                      checked={serviceForm.isActive}
                      onChange={(event) =>
                        handleServiceFormChange(
                          'isActive',
                          event.target.checked,
                        )
                      }
                      disabled={saving}
                    />

                    <span className="admin-toggle-track">
                      <span />
                    </span>

                    <span>
                      <strong>
                        Publish service
                      </strong>

                      <small>
                        Make this service visible to
                        clients.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-form-cancel"
                  onClick={closeServiceModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-form-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="admin-button-spinner" />
                      Saving...
                    </>
                  ) : editingService ? (
                    'Save Changes'
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div
          className="admin-category-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-form-title"
        >
          <div
            className="admin-service-modal-backdrop"
            onClick={closeCategoryModal}
          />

          <div className="admin-category-modal-panel">
            <div className="admin-category-modal-header">
              <div>
                <span>
                  {editingCategory
                    ? 'EDIT CATEGORY'
                    : 'ADMIN CATALOGUE'}
                </span>

                <h2 id="category-form-title">
                  {editingCategory
                    ? 'Edit category'
                    : 'Create category'}
                </h2>

                <p>
                  {editingCategory
                    ? 'Update the category details used to organise your service catalogue.'
                    : 'Add a category that will organise related services across the client catalogue.'}
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeCategoryModal}
                aria-label="Close category form"
                disabled={savingCategory}
              >
                ×
              </button>
            </div>

            <form
              className="admin-category-form"
              onSubmit={handleCategorySubmit}
            >
              {categoryError && (
                <div className="admin-form-error" role="alert">
                  <strong>
                    Category could not be saved.
                  </strong>

                  <span>{categoryError}</span>
                </div>
              )}

              <div className="admin-category-form-intro">
                <div className="admin-category-form-icon">
                  {editingCategory
                    ? editingCategory.name
                        .charAt(0)
                        .toUpperCase()
                    : '+'}
                </div>

                <div>
                  <strong>
                    {editingCategory
                      ? 'Update catalogue category'
                      : 'Example categories'}
                  </strong>

                  <span>
                    {editingCategory
                      ? 'Changes will be reflected across related services.'
                      : 'Nails · Hair · Makeup · Bridal · Skin Care'}
                  </span>
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="category-name">
                  Category name *
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Nails"
                  disabled={savingCategory}
                  autoFocus
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="category-description">
                  Description
                </label>

                <textarea
                  id="category-description"
                  rows={4}
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional: briefly describe what belongs in this category..."
                  disabled={savingCategory}
                />
              </div>

              <div className="admin-form-note">
                <span>i</span>

                <p>
                  Categories are an{' '}
                  <strong>admin-only</strong> catalogue
                  setting. Customers can browse categories,
                  but they cannot create, edit or delete them.
                </p>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-form-cancel"
                  onClick={closeCategoryModal}
                  disabled={savingCategory}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-form-save"
                  disabled={savingCategory}
                >
                  {savingCategory
                    ? editingCategory
                      ? 'Saving...'
                      : 'Creating...'
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default AdminServices