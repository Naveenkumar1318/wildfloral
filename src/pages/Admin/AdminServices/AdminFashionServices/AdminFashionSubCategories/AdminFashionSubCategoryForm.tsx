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
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import { supabase } from '../../../../../lib/supabase'
import './AdminFashionSubCategoryForm.css'

type FashionCategory = {
  id: string
  name: string
  is_active: boolean
}

type SubCategoryRecord = {
  id: string
  category_id: string
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(Math.max(value, min), max)
}

function getStoragePathFromUrl(
  url: string | null,
) {
  if (!url) return null

  const marker =
    '/storage/v1/object/public/fashion-images/'

  const index = url.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(
    url.slice(index + marker.length),
  )
}

function AdminFashionSubCategoryForm() {
  const navigate = useNavigate()
  const { subcategoryId } = useParams()

  const isEditMode = Boolean(subcategoryId)

  const imageInputRef =
    useRef<HTMLInputElement | null>(null)

  const sourceImageRef =
    useRef<HTMLImageElement | null>(null)

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const cropFrameRef =
    useRef<HTMLDivElement | null>(null)

  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    startCropX: 0,
    startCropY: 0,
  })

  const [categories, setCategories] =
    useState<FashionCategory[]>([])

  const [categoryId, setCategoryId] =
    useState('')

  const [name, setName] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [imageUrl, setImageUrl] =
    useState('')

  const [imagePreview, setImagePreview] =
    useState('')

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null)

  const [removeExistingImage, setRemoveExistingImage] =
    useState(false)

  const [isActive, setIsActive] =
    useState(true)

  const [cropOpen, setCropOpen] =
    useState(false)

  const [cropState, setCropState] =
    useState<CropState>({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })

  const [sourceSize, setSourceSize] =
    useState<ImageSize | null>(null)

  const [frameSize, setFrameSize] =
    useState(0)

  const [loading, setLoading] =
    useState(isEditMode)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')


  /* =========================================================
     LOAD MAIN CATEGORIES
  ========================================================= */

  useEffect(() => {
    async function loadCategories() {
      const {
        data,
        error: fetchError,
      } = await supabase
        .from('fashion_categories')
        .select(
          'id,name,is_active',
        )
        .order('name', {
          ascending: true,
        })

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      setCategories(data ?? [])

      if (!subcategoryId && data?.length) {
        const firstActive =
          data.find(
            (category) =>
              category.is_active,
          ) ?? data[0]

        setCategoryId(
          firstActive.id,
        )
      }

      if (!subcategoryId) {
        setLoading(false)
      }
    }

    void loadCategories()
  }, [subcategoryId])


  /* =========================================================
     LOAD EXISTING SUBCATEGORY
  ========================================================= */

  useEffect(() => {
    if (!subcategoryId) return

    async function loadSubCategory() {
      setLoading(true)
      setError('')

      const {
        data,
        error: fetchError,
      } = await supabase
        .from('fashion_subcategories')
        .select(`
          id,
          category_id,
          name,
          slug,
          description,
          image_url,
          is_active
        `)
        .eq('id', subcategoryId)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      const record =
        data as SubCategoryRecord

      setCategoryId(
        record.category_id,
      )

      setName(
        record.name ?? '',
      )

      setDescription(
        record.description ?? '',
      )

      setImageUrl(
        record.image_url ?? '',
      )

      setImagePreview(
        record.image_url ?? '',
      )

      setIsActive(
        record.is_active ?? true,
      )

      setLoading(false)
    }

    void loadSubCategory()
  }, [subcategoryId])


  /* =========================================================
     CROP FRAME SIZE
  ========================================================= */

  useEffect(() => {
    if (!cropOpen) return

    const updateFrameSize = () => {
      const frame =
        cropFrameRef.current

      if (frame) {
        setFrameSize(
          frame.clientWidth,
        )
      }
    }

    updateFrameSize()

    const observer =
      new ResizeObserver(
        updateFrameSize,
      )

    if (cropFrameRef.current) {
      observer.observe(
        cropFrameRef.current,
      )
    }

    window.addEventListener(
      'resize',
      updateFrameSize,
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        'resize',
        updateFrameSize,
      )
    }
  }, [cropOpen])


  /* =========================================================
     CLEANUP OBJECT URL
  ========================================================= */

  useEffect(() => {
    return () => {
      if (
        imagePreview.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          imagePreview,
        )
      }
    }
  }, [imagePreview])


  /* =========================================================
     NAME
  ========================================================= */

  function handleNameChange(
    value: string,
  ) {
    setName(value)
  }


  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) return

    setError('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Only JPG, PNG and WEBP images are allowed.',
      )

      event.target.value = ''
      return
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Image size must be 5 MB or less.',
      )

      event.target.value = ''
      return
    }

    const objectUrl =
      URL.createObjectURL(file)

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


  /* =========================================================
     IMAGE LOAD
  ========================================================= */

  function handleSourceImageLoad(
    event: SyntheticEvent<HTMLImageElement>,
  ) {
    const image =
      event.currentTarget

    sourceImageRef.current =
      image

    setSourceSize({
      width: image.naturalWidth,
      height: image.naturalHeight,
    })

    requestAnimationFrame(() => {
      const frame =
        cropFrameRef.current

      if (frame) {
        setFrameSize(
          frame.clientWidth,
        )
      }
    })
  }


  /* =========================================================
     BASE IMAGE SIZE
  ========================================================= */

  function getBaseImageSize() {
    if (
      !sourceSize ||
      frameSize <= 0
    ) {
      return null
    }

    const scale =
      Math.max(
        frameSize /
          sourceSize.width,
        frameSize /
          sourceSize.height,
      )

    return {
      width:
        sourceSize.width *
        scale,

      height:
        sourceSize.height *
        scale,
    }
  }


  /* =========================================================
     CROP MOVEMENT BOUNDS
  ========================================================= */

  function getMovementBounds(
    zoom = cropState.zoom,
  ) {
    const base =
      getBaseImageSize()

    if (
      !base ||
      frameSize <= 0
    ) {
      return {
        x: 0,
        y: 0,
      }
    }

    return {
      x: Math.max(
        0,
        (base.width *
          zoom -
          frameSize) /
          2,
      ),

      y: Math.max(
        0,
        (base.height *
          zoom -
          frameSize) /
          2,
      ),
    }
  }


  /* =========================================================
     CROP IMAGE STYLE
  ========================================================= */

  function getCropImageStyle():
    CSSProperties {
    const base =
      getBaseImageSize()

    if (!base) {
      return {
        visibility:
          'hidden',
      }
    }

    return {
      width:
        `${base.width}px`,

      height:
        `${base.height}px`,

      left: '50%',
      top: '50%',

      transform: `
        translate(-50%, -50%)
        translate(${cropState.x}px, ${cropState.y}px)
        scale(${cropState.zoom})
      `,
    }
  }


  /* =========================================================
     CROP POINTER DOWN
  ========================================================= */

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

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )
  }


  /* =========================================================
     CROP POINTER MOVE
  ========================================================= */

  function handleCropPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (
      !dragRef.current.active
    ) {
      return
    }

    const deltaX =
      event.clientX -
      dragRef.current.startX

    const deltaY =
      event.clientY -
      dragRef.current.startY

    const bounds =
      getMovementBounds()

    setCropState(
      (current) => ({
        ...current,

        x: clamp(
          dragRef.current
            .startCropX +
            deltaX,
          -bounds.x,
          bounds.x,
        ),

        y: clamp(
          dragRef.current
            .startCropY +
            deltaY,
          -bounds.y,
          bounds.y,
        ),
      }),
    )
  }


  /* =========================================================
     CROP POINTER UP
  ========================================================= */

  function handleCropPointerUp(
    event: PointerEvent<HTMLDivElement>,
  ) {
    dragRef.current.active =
      false

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    }
  }


  /* =========================================================
     CREATE CROPPED IMAGE
  ========================================================= */

  async function createCroppedImage() {
    const image =
      sourceImageRef.current

    const canvas =
      canvasRef.current

    if (
      !image ||
      !canvas ||
      !sourceSize ||
      frameSize <= 0
    ) {
      return null
    }

    const context =
      canvas.getContext('2d')

    if (!context) return null

    canvas.width =
      OUTPUT_SIZE

    canvas.height =
      OUTPUT_SIZE

    const base =
      getBaseImageSize()

    if (!base) return null

    const outputScale =
      OUTPUT_SIZE /
      frameSize

    const drawWidth =
      base.width *
      cropState.zoom *
      outputScale

    const drawHeight =
      base.height *
      cropState.zoom *
      outputScale

    const drawX =
      OUTPUT_SIZE / 2 -
      drawWidth / 2 +
      cropState.x *
        outputScale

    const drawY =
      OUTPUT_SIZE / 2 -
      drawHeight / 2 +
      cropState.y *
        outputScale

    context.clearRect(
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    context.imageSmoothingEnabled =
      true

    context.imageSmoothingQuality =
      'high'

    context.drawImage(
      image,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    )

    return new Promise<File | null>(
      (resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null)
              return
            }

            resolve(
              new File(
                [blob],
                `fashion-subcategory-${crypto.randomUUID()}.webp`,
                {
                  type: 'image/webp',
                },
              ),
            )
          },
          'image/webp',
          0.92,
        )
      },
    )
  }


  /* =========================================================
     APPLY CROP
  ========================================================= */

  async function handleApplyCrop() {
    const cropped =
      await createCroppedImage()

    if (!cropped) {
      setError(
        'Unable to crop this image. Please try again.',
      )

      return
    }

    const previewUrl =
      URL.createObjectURL(cropped)

    setSelectedImage(cropped)
    setImagePreview(previewUrl)
    setCropOpen(false)
  }


  /* =========================================================
     CHANGE IMAGE
  ========================================================= */

  function handleChangeImage() {
    imageInputRef.current?.click()
  }


  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

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


  /* =========================================================
     UPLOAD IMAGE
  ========================================================= */

  async function uploadImage(
    file: File,
  ) {
    const filePath =
      `fashion/subcategories/${crypto.randomUUID()}.webp`

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from('fashion-images')
        .upload(
          filePath,
          file,
          {
            cacheControl:
              '3600',

            contentType:
              'image/webp',

            upsert: false,
          },
        )

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}`,
      )
    }

    const {
      data,
    } =
      supabase.storage
        .from('fashion-images')
        .getPublicUrl(
          filePath,
        )

    return {
      url:
        data.publicUrl,

      path:
        filePath,
    }
  }


  /* =========================================================
     DELETE STORAGE IMAGE
  ========================================================= */

  async function deleteStorageImage(
    image: string | null,
  ) {
    const path =
      getStoragePathFromUrl(
        image,
      )

    if (!path) return

    const {
      error: removeError,
    } =
      await supabase.storage
        .from('fashion-images')
        .remove([
          path,
        ])

    if (removeError) {
      console.warn(
        'Could not remove old image:',
        removeError.message,
      )
    }
  }


  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const cleanName =
      name.trim()

    const cleanSlug =
      slugify(cleanName)

    const cleanDescription =
      description.trim()

    if (!categoryId) {
      setError(
        'Please select a main category.',
      )

      return
    }

    if (!cleanName) {
      setError(
        'Subcategory name is required.',
      )

      return
    }

    setSaving(true)

    let finalImageUrl =
      removeExistingImage
        ? null
        : imageUrl || null

    let uploadedImagePath:
      string | null = null

    try {
      if (selectedImage) {
        const uploaded =
          await uploadImage(
            selectedImage,
          )

        finalImageUrl =
          uploaded.url

        uploadedImagePath =
          uploaded.path
      }

      if (
        isEditMode &&
        subcategoryId
      ) {
        const {
          error: updateError,
        } =
          await supabase
            .from(
              'fashion_subcategories',
            )
            .update({
              category_id:
                categoryId,

              name:
                cleanName,

              slug:
                cleanSlug,

              description:
                cleanDescription ||
                null,

              image_url:
                finalImageUrl,

              is_active:
                isActive,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              subcategoryId,
            )

        if (updateError) {
          if (uploadedImagePath) {
            await supabase.storage
              .from(
                'fashion-images',
              )
              .remove([
                uploadedImagePath,
              ])
          }

          throw new Error(
            updateError.message,
          )
        }

        if (
          (selectedImage ||
            removeExistingImage) &&
          imageUrl
        ) {
          await deleteStorageImage(
            imageUrl,
          )
        }
      } else {
        const {
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_subcategories',
            )
            .insert({
              category_id:
                categoryId,

              name:
                cleanName,

              slug:
                cleanSlug,

              description:
                cleanDescription ||
                null,

              image_url:
                finalImageUrl,

              is_active:
                isActive,
            })

        if (insertError) {
          if (uploadedImagePath) {
            await supabase.storage
              .from(
                'fashion-images',
              )
              .remove([
                uploadedImagePath,
              ])
          }

          throw new Error(
            insertError.message,
          )
        }
      }

      navigate(
        '/admin/services/fashion/subcategories',
        {
          replace: true,
        },
      )
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save fashion subcategory.',
      )
    } finally {
      setSaving(false)
    }
  }


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="admin-category-form-page">
        <div className="admin-category-loading">
          <div className="admin-category-loading-spinner" />

          <span>
            Loading subcategory...
          </span>
        </div>
      </main>
    )
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="admin-category-form-page">
      <div className="admin-category-form-container">

        <div className="admin-category-page-card">

          <button
            type="button"
            className="admin-category-back"
            onClick={() =>
              navigate(
                '/admin/services/fashion/subcategories',
              )
            }
            disabled={saving}
          >
            <span>←</span>

            Back to Subcategories
          </button>


          <header className="admin-category-page-header">

            <span className="admin-category-eyebrow">
              FASHION / SUBCATEGORIES
            </span>

            <h1>
              {isEditMode
                ? 'Edit Subcategory'
                : 'Add Subcategory'}
            </h1>

            <p>
              Create and manage product groups
              inside your fashion catalogue.
            </p>

          </header>


          {error && (
            <div
              className="admin-category-error"
              role="alert"
            >
              <span>!</span>

              <p>
                {error}
              </p>
            </div>
          )}


          <form
            className="admin-category-form-card"
            onSubmit={handleSubmit}
          >

            <div className="admin-category-form-grid">


              {/* =================================================
                  LEFT
              ================================================= */}

              <section className="admin-category-form-left">


                {/* =================================================
                    01 — SUBCATEGORY IMAGE
                ================================================= */}

                <div className="admin-category-section">

                  <div className="admin-category-section-heading">

                    <span>
                      01
                    </span>

                    <div>
                      <h2>
                        Subcategory Image
                      </h2>

                      <p>
                        Use a high-quality image
                        representing this product group.
                      </p>
                    </div>

                  </div>


                  <input
                    ref={imageInputRef}
                    id="subcategory-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleImageChange
                    }
                    disabled={saving}
                    className="admin-category-hidden-input"
                  />


                  <div className="admin-category-upload-stage">

                    <label
                      htmlFor="subcategory-image"
                      className={
                        imagePreview
                          ? 'admin-category-image-box has-image'
                          : 'admin-category-image-box'
                      }
                    >

                      {imagePreview ? (
                        <>
                          <img
                            src={
                              imagePreview
                            }
                            alt={
                              name ||
                              'Subcategory preview'
                            }
                          />

                          <span className="admin-category-image-change">
                            Change Image
                          </span>
                        </>
                      ) : (
                        <div className="admin-category-image-empty">

                          <span className="admin-category-upload-icon">
                            ↑
                          </span>

                          <strong>
                            Upload subcategory image
                          </strong>

                          <span>
                            JPG, PNG or WebP
                          </span>

                          <small>
                            Maximum size: 5 MB
                          </small>

                        </div>
                      )}

                    </label>


                    <div className="admin-category-image-actions">

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={
                            handleChangeImage
                          }
                          disabled={saving}
                        >
                          Change Image
                        </button>
                      )}

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() =>
                            setCropOpen(
                              true,
                            )
                          }
                          disabled={
                            saving ||
                            !selectedImage
                          }
                        >
                          Adjust / Crop
                        </button>
                      )}

                      {imagePreview && (
                        <button
                          type="button"
                          className="danger"
                          onClick={
                            handleRemoveImage
                          }
                          disabled={saving}
                        >
                          Remove
                        </button>
                      )}

                    </div>

                  </div>

                </div>


                {/* =================================================
                    02 — SUBCATEGORY DETAILS
                ================================================= */}

                <div className="admin-category-section">

                  <div className="admin-category-section-heading">

                    <span>
                      02
                    </span>

                    <div>
                      <h2>
                        Subcategory Details
                      </h2>

                      <p>
                        Add the information customers
                        will see.
                      </p>
                    </div>

                  </div>


                  <div className="admin-category-field">

                    <label htmlFor="subcategory-category">
                      Main Category
                    </label>

                    <select
                      id="subcategory-category"
                      value={categoryId}
                      onChange={(event) =>
                        setCategoryId(
                          event.target.value,
                        )
                      }
                      disabled={saving}
                      required
                    >

                      <option value="">
                        Select main category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                            disabled={
                              !category.is_active &&
                              category.id !==
                                categoryId
                            }
                          >
                            {category.name}

                            {!category.is_active
                              ? ' (Inactive)'
                              : ''}
                          </option>
                        ),
                      )}

                    </select>

                    <small>
                      Choose the parent fashion
                      category for this subcategory.
                    </small>

                  </div>


                  <div className="admin-category-field">

                    <label htmlFor="subcategory-name">
                      Subcategory Name
                    </label>

                    <input
                      id="subcategory-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        handleNameChange(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Kurtis"
                      maxLength={100}
                      disabled={saving}
                      required
                    />

                  </div>


                  <div className="admin-category-field">

                    <label htmlFor="subcategory-description">
                      Description
                    </label>

                    <textarea
                      id="subcategory-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      placeholder="Describe this subcategory..."
                      rows={5}
                      maxLength={500}
                      disabled={saving}
                    />

                    <div className="admin-category-character-count">
                      {description.length}/500
                    </div>

                  </div>

                </div>


                {/* =================================================
                    03 — PUBLIC VISIBILITY
                ================================================= */}

                <div className="admin-category-section">

                  <div className="admin-category-section-heading">

                    <span>
                      03
                    </span>

                    <div>
                      <h2>
                        Public Visibility
                      </h2>

                      <p>
                        Control whether customers
                        can see this subcategory.
                      </p>
                    </div>

                  </div>


                  <label className="admin-category-toggle">

                    <span className="admin-category-toggle-text">

                      <strong>
                        Show subcategory publicly
                      </strong>

                      <small>
                        Customers can see this
                        subcategory in the fashion catalogue.
                      </small>

                    </span>


                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) =>
                        setIsActive(
                          event.target.checked,
                        )
                      }
                      disabled={saving}
                    />


                    <span className="admin-category-toggle-track">
                      <span />
                    </span>

                  </label>

                </div>

              </section>


              {/* =================================================
                  RIGHT — LIVE PREVIEW
              ================================================= */}

              <aside className="admin-category-preview-section">

                <div className="admin-category-preview-heading">

                  <span>
                    LIVE PREVIEW
                  </span>

                  <small>
                    1:1 Card
                  </small>

                </div>


                <div className="admin-category-preview-card">

                  <div className="admin-category-preview-image">

                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={
                          name ||
                          'Subcategory preview'
                        }
                      />
                    ) : (
                      <div className="admin-category-preview-placeholder">

                        <span>
                          {name
                            .charAt(0)
                            .toUpperCase() ||
                            'S'}
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

                      {isActive
                        ? 'Active'
                        : 'Hidden'}

                    </span>

                  </div>


                  <div className="admin-category-preview-content">

                    <span>
                      FASHION SUBCATEGORY
                    </span>

                    <h2>
                      {name ||
                        'Subcategory Name'}
                    </h2>

                    <p>
                      {description ||
                        'Your subcategory description will appear here.'}
                    </p>


                    <div className="admin-category-preview-bottom">

                      <span>
                        →
                      </span>

                    </div>

                  </div>

                </div>


                <div className="admin-category-preview-note">

                  <span>
                    ✓
                  </span>

                  <p>
                    The saved image is exported
                    as a 1200 × 1200 square
                    before upload.
                  </p>

                </div>

              </aside>

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="admin-category-form-actions">

              <button
                type="button"
                className="admin-category-cancel"
                onClick={() =>
                  navigate(
                    '/admin/services/fashion/subcategories',
                  )
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
                  : isEditMode
                    ? 'Save Changes'
                    : 'Create Subcategory'}
              </button>

            </div>

          </form>

        </div>

      </div>


      {/* =======================================================
          CROP MODAL
      ======================================================= */}

      {cropOpen && imagePreview && (
        <div
          className="admin-category-crop-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subcategory-crop-title"
        >

          <div className="admin-category-crop-modal">

            <header className="admin-category-crop-header">

              <div>

                <span>
                  IMAGE EDITOR
                </span>

                <h2 id="subcategory-crop-title">
                  Adjust Your Image
                </h2>

                <p>
                  Drag the image and zoom until
                  the composition looks perfect.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setCropOpen(false)
                }
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
                onPointerDown={
                  handleCropPointerDown
                }
                onPointerMove={
                  handleCropPointerMove
                }
                onPointerUp={
                  handleCropPointerUp
                }
                onPointerCancel={
                  handleCropPointerUp
                }
              >

                <img
                  ref={sourceImageRef}
                  src={imagePreview}
                  alt="Crop source"
                  style={
                    getCropImageStyle()
                  }
                  onLoad={
                    handleSourceImageLoad
                  }
                  draggable={false}
                />

                <div className="admin-category-crop-grid" />

                <div className="admin-category-crop-corners">

                  <i className="top-left" />
                  <i className="top-right" />
                  <i className="bottom-left" />
                  <i className="bottom-right" />

                </div>

              </div>


              <p className="admin-category-crop-hint">
                Drag to reposition · pinch/zoom
                on touch devices
              </p>

            </div>


            <div className="admin-category-crop-controls">

              <div className="admin-category-zoom-title">

                <span>
                  Zoom
                </span>

                <strong>
                  {cropState.zoom.toFixed(2)}×
                </strong>

              </div>


              <div className="admin-category-zoom-control">

                <span>
                  −
                </span>

                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={cropState.zoom}
                  onChange={(event) => {
                    const zoom =
                      Number(
                        event.target.value,
                      )

                    const bounds =
                      getMovementBounds(
                        zoom,
                      )

                    setCropState(
                      (current) => ({
                        ...current,

                        zoom,

                        x: clamp(
                          current.x,
                          -bounds.x,
                          bounds.x,
                        ),

                        y: clamp(
                          current.y,
                          -bounds.y,
                          bounds.y,
                        ),
                      }),
                    )
                  }}
                />

                <span>
                  +
                </span>

              </div>

            </div>


            <footer className="admin-category-crop-actions">

              <button
                type="button"
                onClick={() =>
                  setCropState({
                    zoom: MIN_ZOOM,
                    x: 0,
                    y: 0,
                  })
                }
                disabled={saving}
              >
                Reset
              </button>


              <div>

                <button
                  type="button"
                  onClick={() =>
                    setCropOpen(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="admin-category-apply-crop"
                  onClick={() =>
                    void handleApplyCrop()
                  }
                  disabled={
                    saving ||
                    !sourceSize
                  }
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

export default AdminFashionSubCategoryForm