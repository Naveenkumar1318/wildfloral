import {
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  ChangeEvent,
  PointerEvent,
} from 'react'

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './CustomerProfile.css'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  date_of_birth: string | null
  gender: string | null
  location: string | null
  role: string
  created_at: string
  updated_at: string
}

type BookingRow = {
  id: string
  booking_date: string
  booking_time: string
  status: string
  price: number
  services:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

type CropState = {
  source: string
  file: File
}

type ImageSize = {
  width: number
  height: number
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const AVATAR_BUCKET = 'avatars'

const OUTPUT_SIZE = 800
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.05

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

function formatMemberDate(
  value: string,
) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  )
}

function formatActivityDate(
  value: string,
) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function formatCurrency(
  value: number,
) {
  return `₹${Number(value).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 0,
    },
  )}`
}

function getInitial(
  profile: Profile | null,
) {
  if (
    profile?.full_name?.trim()
  ) {
    return profile.full_name
      .trim()
      .charAt(0)
      .toUpperCase()
  }

  if (
    profile?.email?.trim()
  ) {
    return profile.email
      .trim()
      .charAt(0)
      .toUpperCase()
  }

  return 'U'
}

function getServiceName(
  services: BookingRow['services'],
) {
  if (Array.isArray(services)) {
    return (
      services[0]?.name ??
      'Beauty service'
    )
  }

  return (
    services?.name ??
    'Beauty service'
  )
}

function getStatusLabel(
  status: string,
) {
  const normalized =
    status.toLowerCase()

  if (
    normalized === 'pending'
  ) {
    return 'Requested'
  }

  if (
    normalized === 'confirmed'
  ) {
    return 'Confirmed'
  }

  if (
    normalized === 'completed'
  ) {
    return 'Completed'
  }

  if (
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return 'Cancelled'
  }

  return status
}

function getStatusClass(
  status: string,
) {
  const normalized =
    status.toLowerCase()

  if (
    normalized === 'confirmed'
  ) {
    return 'confirmed'
  }

  if (
    normalized === 'completed'
  ) {
    return 'completed'
  }

  if (
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return 'cancelled'
  }

  return 'pending'
}

