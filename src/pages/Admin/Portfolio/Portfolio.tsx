import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import { supabase } from '../../../lib/supabase'

import './Portfolio.css'

type PortfolioItem = {
  id: string
  title: string
  slug: string
  category: string
  description: string | null
  image_url: string
  is_published: boolean
  created_at: string
  updated_at: string
}

type PortfolioForm = {
  title: string
  category: string
  description: string
  is_published: boolean
}

const ITEMS_PER_PAGE = 10

const EMPTY_FORM: PortfolioForm = {
  title: '',
  category: '',
  description: '',
  is_published: true,
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(title: string) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] =
    useState('All')
  const [statusFilter, setStatusFilter] =
    useState('All')

  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] =
    useState<PortfolioItem | null>(null)

  const [form, setForm] =
    useState<PortfolioForm>(EMPTY_FORM)

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] =
    useState('')

  const [deleteTarget, setDeleteTarget] =
    useState<PortfolioItem | null>(null)

  useEffect(() => {
    void loadPortfolio()
  }, [])

  async function loadPortfolio() {
    setLoading(true)
    setError('')

    const { data, error: queryError } =
      await supabase
        .from('portfolio')
        .select(
          `
            id,
            title,
            slug,
            category,
            description,
            image_url,
            is_published,
            created_at,
            updated_at
          `,
        )
        .order('created_at', {
          ascending: false,
        })

    if (queryError) {
      setError(queryError.message)
      setItems([])
    } else {
      setItems(
        (data ?? []) as PortfolioItem[],
      )
    }

    setLoading(false)
  }

  const categories = useMemo(() => {
    const unique = new Set(
      items
        .map((item) => item.category.trim())
        .filter(Boolean),
    )

    return ['All', ...Array.from(unique).sort()]
  }, [items])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description
          ?.toLowerCase()
          .includes(query)

      const matchesCategory =
        categoryFilter === 'All' ||
        item.category === categoryFilter

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Published'
          ? item.is_published
          : !item.is_published)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [
    items,
    search,
    categoryFilter,
    statusFilter,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length / ITEMS_PER_PAGE,
    ),
  )

  const visibleItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, statusFilter])

  function openCreateModal() {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setSelectedImage(null)
    setImagePreview('')
    setError('')
    setModalOpen(true)
  }

  function openEditModal(item: PortfolioItem) {
    setEditingItem(item)

    setForm({
      title: item.title,
      category: item.category,
      description: item.description ?? '',
      is_published: item.is_published,
    })

    setSelectedImage(null)
    setImagePreview(item.image_url)
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setModalOpen(false)
    setEditingItem(null)
    setSelectedImage(null)
    setImagePreview('')
    setForm(EMPTY_FORM)
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be below 5 MB.')
      return
    }

    setError('')
    setSelectedImage(file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  async function uploadImage(file: File) {
    const extension =
      file.name.split('.').pop()?.toLowerCase() ||
      'jpg'

    const filePath = `portfolio/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } =
      await supabase.storage
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
      data: publicUrlData,
    } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  async function deleteStorageImage(
    imageUrl: string,
  ) {
    const marker =
      '/storage/v1/object/public/service-images/'

    const index = imageUrl.indexOf(marker)

    if (index === -1) return

    const path = decodeURIComponent(
      imageUrl.substring(
        index + marker.length,
      ),
    )

    if (!path.startsWith('portfolio/')) {
      return
    }

    await supabase.storage
      .from('service-images')
      .remove([path])
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Portfolio title is required.')
      return
    }

    if (!form.category.trim()) {
      setError('Portfolio category is required.')
      return
    }

    if (!editingItem && !selectedImage) {
      setError('Please upload a portfolio image.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let imageUrl =
        editingItem?.image_url ?? ''

      if (selectedImage) {
        imageUrl =
          await uploadImage(selectedImage)
      }

      if (!imageUrl) {
        throw new Error(
          'Portfolio image is required.',
        )
      }

      const payload = {
        title: form.title.trim(),
        slug: createSlug(form.title),
        category: form.category.trim(),
        description:
          form.description.trim() || null,
        image_url: imageUrl,
        is_published: form.is_published,
      }

      if (editingItem) {
        const { error: updateError } =
          await supabase
            .from('portfolio')
            .update(payload)
            .eq('id', editingItem.id)

        if (updateError) {
          throw new Error(
            updateError.message,
          )
        }

        if (
          selectedImage &&
          editingItem.image_url !== imageUrl
        ) {
          await deleteStorageImage(
            editingItem.image_url,
          )
        }
      } else {
        const { error: insertError } =
          await supabase
            .from('portfolio')
            .insert(payload)

        if (insertError) {
          throw new Error(
            insertError.message,
          )
        }
      }

      await loadPortfolio()
      closeModal()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save portfolio item.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setSaving(true)
    setError('')

    try {
      const { error: deleteError } =
        await supabase
          .from('portfolio')
          .delete()
          .eq('id', deleteTarget.id)

      if (deleteError) {
        throw new Error(
          deleteError.message,
        )
      }

      await deleteStorageImage(
        deleteTarget.image_url,
      )

      setDeleteTarget(null)
      await loadPortfolio()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete portfolio item.',
      )
    } finally {
      setSaving(false)
    }
  }

  const publishedCount = items.filter(
    (item) => item.is_published,
  ).length

  return (
    <main className="admin-portfolio">
      <div className="admin-portfolio-shell">
        <header className="admin-portfolio-hero">
          <div>
            <span className="admin-portfolio-eyebrow">
              WILDFLORAL · ADMINISTRATION
            </span>

            <h1>
              Portfolio
              <span>Showcase your work.</span>
            </h1>

            <p>
              Manage the work, looks, and creative
              experiences displayed to your clients.
            </p>
          </div>

          <div className="admin-portfolio-actions">
            <Link
              to="/admin"
              className="admin-portfolio-back"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="admin-portfolio-primary"
              onClick={openCreateModal}
            >
              + Add Project
            </button>
          </div>
        </header>

        {error && !modalOpen && (
          <div className="admin-portfolio-error">
            <strong>Something needs attention.</strong>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="admin-portfolio-stats">
          <article>
            <span>Total projects</span>
            <strong>
              {loading ? '—' : items.length}
            </strong>
            <small>Creative work in catalogue</small>
          </article>

          <article>
            <span>Published</span>
            <strong>
              {loading ? '—' : publishedCount}
            </strong>
            <small>Visible on public website</small>
          </article>

          <article>
            <span>Categories</span>
            <strong>
              {loading
                ? '—'
                : Math.max(
                    0,
                    categories.length - 1,
                  )}
            </strong>
            <small>Portfolio classifications</small>
          </article>
        </section>

        <section className="admin-portfolio-panel">
          <div className="admin-portfolio-panel-head">
            <div>
              <span>CREATIVE CATALOGUE</span>
              <h2>Featured work</h2>
            </div>

            <span className="admin-portfolio-count">
              {filteredItems.length} shown
            </span>
          </div>

          <div className="admin-portfolio-filters">
            <label>
              <span>Search</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search projects..."
              />
            </label>

            <label>
              <span>Category</span>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value,
                  )
                }
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                <option value="All">
                  All statuses
                </option>

                <option value="Published">
                  Published
                </option>

                <option value="Draft">
                  Draft
                </option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="admin-portfolio-empty">
              <span>LOADING CATALOGUE</span>
              <h3>Preparing your portfolio.</h3>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="admin-portfolio-empty">
              <span>PORTFOLIO CATALOGUE</span>

              <h3>
                {items.length === 0
                  ? 'Your portfolio is ready to begin.'
                  : 'No projects found.'}
              </h3>

              <p>
                {items.length === 0
                  ? 'Add your first project to showcase your work.'
                  : 'Try another search or reset your filters.'}
              </p>

              {items.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                >
                  + Add First Project
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
              <div className="admin-portfolio-grid">
                {visibleItems.map((item) => (
                  <article
                    className="admin-portfolio-card"
                    key={item.id}
                  >
                    <div className="admin-portfolio-card-image">
                      <img
                        src={item.image_url}
                        alt={item.title}
                      />

                      <span
                        className={
                          item.is_published
                            ? 'published'
                            : 'draft'
                        }
                      >
                        {item.is_published
                          ? 'Published'
                          : 'Draft'}
                      </span>
                    </div>

                    <div className="admin-portfolio-card-body">
                      <div className="admin-portfolio-card-top">
                        <span>
                          {item.category}
                        </span>

                        <small>
                          {formatDate(
                            item.created_at,
                          )}
                        </small>
                      </div>

                      <h3>{item.title}</h3>

                      <p>
                        {item.description ||
                          'No description added yet.'}
                      </p>

                      <div className="admin-portfolio-card-footer">
                        <div className="admin-portfolio-avatar">
                          {getInitials(
                            item.title,
                          )}
                        </div>

                        <div>
                          <strong>
                            WildFloral
                          </strong>

                          <span>
                            Portfolio project
                          </span>
                        </div>

                        <div className="admin-portfolio-card-buttons">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              setDeleteTarget(item)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="admin-portfolio-pagination">
                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <div>
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                        )
                      }
                    >
                      ←
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={
                          pageNumber === page
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setPage(pageNumber)
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={
                        page === totalPages
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1,
                          ),
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {modalOpen && (
        <div
          className="admin-portfolio-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal()
            }
          }}
        >
          <div className="admin-portfolio-modal">
            <header>
              <div>
                <span>
                  {editingItem
                    ? 'EDIT PROJECT'
                    : 'NEW PROJECT'}
                </span>

                <h2>
                  {editingItem
                    ? 'Refine your project.'
                    : 'Create a portfolio project.'}
                </h2>

                <p>
                  Add the visual and story clients
                  need to discover your work.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </header>

            {error && (
              <div className="admin-portfolio-modal-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="admin-portfolio-form-grid">
                <div className="admin-portfolio-image-upload">
                  <label>
                    <span>
                      PROJECT IMAGE *
                    </span>

                    <div className="admin-portfolio-upload-preview">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                        />
                      ) : (
                        <div>
                          <strong>+</strong>
                          <span>
                            Upload image
                          </span>
                          <small>
                            JPG · PNG · WEBP · 5MB
                          </small>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                    />

                    <small className="admin-portfolio-file-note">
                      {selectedImage
                        ? selectedImage.name
                        : editingItem
                          ? 'Choose a new image to replace the current one.'
                          : 'Recommended: high-quality vertical or square image.'}
                    </small>
                  </label>
                </div>

                <div className="admin-portfolio-form-fields">
                  <label>
                    <span>PROJECT TITLE *</span>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title:
                            event.target.value,
                        }))
                      }
                      placeholder="e.g. Bridal Elegance"
                    />
                  </label>

                  <label>
                    <span>CATEGORY *</span>

                    <input
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category:
                            event.target.value,
                        }))
                      }
                      placeholder="e.g. Bridal Makeup"
                    />
                  </label>

                  <label>
                    <span>DESCRIPTION</span>

                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }))
                      }
                      placeholder="Describe this work..."
                    />
                  </label>

                  <label className="admin-portfolio-switch-row">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_published:
                            event.target.checked,
                        }))
                      }
                    />

                    <span>
                      <strong>
                        Publish project
                      </strong>

                      <small>
                        Make this project visible
                        on the public website.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <footer>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingItem
                      ? 'Save Changes'
                      : 'Create Project'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-portfolio-confirm-backdrop">
          <div className="admin-portfolio-confirm">
            <span>DELETE PROJECT</span>

            <h2>
              Remove “{deleteTarget.title}”?
            </h2>

            <p>
              This will permanently remove the
              portfolio project and its stored image.
              This action cannot be undone.
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={() =>
                  void handleDelete()
                }
                disabled={saving}
              >
                {saving
                  ? 'Deleting...'
                  : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Portfolio