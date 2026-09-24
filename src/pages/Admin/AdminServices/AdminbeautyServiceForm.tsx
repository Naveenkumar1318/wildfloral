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

import { supabase } from '../../../lib/supabase'

import './AdminbeautyServiceForm.css'

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string
  name: string
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

type ServiceFormState = {
  name: string
  categoryId: string
  description: string
  price: string
  duration: string
  imageUrl: string
  isActive: boolean
}

/* =========================================================
   CONSTANTS
========================================================= */

const OUTPUT_SIZE = 1200

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.05

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const MAX_DESCRIPTION_LENGTH = 1000

const EMPTY_FORM: ServiceFormState = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  duration: '60',
  imageUrl: '',
  isActive: true,
}

/* =========================================================
   HELPERS
========================================================= */

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(value, min),
    max,
  )
}

function getStoragePath(
  imageUrl: string | null,
) {
  if (!imageUrl) {
    return null
  }

  const marker =
    '/storage/v1/object/public/service-images/'

  const index =
    imageUrl.indexOf(marker)

  if (index === -1) {
    return null
  }

  return decodeURIComponent(
    imageUrl.slice(
      index + marker.length,
    ),
  )
}



function formatCurrency(
  value: number,
) {
  return `₹${value.toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )}`
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminBeautyServiceForm() {
  const navigate = useNavigate()

  const { id } =
    useParams()

  const isEdit =
    Boolean(id)

  /* =======================================================
     REFS
  ======================================================= */

  const imageInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const sourceImageRef =
    useRef<HTMLImageElement | null>(
      null,
    )

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    )

  const cropFrameRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const dragRef =
    useRef<DragState>({
      active: false,
      startX: 0,
      startY: 0,
      startCropX: 0,
      startCropY: 0,
    })

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<ServiceFormState>(
      EMPTY_FORM,
    )

  const [categories, setCategories] =
    useState<Category[]>([])

  /* =======================================================
     IMAGE
  ======================================================= */

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] =
    useState('')

  const [removeExistingImage, setRemoveExistingImage] =
    useState(false)

  /* =======================================================
     CROP
  ======================================================= */

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

  /* =======================================================
     PAGE
  ======================================================= */

  const [loading, setLoading] =
    useState(isEdit)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    void loadCategories()

    if (id) {
      void loadService(id)
    }
  }, [id])

  /* =========================================================
     CROP FRAME SIZE
  ========================================================= */

  useEffect(() => {
    if (!cropOpen) {
      return
    }

    const updateFrameSize =
      () => {
        const frame =
          cropFrameRef.current

        if (frame) {
          setFrameSize(
            frame.clientWidth,
          )
        }
      }

    updateFrameSize()

    window.addEventListener(
      'resize',
      updateFrameSize,
    )

    return () => {
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
     LOAD CATEGORIES
  ========================================================= */

  async function loadCategories() {
    const {
      data,
      error: categoryError,
    } =
      await supabase
        .from(
          'service_categories',
        )
        .select(
          'id,name,is_active',
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
        )

    if (categoryError) {
      setError(
        categoryError.message,
      )
      return
    }

    setCategories(
      (data ??
        []) as Category[],
    )
  }

  /* =========================================================
     LOAD SERVICE
  ========================================================= */

  async function loadService(
    serviceId: string,
  ) {
    setLoading(true)
    setError('')

    const {
      data: service,
      error: serviceError,
    } =
      await supabase
        .from('services')
        .select('*')
        .eq(
          'id',
          serviceId,
        )
        .single()

    if (serviceError) {
      setError(
        serviceError.message,
      )
      setLoading(false)
      return
    }

    setForm({
      name:
        service.name ??
        '',

      categoryId:
        service.category_id ??
        '',

      description:
        service.description ??
        '',

      price:
        String(
          service.price ??
            '',
        ),

      duration:
        String(
          service.duration_minutes ??
            60,
        ),

      imageUrl:
        service.image_url ??
        '',

      isActive:
        service.is_active ??
        true,
    })

    setImagePreview(
      service.image_url ??
        '',
    )

    setLoading(false)
  }

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function updateForm(
    field: keyof ServiceFormState,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setError(
        'Only JPG, PNG, and WEBP images are allowed.',
      )

      event.target.value = ''

      return
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setError(
        'Image must be smaller than 5 MB.',
      )

      event.target.value = ''

      return
    }

    if (
      imagePreview.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        imagePreview,
      )
    }

    const objectUrl =
      URL.createObjectURL(
        file,
      )

    setSelectedImage(
      file,
    )

    setRemoveExistingImage(
      false,
    )

    setImagePreview(
      objectUrl,
    )

    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })

    setSourceSize(null)

    setError('')

    setCropOpen(true)

    event.target.value = ''
  }

  /* =========================================================
     SOURCE IMAGE LOAD
  ========================================================= */

  function handleSourceImageLoad(
    event: SyntheticEvent<HTMLImageElement>,
  ) {
    const image =
      event.currentTarget

    sourceImageRef.current =
      image

    setSourceSize({
      width:
        image.naturalWidth,

      height:
        image.naturalHeight,
    })

    requestAnimationFrame(
      () => {
        const frame =
          cropFrameRef.current

        if (frame) {
          setFrameSize(
            frame.clientWidth,
          )
        }
      },
    )
  }

  /* =========================================================
     CROP BASE SIZE
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
    zoom =
      cropState.zoom,
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
        (
          base.width *
            zoom -
          frameSize
        ) / 2,
      ),

      y: Math.max(
        0,
        (
          base.height *
            zoom -
          frameSize
        ) / 2,
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

      transform:
        `translate(-50%, -50%) translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.zoom})`,
    }
  }

  /* =========================================================
     CROP POINTER DOWN
  ========================================================= */

  function handleCropPointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!sourceSize) {
      return
    }

    event.preventDefault()

    dragRef.current = {
      active: true,

      startX:
        event.clientX,

      startY:
        event.clientY,

      startCropX:
        cropState.x,

      startCropY:
        cropState.y,
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
     ZOOM
  ========================================================= */

  function handleZoomChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
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
  }

  /* =========================================================
     RESET CROP
  ========================================================= */

  function handleResetCrop() {
    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })
  }

  /* =========================================================
     CREATE CROPPED IMAGE
  ========================================================= */

  async function createCroppedImage(): Promise<File | null> {
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
      canvas.getContext(
        '2d',
      )

    if (!context) {
      return null
    }

    const base =
      getBaseImageSize()

    if (!base) {
      return null
    }

    canvas.width =
      OUTPUT_SIZE

    canvas.height =
      OUTPUT_SIZE

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

    return new Promise(
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
                `service-${crypto.randomUUID()}.webp`,
                {
                  type:
                    'image/webp',
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
    setError('')

    const cropped =
      await createCroppedImage()

    if (!cropped) {
      setError(
        'Unable to crop this image. Please try again.',
      )

      return
    }

    if (
      imagePreview.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        imagePreview,
      )
    }

    const previewUrl =
      URL.createObjectURL(
        cropped,
      )

    setSelectedImage(
      cropped,
    )

    setImagePreview(
      previewUrl,
    )

    setCropOpen(false)
  }

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  function handleRemoveImage() {
    if (
      imagePreview.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        imagePreview,
      )
    }

    setSelectedImage(
      null,
    )

    setImagePreview('')

    setRemoveExistingImage(
      true,
    )

    setSourceSize(null)

    setCropState({
      zoom: MIN_ZOOM,
      x: 0,
      y: 0,
    })
  }

  /* =========================================================
     UPLOAD IMAGE
  ========================================================= */

  async function uploadImage(
    file: File,
  ) {
    const path =
      `services/${crypto.randomUUID()}.webp`

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          'service-images',
        )
        .upload(
          path,
          file,
          {
            contentType:
              'image/webp',

            cacheControl:
              '31536000',

            upsert:
              false,
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
        .from(
          'service-images',
        )
        .getPublicUrl(
          path,
        )

    return {
      url:
        data.publicUrl,

      path,
    }
  }

  /* =========================================================
     DELETE STORAGE IMAGE
  ========================================================= */

  async function deleteStorageImage(
    image: string | null,
  ) {
    const path =
      getStoragePath(
        image,
      )

    if (!path) {
      return
    }

    const {
      error: removeError,
    } =
      await supabase.storage
        .from(
          'service-images',
        )
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

    const name =
      form.name.trim()

    const description =
      form.description.trim()

    const price =
      Number(
        form.price,
      )

    const duration =
      Number(
        form.duration,
      )

    if (!name) {
      setError(
        'Service name is required.',
      )

      return
    }

    if (
      !form.categoryId
    ) {
      setError(
        'Please select a category.',
      )

      return
    }

    if (
      !Number.isFinite(
        price,
      ) ||
      price < 0
    ) {
      setError(
        'Please enter a valid service price.',
      )

      return
    }

    if (
      !Number.isFinite(
        duration,
      ) ||
      duration <= 0
    ) {
      setError(
        'Please enter a valid duration.',
      )

      return
    }

    if (
      !isEdit &&
      !selectedImage &&
      !form.imageUrl
    ) {
      setError(
        'Please upload a service image.',
      )

      return
    }

    const selectedCategory =
      categories.find(
        (category) =>
          category.id ===
          form.categoryId,
      )

    if (
      !selectedCategory
    ) {
      setError(
        'Selected category was not found.',
      )

      return
    }

    setSaving(true)

    let uploadedImagePath:
      | string
      | null = null

    try {
      let finalImageUrl =
        removeExistingImage
          ? null
          : form.imageUrl ||
            null

      if (
        selectedImage
      ) {
        const uploaded =
          await uploadImage(
            selectedImage,
          )

        finalImageUrl =
          uploaded.url

        uploadedImagePath =
          uploaded.path
      }

      const serviceData = {
        name,

        category_id:
          selectedCategory.id,

        category:
          selectedCategory.name,

        description,

        price,

        duration_minutes:
          duration,

        image_url:
          finalImageUrl,

        is_active:
          form.isActive,
      }

      if (
        isEdit &&
        id
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              'services',
            )
            .update(
              serviceData,
            )
            .eq(
              'id',
              id,
            )

        if (
          updateError
        ) {
          if (
            uploadedImagePath
          ) {
            await supabase.storage
              .from(
                'service-images',
              )
              .remove([
                uploadedImagePath,
              ])
          }

          throw new Error(
            updateError.message,
          )
        }

      } else {
        const {
          data:
            createdService,
          error:
            insertError,
        } =
          await supabase
            .from(
              'services',
            )
            .insert(
              serviceData,
            )
            .select(
              'id',
            )
            .single()

        if (
          insertError ||
          !createdService
        ) {
          if (
            uploadedImagePath
          ) {
            await supabase.storage
              .from(
                'service-images',
              )
              .remove([
                uploadedImagePath,
              ])
          }

          throw new Error(
            insertError?.message ??
              'Unable to create service.',
          )
        }

      }

      if (
        selectedImage &&
        form.imageUrl &&
        form.imageUrl !==
          finalImageUrl
      ) {
        await deleteStorageImage(
          form.imageUrl,
        )
      }

      if (
        removeExistingImage &&
        form.imageUrl
      ) {
        await deleteStorageImage(
          form.imageUrl,
        )
      }

      navigate(
        '/admin/services/beauty',
        {
          replace: true,
        },
      )
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save service.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =========================================================
     PREVIEW VALUES
  ========================================================= */

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        form.categoryId,
    )

  const previewName =
    form.name.trim() ||
    'Service Name'

  const previewDescription =
    form.description.trim() ||
    'Your service description will appear here.'

  const previewCategory =
    selectedCategory?.name ||
    'SERVICE CATEGORY'

  const numericPrice =
    Number(form.price) || 0

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="admin-service-form-page">
        <div className="admin-service-form-loading">
          <span className="admin-service-loading-spinner" />

          <strong>
            Loading service...
          </strong>

          <small>
            Preparing your service catalogue.
          </small>
        </div>
      </main>
    )
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="admin-service-form-page">

      <div className="admin-service-form-container">

        <form
          className="admin-service-main-card"
          onSubmit={handleSubmit}
        >

        {/* ===================================================
            BACK
        =================================================== */}

        <button
          type="button"
          className="admin-service-back"
          onClick={() =>
            navigate(
              '/admin/services/beauty',
            )
          }
          disabled={saving}
        >
          <span>←</span>
          Back to Services
        </button>

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="admin-service-page-header">

          <span className="admin-service-eyebrow">
            SERVICE CATALOGUE
          </span>

          <h1>
            {isEdit
              ? 'Edit Service'
              : 'Add New Service'}
          </h1>

          <p>
            Configure the service image,
            details, fixed pricing,
            duration, and customer visibility.
          </p>

        </header>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="admin-service-form-error"
            role="alert"
          >
            <span>!</span>

            <p>
              {error}
            </p>
          </div>
        )}

        {/* ===================================================
            MAIN FORM
        =================================================== */}

          <div className="admin-service-main-grid">

            {/* =================================================
                LEFT FORM
            ================================================= */}

            <div className="admin-service-form-main">

              {/* ===============================================
                  01 IMAGE
              =============================================== */}

              <section className="admin-service-section">

                <div className="admin-service-section-heading">

                  <span>
                    01
                  </span>

                  <div>
                    <span>
                      SERVICE IMAGE
                    </span>

                    <h2>
                      Service Image
                    </h2>

                    <p>
                      Upload a professional image
                      and crop it exactly as it should
                      appear on the service card.
                    </p>
                  </div>

                </div>

                <div className="admin-service-image-upload">

                  <input
                    ref={
                      imageInputRef
                    }
                    id="service-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleImageChange
                    }
                    disabled={
                      saving
                    }
                    hidden
                  />

                  <div
                    className={
                      imagePreview
                        ? 'admin-service-image-stage has-image'
                        : 'admin-service-image-stage'
                    }
                  >

                    {imagePreview ? (
                      <button
                        type="button"
                        className="admin-service-image-preview-button"
                        onClick={() =>
                          setCropOpen(
                            true,
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        <img
                          src={
                            imagePreview
                          }
                          alt={
                            previewName
                          }
                        />

                        <span>
                          Adjust / Crop
                        </span>
                      </button>
                    ) : (
                      <label
                        htmlFor="service-image"
                        className="admin-service-upload-empty"
                      >
                        <span className="admin-service-upload-icon">
                          ↑
                        </span>

                        <strong>
                          Upload Service Image
                        </strong>

                        <small>
                          JPG, PNG or WEBP ·
                          Maximum 5 MB
                        </small>

                        <em>
                          A square crop will be
                          used for the service card.
                        </em>
                      </label>
                    )}

                  </div>

                  {imagePreview && (
                    <div className="admin-service-image-actions">

                      <label
                        htmlFor="service-image"
                        className="admin-service-small-button"
                      >
                        Change Image
                      </label>

                      <button
                        type="button"
                        className="admin-service-small-button"
                        onClick={() =>
                          setCropOpen(
                            true,
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        Adjust / Crop
                      </button>

                      <button
                        type="button"
                        className="admin-service-small-button danger"
                        onClick={
                          handleRemoveImage
                        }
                        disabled={
                          saving
                        }
                      >
                        Remove
                      </button>

                    </div>
                  )}

                </div>

              </section>

              {/* ===============================================
                  02 BASIC INFORMATION
              =============================================== */}

              <section className="admin-service-section">

                <div className="admin-service-section-heading">

                  <span>
                    02
                  </span>

                  <div>
                    <span>
                      SERVICE DETAILS
                    </span>

                    <h2>
                      Basic Information
                    </h2>

                    <p>
                      Add the information customers
                      will see before booking.
                    </p>
                  </div>

                </div>

                <div className="admin-service-fields-grid">

                  <div className="admin-service-field">

                    <label htmlFor="service-name">
                      Service Name
                      <b>*</b>
                    </label>

                    <input
                      id="service-name"
                      type="text"
                      value={
                        form.name
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'name',
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Signature Bridal Makeup"
                      maxLength={
                        120
                      }
                      disabled={
                        saving
                      }
                    />

                  </div>

                  <div className="admin-service-field">

                    <label htmlFor="service-category">
                      Category
                      <b>*</b>
                    </label>

                    <select
                      id="service-category"
                      value={
                        form.categoryId
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'categoryId',
                          event.target.value,
                        )
                      }
                      disabled={
                        saving
                      }
                    >

                      <option value="">
                        Select Category
                      </option>

                      {categories.map(
                        (
                          category,
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        ),
                      )}

                    </select>

                  </div>

                  <div className="admin-service-field full">

                    <label htmlFor="service-description">
                      Description
                      <span>
                        Optional
                      </span>
                    </label>

                    <textarea
                      id="service-description"
                      value={
                        form.description
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder="Describe the service experience..."
                      maxLength={
                        MAX_DESCRIPTION_LENGTH
                      }
                      rows={
                        5
                      }
                      disabled={
                        saving
                      }
                    />

                    <small className="admin-service-character-count">
                      {
                        form.description.length
                      }
                      /
                      {
                        MAX_DESCRIPTION_LENGTH
                      }
                    </small>

                  </div>

                </div>

              </section>

              {/* ===============================================
                  03 PRICING
              =============================================== */}

              <section className="admin-service-section">

                <div className="admin-service-section-heading">

                  <span>
                    03
                  </span>

                  <div>
                    <span>
                      COMMERCIAL
                    </span>

                    <h2>
                      Pricing & Duration
                    </h2>

                    <p>
                      Set the standard service price
                      and expected appointment duration.
                    </p>
                  </div>

                </div>

                <div className="admin-service-fields-grid pricing">

                  <div className="admin-service-field">

                    <label htmlFor="service-price">
                      Base Price
                      <b>*</b>
                    </label>

                    <div className="admin-service-input-prefix">

                      <span>
                        ₹
                      </span>

                      <input
                        id="service-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.price
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'price',
                            event.target.value,
                          )
                        }
                        placeholder="0"
                        disabled={
                          saving
                        }
                      />

                    </div>

                  </div>

                  <div className="admin-service-field">

                    <label htmlFor="service-duration">
                      Duration
                      <b>*</b>
                    </label>

                    <div className="admin-service-input-suffix">

                      <input
                        id="service-duration"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          form.duration
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'duration',
                            event.target.value,
                          )
                        }
                        placeholder="60"
                        disabled={
                          saving
                        }
                      />

                      <span>
                        MIN
                      </span>

                    </div>

                  </div>

                </div>

              </section>

              {/* ===============================================
                  04 VISIBILITY
              =============================================== */}

              <section className="admin-service-section last">

                <div className="admin-service-section-heading">

                  <span>
                    05
                  </span>

                  <div>
                    <span>
                      VISIBILITY
                    </span>

                    <h2>
                      Publication
                    </h2>

                    <p>
                      Control whether customers can
                      discover and book this service.
                    </p>
                  </div>

                </div>

                <label className="admin-service-publication">

                  <span>
                    <strong>
                      Show service publicly
                    </strong>

                    <small>
                      This service will be visible to
                      customers and available for booking.
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'isActive',
                        event.target.checked,
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                  <span className="admin-service-switch">
                    <i />
                  </span>

                </label>

              </section>

            </div>

            {/* =================================================
                RIGHT PREVIEW
            ================================================= */}

            <aside className="admin-service-preview-section">

              <div className="admin-service-preview-heading">

                <div>
                  <span>
                    LIVE PREVIEW
                  </span>

                  <h2>
                    Service Card
                  </h2>
                </div>

                <small>
                  1:1 Card
                </small>

              </div>

              <article className="admin-service-preview-card">

                <div className="admin-service-preview-image">

                  {imagePreview ? (
                    <img
                      src={
                        imagePreview
                      }
                      alt={
                        previewName
                      }
                    />
                  ) : (
                    <div className="admin-service-preview-placeholder">
                      <span>
                        {previewName
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </span>
                    </div>
                  )}

                  <span
                    className={
                      form.isActive
                        ? 'admin-service-preview-status active'
                        : 'admin-service-preview-status inactive'
                    }
                  >
                    <i />

                    {form.isActive
                      ? 'Active'
                      : 'Hidden'}
                  </span>

                </div>

                <div className="admin-service-preview-content">

                  <span className="admin-service-preview-category">
                    {previewCategory}
                  </span>

                  <h3>
                    {previewName}
                  </h3>

                  <p>
                    {
                      previewDescription
                    }
                  </p>

                  <div className="admin-service-preview-price-row">

                    <div>
                      <span>
                        Price
                      </span>

                      <strong>
                        {
                          formatCurrency(
                            numericPrice,
                          )
                        }
                      </strong>
                    </div>

                    <div className="admin-service-preview-duration">

                      <span>
                        Duration
                      </span>

                      <strong>
                        {form.duration ||
                          '60'}{' '}
                        min
                      </strong>

                    </div>

                  </div>

                </div>

              </article>

              <div className="admin-service-preview-note">

                <span>
                  ✓
                </span>

                <p>
                  The saved image is always exported
                  as a 1200 × 1200 square before upload.
                </p>

              </div>

            </aside>

          </div>

          {/* =================================================
              FORM FOOTER
          ================================================= */}

          <footer className="admin-service-form-footer">

            <div>
              <span>
                {isEdit
                  ? 'EDITING SERVICE'
                  : 'NEW SERVICE'}
              </span>

              <strong>
                {form.name.trim() ||
                  'Untitled service'}
              </strong>
            </div>

            <div className="admin-service-form-footer-actions">

              <button
                type="button"
                className="admin-service-cancel-button"
                onClick={() =>
                  navigate(
                    '/admin/services/beauty',
                  )
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-service-save-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Create Service'}
              </button>

            </div>

          </footer>

        </form>

      </div>

      {/* =====================================================
          IMAGE CROP EDITOR
      ===================================================== */}

      {cropOpen &&
        imagePreview && (
          <div
            className="admin-service-crop-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Adjust service image"
          >

            <div className="admin-service-crop-modal">

              {/* =============================================
                  CROP HEADER
              ============================================= */}

              <header className="admin-service-crop-header">

                <div>

                  <span>
                    IMAGE EDITOR
                  </span>

                  <h2>
                    Adjust Your Image
                  </h2>

                  <p>
                    Drag the image and zoom until the
                    composition looks perfect.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCropOpen(
                      false,
                    )
                  }
                  disabled={
                    saving
                  }
                  aria-label="Close image editor"
                >
                  ×
                </button>

              </header>

              {/* =============================================
                  CROP WORKSPACE
              ============================================= */}

              <div className="admin-service-crop-workspace">

                <div
                  ref={
                    cropFrameRef
                  }
                  className="admin-service-crop-frame"
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
                    ref={
                      sourceImageRef
                    }
                    src={
                      imagePreview
                    }
                    alt="Crop editor"
                    onLoad={
                      handleSourceImageLoad
                    }
                    style={
                      getCropImageStyle()
                    }
                    draggable={
                      false
                    }
                  />

                  <div className="admin-service-crop-grid">
                    <span />
                    <span />
                  </div>

                  <div className="admin-service-crop-corners">

                    <i className="top-left" />
                    <i className="top-right" />
                    <i className="bottom-left" />
                    <i className="bottom-right" />

                  </div>

                </div>

                <p className="admin-service-crop-hint">
                  Drag to reposition · pinch/zoom on touch devices
                </p>

              </div>

              {/* =============================================
                  ZOOM CONTROLS
              ============================================= */}

              <div className="admin-service-crop-controls">

                <div className="admin-service-zoom-title">

                  <span>
                    Zoom
                  </span>

                  <strong>
                    {cropState.zoom.toFixed(
                      1,
                    )}
                    ×
                  </strong>

                </div>

                <div className="admin-service-zoom-control">

                  <span>
                    −
                  </span>

                  <input
                    type="range"
                    min={
                      MIN_ZOOM
                    }
                    max={
                      MAX_ZOOM
                    }
                    step={
                      ZOOM_STEP
                    }
                    value={
                      cropState.zoom
                    }
                    onChange={
                      handleZoomChange
                    }
                    disabled={
                      saving
                    }
                    aria-label="Image zoom"
                  />

                  <span>
                    +
                  </span>

                </div>

              </div>

              {/* =============================================
                  CROP ACTIONS
              ============================================= */}

              <footer className="admin-service-crop-actions">

                <button
                  type="button"
                  onClick={
                    handleResetCrop
                  }
                  disabled={
                    saving
                  }
                >
                  Reset
                </button>

                <div>

                  <button
                    type="button"
                    onClick={() =>
                      setCropOpen(
                        false,
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="admin-service-apply-crop"
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

            <canvas
              ref={
                canvasRef
              }
              className="admin-service-hidden-canvas"
            />

          </div>
        )}

    </main>
  )
}

export default AdminBeautyServiceForm