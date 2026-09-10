import {
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  PointerEvent,
  SyntheticEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import './AdminbeautyCategoryForm.css'

type CategoryRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

type CropState = {
  zoom: number
  x: number
  y: number
}

type ImageSize = {
  width: number
  height: number
}

type DragState = {
  active: boolean
  startX: number
  startY: number
  startCropX: number
  startCropY: number
}

const OUTPUT_SIZE = 1200
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.05

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null

  const marker = '/storage/v1/object/public/service-images/'
  const index = imageUrl.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(imageUrl.slice(index + marker.length))
}

function AdminBeautyCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const sourceImageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropFrameRef = useRef<HTMLDivElement | null>(null)

  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    startCropX: 0,
    startCropY: 0,
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [cropOpen, setCropOpen] = useState(false)
  const [cropState, setCropState] = useState<CropState>({
    zoom: MIN_ZOOM,
    x: 0,
    y: 0,
  })
  const [sourceSize, setSourceSize] = useState<ImageSize | null>(null)
  const [frameSize, setFrameSize] = useState(0)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    void loadCategory(id)
  }, [id])

  useEffect(() => {
    if (!cropOpen) return

    const updateFrameSize = () => {
      const frame = cropFrameRef.current
      if (frame) setFrameSize(frame.clientWidth)
    }

    updateFrameSize()

    const observer = new ResizeObserver(updateFrameSize)
    if (cropFrameRef.current) observer.observe(cropFrameRef.current)

    window.addEventListener('resize', updateFrameSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateFrameSize)
    }
  }, [cropOpen])

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  async function loadCategory(categoryId: string) {
    setLoading(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('service_categories')
      .select('id,name,slug,description,image_url,is_active')
      .eq('id', categoryId)
      .single()

    if (loadError) {
      setError(loadError.message)
      setLoading(false)
      return
    }

    const category = data as CategoryRecord

    setName(category.name ?? '')
    setDescription(category.description ?? '')
    setImageUrl(category.image_url ?? '')
    setImagePreview(category.image_url ?? '')
    setIsActive(category.is_active ?? true)
    setLoading(false)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG and WEBP images are allowed.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.')
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)

    setSelectedImage(file)
    setRemoveExistingImage(false)
    setImagePreview(objectUrl)
    setSourceSize(null)
    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })
    setCropOpen(true)
  }

  function handleSourceImageLoad(
    event: SyntheticEvent<HTMLImageElement>,
  ) {
    const image = event.currentTarget

    sourceImageRef.current = image

    setSourceSize({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })

    requestAnimationFrame(() => {
      const frame = cropFrameRef.current
      if (frame) setFrameSize(frame.clientWidth)
    })
  }

  function getBaseImageSize() {
    if (!sourceSize || frameSize <= 0) return null

    const scale = Math.max(
      frameSize / sourceSize.width,
      frameSize / sourceSize.height,
    )

    return {
      width: sourceSize.width * scale,
      height: sourceSize.height * scale,
    }
  }

  function getMovementBounds(zoom = cropState.zoom) {
    const base = getBaseImageSize()

    if (!base || frameSize <= 0) {
      return { x: 0, y: 0 }
    }

    return {
      x: Math.max(0, (base.width * zoom - frameSize) / 2),
      y: Math.max(0, (base.height * zoom - frameSize) / 2),
    }
  }

  function getCropImageStyle(): CSSProperties {
    const base = getBaseImageSize()

    if (!base) {
      return {
        visibility: 'hidden',
      }
    }

    return {
      width: `${base.width}px`,
      height: `${base.height}px`,
      left: '50%',
      top: '50%',
      transform: `
        translate(-50%, -50%)
        translate(${cropState.x}px, ${cropState.y}px)
        scale(${cropState.zoom})
      `,
    }
  }

  function handleCropPointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!sourceSize) return

    event.preventDefault()

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startCropX: cropState.x,
      startCropY: cropState.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCropPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!dragRef.current.active) return

    const deltaX = event.clientX - dragRef.current.startX
    const deltaY = event.clientY - dragRef.current.startY
    const bounds = getMovementBounds()

    setCropState((current) => ({
      ...current,
      x: clamp(
        dragRef.current.startCropX + deltaX,
        -bounds.x,
        bounds.x,
      ),
      y: clamp(
        dragRef.current.startCropY + deltaY,
        -bounds.y,
        bounds.y,
      ),
    }))
  }

  function handleCropPointerUp(
    event: PointerEvent<HTMLDivElement>,
  ) {
    dragRef.current.active = false

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleZoomChange(event: ChangeEvent<HTMLInputElement>) {
    const zoom = Number(event.target.value)
    const bounds = getMovementBounds(zoom)

    setCropState((current) => ({
      zoom,
      x: clamp(current.x, -bounds.x, bounds.x),
      y: clamp(current.y, -bounds.y, bounds.y),
    }))
  }

  function handleResetCrop() {
    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })
  }

  async function createCroppedImage(): Promise<File | null> {
    const image = sourceImageRef.current
    const canvas = canvasRef.current

    if (!image || !canvas || !sourceSize || frameSize <= 0) {
      return null
    }

    const context = canvas.getContext('2d')
    if (!context) return null

    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    const base = getBaseImageSize()
    if (!base) return null

    const outputScale = OUTPUT_SIZE / frameSize

    const drawWidth =
      base.width * cropState.zoom * outputScale
    const drawHeight =
      base.height * cropState.zoom * outputScale

    const drawX =
      OUTPUT_SIZE / 2 -
      drawWidth / 2 +
      cropState.x * outputScale

    const drawY =
      OUTPUT_SIZE / 2 -
      drawHeight / 2 +
      cropState.y * outputScale

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.drawImage(
      image,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }

          resolve(
            new File(
              [blob],
              `category-${crypto.randomUUID()}.webp`,
              { type: 'image/webp' },
            ),
          )
        },
        'image/webp',
        0.92,
      )
    })
  }

  async function handleApplyCrop() {
    const cropped = await createCroppedImage()

    if (!cropped) {
      setError('Unable to crop this image. Please try again.')
      return
    }

    const previewUrl = URL.createObjectURL(cropped)

    setSelectedImage(cropped)
    setImagePreview(previewUrl)
    setCropOpen(false)
  }

  function handleRemoveImage() {
    setSelectedImage(null)
    setRemoveExistingImage(true)
    setImagePreview('')
    setSourceSize(null)
    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })

    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  async function uploadImage(file: File) {
    const filePath = `categories/${crypto.randomUUID()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`)
    }

    const { data } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath)

    return {
      url: data.publicUrl,
      path: filePath,
    }
  }

  async function deleteStorageImage(image: string | null) {
    const path = getStoragePath(image)
    if (!path) return

    const { error: removeError } = await supabase.storage
      .from('service-images')
      .remove([path])

    if (removeError) {
      console.warn(
        'Could not remove old image:',
        removeError.message,
      )
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const slug = createSlug(trimmedName)

    if (!trimmedName) {
      setError('Category name is required.')
      return
    }

    if (!slug) {
      setError('Please enter a valid category name.')
      return
    }

    setSaving(true)

    let finalImageUrl = removeExistingImage ? null : imageUrl || null
    let uploadedImagePath: string | null = null

    try {
      if (selectedImage) {
        const uploaded = await uploadImage(selectedImage)
        finalImageUrl = uploaded.url
        uploadedImagePath = uploaded.path
      }

      if (isEdit && id) {
        const { error: updateError } = await supabase
          .from('service_categories')
          .update({
            name: trimmedName,
            slug,
            description: trimmedDescription || null,
            image_url: finalImageUrl,
            is_active: isActive,
          })
          .eq('id', id)

        if (updateError) {
          if (uploadedImagePath) {
            await supabase.storage
              .from('service-images')
              .remove([uploadedImagePath])
          }

          throw new Error(updateError.message)
        }

        if ((selectedImage || removeExistingImage) && imageUrl) {
          await deleteStorageImage(imageUrl)
        }

        const { error: serviceSyncError } = await supabase
          .from('services')
          .update({ category: trimmedName })
          .eq('category_id', id)

        if (serviceSyncError) {
          console.warn(
            'Category saved but service names could not be synchronised:',
            serviceSyncError.message,
          )
        }
      } else {
        const { error: insertError } = await supabase
          .from('service_categories')
          .insert({
            name: trimmedName,
            slug,
            description: trimmedDescription || null,
            image_url: finalImageUrl,
            is_active: isActive,
          })

        if (insertError) {
          if (uploadedImagePath) {
            await supabase.storage
              .from('service-images')
              .remove([uploadedImagePath])
          }

          throw new Error(insertError.message)
        }
      }

      navigate('/admin/services/categories', { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save category.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="admin-category-form-page">
        <div className="admin-category-loading">
          <div className="admin-category-loading-spinner" />
          <span>Loading category...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-category-form-page">
      <div className="admin-category-form-container">
        <div className="admin-category-page-card">
          <button
            type="button"
            className="admin-category-back"
          onClick={() => navigate('/admin/services/categories')}
          disabled={saving}
        >
          <span>←</span>
          Back to Categories
        </button>

        <header className="admin-category-page-header">
          <span className="admin-category-eyebrow">
            BEAUTY SERVICES / CATEGORIES
          </span>
          <h1>{isEdit ? 'Edit Category' : 'Add Category'}</h1>
        </header>

        {error && (
          <div className="admin-category-error" role="alert">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <form
          className="admin-category-form-card"
          onSubmit={handleSubmit}
        >
          <div className="admin-category-form-grid">
            <section className="admin-category-form-left">
              <div className="admin-category-section">
                <div className="admin-category-section-heading">
                  <span>01</span>
                  <div>
                    <h2>Category Image</h2>
                    <p></p>
                  </div>
                </div>

                <input
                  ref={imageInputRef}
                  id="category-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="admin-category-hidden-input"
                />

                <div className="admin-category-upload-stage">
                  <label
                    htmlFor="category-image"
                    className={
                      imagePreview
                        ? 'admin-category-image-box has-image'
                        : 'admin-category-image-box'
                    }
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt={name || 'Category'}
                        />
                        <span className="admin-category-image-change">
                          Change Image
                        </span>
                      </>
                    ) : (
                      <div className="admin-category-image-empty">
                        <div className="admin-category-upload-icon">
                          ↑
                        </div>
                        <strong>Upload category image</strong>
                        <span>JPG, PNG or WEBP</span>
                        <small>Maximum 5 MB</small>
                      </div>
                    )}
                  </label>
                </div>

                <div className="admin-category-image-actions">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={saving}
                  >
                    {imagePreview ? 'Change Image' : 'Choose Image'}
                  </button>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => setCropOpen(true)}
                      disabled={saving}
                    >
                      Adjust / Crop
                    </button>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      className="danger"
                      onClick={handleRemoveImage}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-category-section">
                <div className="admin-category-section-heading">
                  <span>02</span>
                  <div>
                    <h2>Category Details</h2>
                    <p>
                      Add the information customers will see.
                    </p>
                  </div>
                </div>

                <div className="admin-category-field">
                  <label htmlFor="category-name">Category Name</label>
                  <input
                    id="category-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Hair Styling"
                    maxLength={100}
                    disabled={saving}
                  />
                </div>

                <div className="admin-category-field">
                  <label htmlFor="category-description">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe this category..."
                    rows={5}
                    maxLength={500}
                    disabled={saving}
                  />
                  <div className="admin-category-character-count">
                    {description.length}/500
                  </div>
                </div>
              </div>

              <div className="admin-category-section">
                <div className="admin-category-section-heading">
                  <span>03</span>
                  <div>
                    <h2>Public Visibility</h2>
                    <p>
                      Control whether customers can see this category.
                    </p>
                  </div>
                </div>

                <label className="admin-category-toggle">
                  <span className="admin-category-toggle-text">
                    <strong>Show category publicly</strong>
                    <small>
                      Customers can see this category in the service
                      catalogue.
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(event.target.checked)
                    }
                    disabled={saving}
                  />

                  <span className="admin-category-toggle-track">
                    <span />
                  </span>
                </label>
              </div>
            </section>

            <aside className="admin-category-preview-section">
              <div className="admin-category-preview-heading">
                <span>LIVE PREVIEW</span>
                <small>1:1 Card</small>
              </div>

              <div className="admin-category-preview-card">
                <div className="admin-category-preview-image">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={name || 'Category preview'}
                    />
                  ) : (
                    <div className="admin-category-preview-placeholder">
                      <span>
                        {name.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}

                  <span
                    className={
                      isActive
                        ? 'admin-category-preview-status active'
                        : 'admin-category-preview-status inactive'
                    }
                  >
                    <i />
                    {isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <div className="admin-category-preview-content">
                  <span>SERVICE CATEGORY</span>
                  <h2>{name || 'Category Name'}</h2>
                  <p>
                    {description ||
                      'Your category description will appear here.'}
                  </p>

                  <div className="admin-category-preview-bottom">
                    <small>
                      /{createSlug(name) || 'category-name'}
                    </small>
                    <span>→</span>
                  </div>
                </div>
              </div>

              <div className="admin-category-preview-note">
                <span>✓</span>
                <p>
                  The saved image is always exported as a 1200 × 1200
                  square before upload.
                </p>
              </div>
            </aside>
          </div>

          <footer className="admin-category-form-actions">
            <button
              type="button"
              className="admin-category-cancel"
              onClick={() =>
                navigate('/admin/services/categories')
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-category-save"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Category'}
            </button>
          </footer>
        </form>
        </div>
      </div>

      {cropOpen && imagePreview && (
        <div
          className="admin-category-crop-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Adjust category image"
        >
          <div className="admin-category-crop-modal">
            <header className="admin-category-crop-header">
              <div>
                <span>IMAGE EDITOR</span>
                <h2>Adjust Your Image</h2>
                <p>
                  Drag the image and zoom until the composition looks
                  perfect.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCropOpen(false)}
                disabled={saving}
                aria-label="Close image editor"
              >
                ×
              </button>
            </header>

            <div className="admin-category-crop-workspace">
              <div
                ref={cropFrameRef}
                className="admin-category-crop-frame"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
              >
                <img
                  src={imagePreview}
                  alt="Crop editor"
                  onLoad={handleSourceImageLoad}
                  style={getCropImageStyle()}
                  draggable={false}
                />

                <div className="admin-category-crop-grid">
                  <span />
                  <span />
                </div>

                <div className="admin-category-crop-corners">
                  <i className="top-left" />
                  <i className="top-right" />
                  <i className="bottom-left" />
                  <i className="bottom-right" />
                </div>
              </div>

              <p className="admin-category-crop-hint">
                Drag to reposition · pinch/zoom on touch devices
              </p>
            </div>

            <div className="admin-category-crop-controls">
              <div className="admin-category-zoom-title">
                <span>Zoom</span>
                <strong>{cropState.zoom.toFixed(1)}×</strong>
              </div>

              <div className="admin-category-zoom-control">
                <span>−</span>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={cropState.zoom}
                  onChange={handleZoomChange}
                  aria-label="Image zoom"
                />
                <span>+</span>
              </div>
            </div>

            <footer className="admin-category-crop-actions">
              <button
                type="button"
                onClick={handleResetCrop}
                disabled={saving}
              >
                Reset
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setCropOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-category-apply-crop"
                  onClick={() => void handleApplyCrop()}
                  disabled={saving || !sourceSize}
                >
                  Apply Crop
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="admin-category-hidden-canvas"
      />
    </main>
  )
}

export default AdminBeautyCategoryForm