function CustomerProfile() {
  const navigate = useNavigate()

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const sourceImageRef =
    useRef<HTMLImageElement | null>(
      null,
    )

  const cropAreaRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const dragRef =
    useRef({
      active: false,
      startX: 0,
      startY: 0,
      startCropX: 0,
      startCropY: 0,
    })

  const [profile, setProfile] =
    useState<Profile | null>(
      null,
    )

  const [bookings, setBookings] =
    useState<BookingRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editing, setEditing] =
    useState(false)

  const [fullName, setFullName] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [dateOfBirth, setDateOfBirth] =
    useState('')

  const [gender, setGender] =
    useState('')

  const [location, setLocation] =
    useState('')

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null)

  const [selectedAvatar, setSelectedAvatar] =
    useState<File | null>(null)

  const [crop, setCrop] =
    useState<CropState | null>(null)

  const [zoom, setZoom] =
    useState(MIN_ZOOM)

  const [cropX, setCropX] =
    useState(0)

  const [cropY, setCropY] =
    useState(0)

  const [sourceSize, setSourceSize] =
    useState<ImageSize | null>(null)

  const [frameSize, setFrameSize] =
    useState(0)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState<'success' | 'error'>(
      'success',
    )

  const [bookingStats, setBookingStats] =
    useState({
      total: 0,
      completed: 0,
      upcoming: 0,
      confirmed: 0,
    })

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    try {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      const user =
        authData.user

      if (!user) {
        navigate('/login')
        return
      }

      const [
        profileResponse,
        bookingsResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            avatar_url,
            date_of_birth,
            gender,
            location,
            role,
            created_at,
            updated_at
          `)
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_time,
            status,
            price,
            services (
              name
            )
          `)
          .eq(
            'customer_id',
            user.id,
          )
          .order(
            'booking_date',
            {
              ascending: false,
            },
          )
          .order(
            'booking_time',
            {
              ascending: false,
            },
          ),
      ])

      if (profileResponse.error) {
        throw profileResponse.error
      }

      if (bookingsResponse.error) {
        throw bookingsResponse.error
      }

      const now =
        new Date().toISOString()

      const loadedProfile =
        profileResponse.data ?? {
          id: user.id,
          full_name:
            user.user_metadata
              ?.full_name ??
            null,
          email:
            user.email ?? null,
          phone: null,
          avatar_url: null,
          date_of_birth: null,
          gender: null,
          location: null,
          role: 'customer',
          created_at: now,
          updated_at: now,
        }

      const loadedBookings =
        (bookingsResponse.data ??
          []) as BookingRow[]

      setProfile(
        loadedProfile,
      )

      setFullName(
        loadedProfile.full_name ??
          '',
      )

      setPhone(
        loadedProfile.phone ??
          '',
      )

      setDateOfBirth(
        loadedProfile.date_of_birth ??
          '',
      )

      setGender(
        loadedProfile.gender ??
          '',
      )

      setLocation(
        loadedProfile.location ??
          '',
      )

      setAvatarPreview(
        loadedProfile.avatar_url ??
          null,
      )

      setBookings(
        loadedBookings,
      )

      const today =
        new Date()
          .toISOString()
          .slice(0, 10)

      setBookingStats({
        total:
          loadedBookings.length,

        completed:
          loadedBookings.filter(
            (booking) =>
              booking.status
                .toLowerCase() ===
              'completed',
          ).length,

        upcoming:
          loadedBookings.filter(
            (booking) =>
              booking.booking_date >=
                today &&
              ![
                'cancelled',
                'canceled',
              ].includes(
                booking.status.toLowerCase(),
              ),
          ).length,

        confirmed:
          loadedBookings.filter(
            (booking) =>
              booking.status
                .toLowerCase() ===
              'confirmed',
          ).length,
      })
    } catch (error) {
      console.error(
        'Customer profile load error:',
        error,
      )

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load your profile.',
      )

      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     EDIT MODE
  ========================================================= */

  function startEditing() {
    if (!profile) {
      return
    }

    setFullName(
      profile.full_name ?? '',
    )

    setPhone(
      profile.phone ?? '',
    )

    setDateOfBirth(
      profile.date_of_birth ?? '',
    )

    setGender(
      profile.gender ?? '',
    )

    setLocation(
      profile.location ?? '',
    )

    setAvatarPreview(
      profile.avatar_url ?? null,
    )

    setSelectedAvatar(null)
    setMessage('')
    setEditing(true)
  }

  function cancelEditing() {
    if (!profile) {
      return
    }

    if (
      avatarPreview?.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview,
      )
    }

    setFullName(
      profile.full_name ?? '',
    )

    setPhone(
      profile.phone ?? '',
    )

    setDateOfBirth(
      profile.date_of_birth ?? '',
    )

    setGender(
      profile.gender ?? '',
    )

    setLocation(
      profile.location ?? '',
    )

    setAvatarPreview(
      profile.avatar_url ?? null,
    )

    setSelectedAvatar(null)

    if (crop) {
      URL.revokeObjectURL(
        crop.source,
      )
    }

    setCrop(null)
    setSourceSize(null)
    setFrameSize(0)

    setEditing(false)
    setMessage('')
  }

  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      setMessage(
        'Please choose a JPG, PNG, or WEBP image.',
      )
      setMessageType('error')
      return
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setMessage(
        'Image must be smaller than 5 MB.',
      )
      setMessageType('error')
      return
    }

    const source =
      URL.createObjectURL(file)

    if (crop) {
      URL.revokeObjectURL(
        crop.source,
      )
    }

    setZoom(MIN_ZOOM)
    setCropX(0)
    setCropY(0)
    setSourceSize(null)
    setFrameSize(0)

    setCrop({
      source,
      file,
    })

    setMessage('')
  }

  /* =========================================================
     CROP FRAME SIZE
  ========================================================= */

  useEffect(() => {
    if (!crop) {
      return
    }

    const updateSize =
      () => {
        const element =
          cropAreaRef.current

        if (!element) {
          return
        }

        setFrameSize(
          element.clientWidth,
        )
      }

    updateSize()

    const observer =
      new ResizeObserver(
        updateSize,
      )

    if (cropAreaRef.current) {
      observer.observe(
        cropAreaRef.current,
      )
    }

    window.addEventListener(
      'resize',
      updateSize,
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        'resize',
        updateSize,
      )
    }
  }, [crop])

  /* =========================================================
     IMAGE LOAD
  ========================================================= */

  function handleCropImageLoad() {
    const image =
      sourceImageRef.current

    if (!image) {
      return
    }

    setSourceSize({
      width:
        image.naturalWidth,
      height:
        image.naturalHeight,
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

    const ratio =
      sourceSize.width /
      sourceSize.height

    if (ratio >= 1) {
      return {
        width:
          frameSize * ratio,
        height:
          frameSize,
      }
    }

    return {
      width:
        frameSize,
      height:
        frameSize / ratio,
    }
  }

  /* =========================================================
     MOVEMENT BOUNDS
  ========================================================= */

  function getMovementBounds(
    nextZoom = zoom,
  ) {
    const base =
      getBaseImageSize()

    if (!base) {
      return {
        x: 0,
        y: 0,
      }
    }

    const scaledWidth =
      base.width * nextZoom

    const scaledHeight =
      base.height * nextZoom

    return {
      x:
        Math.max(
          0,
          (scaledWidth -
            frameSize) /
            2,
        ),

      y:
        Math.max(
          0,
          (scaledHeight -
            frameSize) /
            2,
        ),
    }
  }

  /* =========================================================
     POINTER DOWN
  ========================================================= */

  function handleCropPointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (
      !sourceSize ||
      frameSize <= 0
    ) {
      return
    }

    dragRef.current = {
      active: true,
      startX:
        event.clientX,
      startY:
        event.clientY,
      startCropX:
        cropX,
      startCropY:
        cropY,
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )

    event.currentTarget.classList.add(
      'is-dragging',
    )
  }

  /* =========================================================
     POINTER MOVE
  ========================================================= */

  function handleCropPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (
      !dragRef.current.active
    ) {
      return
    }

    const bounds =
      getMovementBounds()

    const nextX =
      dragRef.current.startCropX +
      event.clientX -
      dragRef.current.startX

    const nextY =
      dragRef.current.startCropY +
      event.clientY -
      dragRef.current.startY

    setCropX(
      clamp(
        nextX,
        -bounds.x,
        bounds.x,
      ),
    )

    setCropY(
      clamp(
        nextY,
        -bounds.y,
        bounds.y,
      ),
    )
  }

  /* =========================================================
     POINTER UP
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

    event.currentTarget.classList.remove(
      'is-dragging',
    )
  }

  /* =========================================================
     ZOOM
  ========================================================= */

  function handleZoomChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextZoom =
      Number(event.target.value)

    const bounds =
      getMovementBounds(
        nextZoom,
      )

    setZoom(nextZoom)

    setCropX(
      (current) =>
        clamp(
          current,
          -bounds.x,
          bounds.x,
        ),
    )

    setCropY(
      (current) =>
        clamp(
          current,
          -bounds.y,
          bounds.y,
        ),
    )
  }

  /* =========================================================
     RESET CROP
  ========================================================= */

  function resetCrop() {
    setZoom(MIN_ZOOM)
    setCropX(0)
    setCropY(0)
  }

  /* =========================================================
     CREATE CROPPED IMAGE
  ========================================================= */

  async function createCroppedImage() {
    const image =
      sourceImageRef.current

    const base =
      getBaseImageSize()

    if (
      !crop ||
      !image ||
      !sourceSize ||
      !base ||
      frameSize <= 0
    ) {
      return null
    }

    const canvas =
      document.createElement(
        'canvas',
      )

    canvas.width =
      OUTPUT_SIZE

    canvas.height =
      OUTPUT_SIZE

    const context =
      canvas.getContext('2d')

    if (!context) {
      throw new Error(
        'Unable to prepare image crop.',
      )
    }

    const scaleX =
      (base.width * zoom) /
      sourceSize.width

    const scaleY =
      (base.height * zoom) /
      sourceSize.height

    const drawWidth =
      base.width * zoom

    const drawHeight =
      base.height * zoom

    const drawX =
      frameSize / 2 -
      drawWidth / 2 +
      cropX

    const drawY =
      frameSize / 2 -
      drawHeight / 2 +
      cropY

    let sourceLeft =
      -drawX / scaleX

    let sourceTop =
      -drawY / scaleY

    let sourceWidth =
      frameSize / scaleX

    let sourceHeight =
      frameSize / scaleY

    sourceLeft =
      clamp(
        sourceLeft,
        0,
        Math.max(
          0,
          sourceSize.width -
            sourceWidth,
        ),
      )

    sourceTop =
      clamp(
        sourceTop,
        0,
        Math.max(
          0,
          sourceSize.height -
            sourceHeight,
        ),
      )

    sourceWidth =
      Math.min(
        sourceWidth,
        sourceSize.width,
      )

    sourceHeight =
      Math.min(
        sourceHeight,
        sourceSize.height,
      )

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
      sourceLeft,
      sourceTop,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    const blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            'image/webp',
            0.92,
          )
        },
      )

    if (!blob) {
      throw new Error(
        'Unable to create cropped image.',
      )
    }

    return new File(
      [blob],
      `avatar-${crypto.randomUUID()}.webp`,
      {
        type: 'image/webp',
      },
    )
  }

  /* =========================================================
     CONFIRM CROP
  ========================================================= */

  async function confirmCrop() {
    try {
      const cropped =
        await createCroppedImage()

      if (!cropped) {
        return
      }

      if (
        avatarPreview?.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview,
        )
      }

      const previewUrl =
        URL.createObjectURL(
          cropped,
        )

      setSelectedAvatar(
        cropped,
      )

      setAvatarPreview(
        previewUrl,
      )

      if (crop) {
        URL.revokeObjectURL(
          crop.source,
        )
      }

      setCrop(null)
      setSourceSize(null)
      setFrameSize(0)
      setMessage('')
    } catch (error) {
      console.error(
        'Avatar crop error:',
        error,
      )

      setMessage(
        'Unable to crop the image. Please try again.',
      )

      setMessageType('error')
    }
  }

  /* =========================================================
     CANCEL CROP
  ========================================================= */

  function cancelCrop() {
    if (crop) {
      URL.revokeObjectURL(
        crop.source,
      )
    }

    setCrop(null)
    setSourceSize(null)
    setFrameSize(0)
  }

  /* =========================================================
     UPLOAD AVATAR
  ========================================================= */

  async function uploadAvatar(
    userId: string,
  ) {
    if (!selectedAvatar) {
      return profile?.avatar_url ??
        null
    }

    const path =
      `${userId}/avatar.webp`

    const {
      error,
    } =
      await supabase.storage
        .from(
          AVATAR_BUCKET,
        )
        .upload(
          path,
          selectedAvatar,
          {
            cacheControl:
              '3600',
            upsert: true,
            contentType:
              'image/webp',
          },
        )

    if (error) {
      throw error
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          AVATAR_BUCKET,
        )
        .getPublicUrl(
          path,
        )

    return `${data.publicUrl}?v=${Date.now()}`
  }

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function handleSave() {
    if (!profile) {
      return
    }

    const cleanName =
      fullName.trim()

    const cleanPhone =
      phone.trim()

    const cleanLocation =
      location.trim()

    if (!cleanName) {
      setMessage(
        'Please enter your full name.',
      )
      setMessageType('error')
      return
    }

    if (
      cleanPhone &&
      !/^[+]?[0-9\s()-]{8,18}$/.test(
        cleanPhone,
      )
    ) {
      setMessage(
        'Please enter a valid mobile number.',
      )
      setMessageType('error')
      return
    }

    if (
      dateOfBirth &&
      new Date(dateOfBirth) >
        new Date()
    ) {
      setMessage(
        'Date of birth cannot be in the future.',
      )
      setMessageType('error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      const user =
        authData.user

      if (!user) {
        navigate('/login')
        return
      }

      const avatarUrl =
        await uploadAvatar(
          user.id,
        )

      const {
        data:
          updatedProfile,
        error:
          updateError,
      } =
        await supabase
          .from('profiles')
          .update({
            full_name:
              cleanName,

            phone:
              cleanPhone ||
              null,

            avatar_url:
              avatarUrl,

            date_of_birth:
              dateOfBirth ||
              null,

            gender:
              gender ||
              null,

            location:
              cleanLocation ||
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            user.id,
          )
          .select(`
            id,
            full_name,
            email,
            phone,
            avatar_url,
            date_of_birth,
            gender,
            location,
            role,
            created_at,
            updated_at
          `)
          .single()

      if (updateError) {
        throw updateError
      }

      setProfile(
        updatedProfile,
      )

      setFullName(
        updatedProfile.full_name ??
          '',
      )

      setPhone(
        updatedProfile.phone ??
          '',
      )

      setDateOfBirth(
        updatedProfile.date_of_birth ??
          '',
      )

      setGender(
        updatedProfile.gender ??
          '',
      )

      setLocation(
        updatedProfile.location ??
          '',
      )

      setAvatarPreview(
        updatedProfile.avatar_url ??
          null,
      )

      setSelectedAvatar(null)
      setEditing(false)

      setMessage(
        'Your profile has been updated successfully.',
      )

      setMessageType('success')
    } catch (error) {
      console.error(
        'Customer profile save error:',
        error,
      )

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save your profile.',
      )

      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const initial =
    getInitial(profile)

  const recentBookings =
    bookings.slice(0, 4)

  const baseImageSize =
    getBaseImageSize()

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="customer-profile-page">
        <div className="profile-page-container">
          <div className="profile-loading-card">
            <div className="profile-loading-spinner" />
            <span>
              Preparing your profile...
            </span>
          </div>
        </div>
      </main>
    )
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (!profile) {
    return (
      <main className="customer-profile-page">
        <div className="profile-page-container">
          <div className="profile-empty-card">
            <ShieldCheck size={30} />

            <h1>
              Profile unavailable
            </h1>

            <p>
              We could not load your customer
              profile.
            </p>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="customer-profile-page">

      <div className="profile-page-container">

        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div className="profile-topbar">

          <button
            type="button"
            className="profile-back-button"
            onClick={() =>
              navigate('/account')
            }
          >
            <ArrowLeft size={16} />
            Back to Account
          </button>

          {!editing ? (
            <button
              type="button"
              className="profile-edit-button"
              onClick={
                startEditing
              }
            >
              <Camera size={15} />
              Edit Profile
            </button>
          ) : (
            <div className="profile-header-actions">

              <button
                type="button"
                className="profile-cancel-button"
                onClick={
                  cancelEditing
                }
                disabled={saving}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="profile-save-button"
                onClick={() =>
                  void handleSave()
                }
                disabled={saving}
              >
                <Check size={15} />
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

            </div>
          )}

        </div>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <header className="profile-page-heading">

          <div>
            <span className="profile-eyebrow">
              MY ACCOUNT
            </span>

            <h1>
              Profile
            </h1>

            <p>
              Manage your personal information,
              account details, and beauty journey.
            </p>
          </div>

          <div className="profile-heading-mark">
            <Sparkles size={20} />
          </div>

        </header>

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`profile-message ${messageType}`}
            role="status"
          >
            {messageType ===
            'success' ? (
              <Check size={17} />
            ) : (
              <X size={17} />
            )}

            <span>
              {message}
            </span>
          </div>
        )}

        {/* =====================================================
            MAIN PROFILE CARD
        ===================================================== */}

        <section className="profile-main-card">

          <div className="profile-main-identity">

            <div className="profile-avatar-wrap">

              {avatarPreview ? (
                <img
                  src={
                    avatarPreview
                  }
                  alt={
                    profile.full_name ??
                    'Customer profile'
                  }
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {initial}
                </div>
              )}

              {editing && (
                <>
                  <button
                    type="button"
                    className="profile-avatar-camera"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    aria-label="Change profile photo"
                  >
                    <Camera size={17} />
                  </button>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={
                      handleImageChange
                    }
                  />
                </>
              )}

            </div>

            <div className="profile-identity-copy">

              <h2>
                {profile.full_name ||
                  'Your Name'}
              </h2>

              <span className="profile-verified">
                <ShieldCheck size={14} />
                Verified Account
              </span>

              <div className="profile-contact-list">

                <div>
                  <Mail size={15} />
                  <span>
                    {profile.email ||
                      'Email not available'}
                  </span>
                </div>

                <div>
                  <Phone size={15} />
                  <span>
                    {profile.phone ||
                      'Mobile number not provided'}
                  </span>
                </div>

                <div>
                  <MapPin size={15} />
                  <span>
                    {profile.location ||
                      'Location not provided'}
                  </span>
                </div>

                <div>
                  <Clock3 size={15} />
                  <span>
                    Member since{' '}
                    {formatMemberDate(
                      profile.created_at,
                    )}
                  </span>
                </div>

              </div>

            </div>

          </div>

          <div className="profile-quote">

            <span>“</span>

            <p>
              Beauty begins the moment
              you decide to be yourself.
            </p>

            <small>
              — Coco Chanel
            </small>

          </div>

        </section>

        {/* =====================================================
            DETAILS CARDS
        ===================================================== */}

        <div className="profile-details-grid">

          {/* =================================================
              PERSONAL
          ================================================= */}

          <section className="profile-detail-card">

            <div className="profile-card-heading">

              <div className="profile-card-icon">
                <UserRound size={17} />
              </div>

              <div>
                <span>
                  PERSONAL INFORMATION
                </span>

                <h3>
                  Your Details
                </h3>
              </div>

            </div>

            {editing ? (
              <div className="profile-edit-form">

                <label>
                  <span>
                    Full Name
                  </span>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>

                <label>
                  <span>
                    Email Address
                  </span>

                  <input
                    type="email"
                    value={
                      profile.email ??
                      ''
                    }
                    disabled
                  />

                  <small>
                    Email is managed by
                    your authentication
                    account.
                  </small>
                </label>

                <label>
                  <span>
                    Mobile Number
                  </span>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </label>

                <label>
                  <span>
                    Date of Birth
                  </span>

                  <input
                    type="date"
                    value={
                      dateOfBirth
                    }
                    max={
                      new Date()
                        .toISOString()
                        .slice(
                          0,
                          10,
                        )
                    }
                    onChange={(event) =>
                      setDateOfBirth(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Gender
                  </span>

                  <select
                    value={gender}
                    onChange={(event) =>
                      setGender(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Non-binary">
                      Non-binary
                    </option>

                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Location
                  </span>

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value,
                      )
                    }
                    placeholder="City, State"
                    autoComplete="address-level2"
                  />
                </label>

              </div>
            ) : (
              <div className="profile-detail-rows">

                <div>
                  <span>
                    Full Name
                  </span>

                  <strong>
                    {profile.full_name ||
                      'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>
                    Email Address
                  </span>

                  <strong>
                    {profile.email ||
                      'Not available'}
                  </strong>
                </div>

                <div>
                  <span>
                    Mobile Number
                  </span>

                  <strong>
                    {profile.phone ||
                      'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>
                    Date of Birth
                  </span>

                  <strong>
                    {profile.date_of_birth
                      ? new Date(
                          `${profile.date_of_birth}T00:00:00`,
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          },
                        )
                      : 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>
                    Gender
                  </span>

                  <strong>
                    {profile.gender ||
                      'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {profile.location ||
                      'Not provided'}
                  </strong>
                </div>

              </div>
            )}

          </section>

          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section className="profile-detail-card">

            <div className="profile-card-heading">

              <div className="profile-card-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <span>
                  ACCOUNT INFORMATION
                </span>

                <h3>
                  Account Status
                </h3>
              </div>

            </div>

            <div className="profile-detail-rows">

              <div>
                <span>
                  Account Type
                </span>

                <strong>
                  {profile.role
                    ? profile.role
                        .charAt(0)
                        .toUpperCase() +
                      profile.role.slice(
                        1,
                      )
                    : 'Customer'}
                </strong>
              </div>

              <div>
                <span>
                  Account Status
                </span>

                <strong className="profile-status-active">
                  Active
                </strong>
              </div>

              <div>
                <span>
                  Email Verified
                </span>

                <strong className="profile-status-active">
                  Verified
                </strong>
              </div>

              <div>
                <span>
                  Phone Verified
                </span>

                <strong className="profile-status-active">
                  {profile.phone
                    ? 'Verified'
                    : 'Pending'}
                </strong>
              </div>

              <div>
                <span>
                  Profile Updated
                </span>

                <strong>
                  {formatActivityDate(
                    profile.updated_at,
                  )}
                </strong>
              </div>

            </div>

          </section>

          {/* =================================================
              ACTIVITY
          ================================================= */}

          <section className="profile-detail-card">

            <div className="profile-card-heading">

              <div className="profile-card-icon">
                <Sparkles size={17} />
              </div>

              <div>
                <span>
                  ACTIVITY SUMMARY
                </span>

                <h3>
                  Your Beauty Journey
                </h3>
              </div>

            </div>

            <div className="profile-summary-grid">

              <div className="profile-summary-box">
                <strong>
                  {bookingStats.total}
                </strong>

                <span>
                  Total Bookings
                </span>
              </div>

              <div className="profile-summary-box">
                <strong>
                  {bookingStats.completed}
                </strong>

                <span>
                  Completed
                </span>
              </div>

              <div className="profile-summary-box">
                <strong>
                  {bookingStats.upcoming}
                </strong>

                <span>
                  Upcoming
                </span>
              </div>

              <div className="profile-summary-box">
                <strong>
                  {bookingStats.confirmed}
                </strong>

                <span>
                  Confirmed
                </span>
              </div>

            </div>

            <button
              type="button"
              className="profile-view-bookings"
              onClick={() =>
                navigate(
                  '/account/bookings/beauty',
                )
              }
            >
              <span>
                View all beauty bookings
              </span>

              <ChevronRight size={17} />
            </button>

          </section>

        </div>

        {/* =====================================================
            RECENT ACTIVITY
        ===================================================== */}

        <section className="profile-recent-card">

          <div className="profile-recent-heading">

            <div>
              <span>
                RECENT ACTIVITY
              </span>

              <h3>
                Your recent appointments
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/account/bookings/beauty',
                )
              }
            >
              View all
              <ChevronRight size={15} />
            </button>

          </div>

          {recentBookings.length ===
          0 ? (
            <div className="profile-no-activity">

              <div className="profile-no-activity-icon">
                <Sparkles size={22} />
              </div>

              <strong>
                Your beauty journey starts here.
              </strong>

              <p>
                Book your first beauty service
                and your appointments will appear
                here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate('/services')
                }
              >
                Explore Services
              </button>

            </div>
          ) : (
            <div className="profile-recent-list">

              {recentBookings.map(
                (booking) => (
                  <article
                    key={
                      booking.id
                    }
                    className="profile-recent-item"
                  >

                    <div className="profile-recent-icon">
                      <Sparkles size={17} />
                    </div>

                    <div className="profile-recent-copy">

                      <strong>
                        {getServiceName(
                          booking.services,
                        )}
                      </strong>

                      <span>
                        {formatActivityDate(
                          booking.booking_date,
                        )}
                        {' · '}
                        {booking.booking_time.slice(
                          0,
                          5,
                        )}
                      </span>

                    </div>

                    <span
                      className={`profile-booking-status ${getStatusClass(
                        booking.status,
                      )}`}
                    >
                      {getStatusLabel(
                        booking.status,
                      )}
                    </span>

                    <strong className="profile-recent-price">
                      {formatCurrency(
                        Number(
                          booking.price,
                        ),
                      )}
                    </strong>

                  </article>
                ),
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            BOTTOM PROMO
        ===================================================== */}

        <section className="profile-bottom-card">

          <div>
            <span>
              WILDFLORAL
            </span>

            <h2>
              Your beauty journey,
              your way.
            </h2>

            <p>
              Keep your profile updated so
              every appointment feels personal,
              effortless, and beautifully yours.
            </p>
          </div>

          <div className="profile-bottom-mark">
            <Sparkles size={30} />
          </div>

        </section>

      </div>

      {/* =====================================================
          CROP MODAL
      ===================================================== */}

      {crop && (
        <div
          className="profile-crop-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-crop-title"
        >

          <div className="profile-crop-modal">

            <header className="profile-crop-header">

              <div>
                <span>
                  PROFILE PHOTO
                </span>

                <h2 id="profile-crop-title">
                  Adjust your photo
                </h2>

                <p>
                  Drag to reposition and use
                  the slider to zoom.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cancelCrop
                }
                aria-label="Close cropper"
              >
                <X size={20} />
              </button>

            </header>

            {/* =================================================
                CROP WORKSPACE
            ================================================= */}

            <div
              ref={
                cropAreaRef
              }
              className="profile-crop-workspace"
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
              onPointerLeave={(event) => {
                if (
                  dragRef.current.active
                ) {
                  handleCropPointerMove(
                    event,
                  )
                }
              }}
            >

              <div className="profile-crop-image-layer">

                <img
                  ref={
                    sourceImageRef
                  }
                  src={
                    crop.source
                  }
                  alt="Selected profile photo"
                  className="profile-crop-image"
                  onLoad={
                    handleCropImageLoad
                  }
                  draggable={
                    false
                  }
                  style={
                    baseImageSize
                      ? {
                          width:
                            baseImageSize.width,
                          height:
                            baseImageSize.height,
                          left:
                            '50%',
                          top:
                            '50%',
                          transform:
                            `translate(-50%, -50%) translate(${cropX}px, ${cropY}px) scale(${zoom})`,
                        }
                      : undefined
                  }
                />

              </div>

              {/* CIRCLE CROP GUIDE */}

              <div
                className="profile-crop-guide"
                aria-hidden="true"
              />

              <div
                className="profile-crop-center"
                aria-hidden="true"
              />

              {!sourceSize && (
                <div className="profile-crop-loading">
                  <div className="profile-loading-spinner" />
                  <span>
                    Preparing photo...
                  </span>
                </div>
              )}

            </div>

            {/* =================================================
                CONTROLS
            ================================================= */}

            <div className="profile-crop-controls">

              <div className="profile-crop-control-heading">

                <span>
                  Zoom
                </span>

                <output>
                  {Math.round(
                    zoom * 100,
                  )}
                  %
                </output>

              </div>

              <div className="profile-crop-slider-row">

                <button
                  type="button"
                  onClick={() => {
                    const nextZoom =
                      clamp(
                        zoom -
                          ZOOM_STEP,
                        MIN_ZOOM,
                        MAX_ZOOM,
                      )

                    const bounds =
                      getMovementBounds(
                        nextZoom,
                      )

                    setZoom(
                      nextZoom,
                    )

                    setCropX(
                      (current) =>
                        clamp(
                          current,
                          -bounds.x,
                          bounds.x,
                        ),
                    )

                    setCropY(
                      (current) =>
                        clamp(
                          current,
                          -bounds.y,
                          bounds.y,
                        ),
                    )
                  }}
                  aria-label="Zoom out"
                >
                  −
                </button>

                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={
                    handleZoomChange
                  }
                  aria-label="Photo zoom"
                />

                <button
                  type="button"
                  onClick={() => {
                    const nextZoom =
                      clamp(
                        zoom +
                          ZOOM_STEP,
                        MIN_ZOOM,
                        MAX_ZOOM,
                      )

                    const bounds =
                      getMovementBounds(
                        nextZoom,
                      )

                    setZoom(
                      nextZoom,
                    )

                    setCropX(
                      (current) =>
                        clamp(
                          current,
                          -bounds.x,
                          bounds.x,
                        ),
                    )

                    setCropY(
                      (current) =>
                        clamp(
                          current,
                          -bounds.y,
                          bounds.y,
                        ),
                    )
                  }}
                  aria-label="Zoom in"
                >
                  +
                </button>

              </div>

              <button
                type="button"
                className="profile-crop-reset"
                onClick={
                  resetCrop
                }
              >
                Reset
              </button>

            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <footer className="profile-crop-actions">

              <button
                type="button"
                className="profile-crop-cancel"
                onClick={
                  cancelCrop
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="profile-crop-confirm"
                onClick={() =>
                  void confirmCrop()
                }
                disabled={
                  !sourceSize
                }
              >
                <Check size={16} />
                Use This Photo
              </button>

            </footer>

          </div>

        </div>
      )}

    </main>
  )
}

export default CustomerProfile