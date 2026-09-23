import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent,
} from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'
import fashionHero from '../../../assets/wildfloral/fashion.png'

import {
  addToFashionCart,
  clearFashionCart,
  getFashionCart,
  getFashionCartCount,
  removeFromFashionCart,
  updateFashionCartQuantity,
  type FashionCartItem,
} from '../../../lib/fashionCart'

import './Fashion.css'

/* =========================================================
   CONSTANTS
========================================================= */

const ALL = 'all'
const PAGE_SIZE = 8
const HERO_INTERVAL = 5600
const WISHLIST_KEY = 'wildfloral_fashion_wishlist'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A to Z' },
  { value: 'name-za', label: 'Name: Z to A' },
] as const

/* =========================================================
   TYPES
========================================================= */

type FashionCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

type FashionSubcategory = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

type FashionImage = {
  id: string
  design_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

type FashionSize = {
  id: string
  design_id: string
  size: string
  price: number | string
  stock_quantity: number | string
  is_active: boolean
}

type FashionDesign = {
  id: string
  subcategory_id: string
  name: string
  slug: string
  description: string

  product_details: string
  additional_information: string

  is_active: boolean
  is_featured: boolean

  delivery_min_days: number
  delivery_max_days: number

  created_at: string

  images: FashionImage[]
  sizes: FashionSize[]

  category: FashionCategory | null
  subcategory: FashionSubcategory | null
}

type FashionDesignRow = Omit<
  FashionDesign,
  'images' | 'sizes' | 'category' | 'subcategory'
>

type FashionOffer = {
  id: string
  title: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  promo_code: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  is_active: boolean
  applies_to_all: boolean
  priority: number
}

type OfferCategory = { offer_id: string; category_id: string }
type OfferSubcategory = { offer_id: string; subcategory_id: string }
type OfferDesign = { offer_id: string; design_id: string }

type OfferScope = {
  offer: FashionOffer
  categoryIds: string[]
  subcategoryIds: string[]
  designIds: string[]
}

type GalleryImage = {
  id: string
  url: string
  alt: string
}

type HeroSlide = {
  id: string
  image: string
  alt: string
  design: FashionDesign | null
}

type ToastState = {
  id: number
  message: string
} | null

type PageItem = number | 'gap-start' | 'gap-end'

/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M14.5 5l-7 7 7 7' : 'M9.5 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 8h14l-1 12H6L5 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 0 1 6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null

  const value = imageUrl.trim()

  return value || null
}

function getSortedImages(images: FashionImage[]): FashionImage[] {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1

    return a.display_order - b.display_order
  })
}

/** Every valid image of a design, primary first, ready to render. */
function getGallery(design: FashionDesign): GalleryImage[] {
  return getSortedImages(design.images).flatMap((image) => {
    const url = getImageUrl(image.image_url)

    return url
      ? [{ id: image.id, url, alt: image.alt_text || design.name }]
      : []
  })
}

function getActiveSizes(sizes: FashionSize[]): FashionSize[] {
  return sizes
    .filter((size) => size.is_active)
    .sort((a, b) => Number(a.price) - Number(b.price))
}

function pickDefaultSize(sizes: FashionSize[]): FashionSize | null {
  return (
    sizes.find((size) => Number(size.stock_quantity) > 0) ??
    sizes[0] ??
    null
  )
}

function getLowestPrice(sizes: FashionSize[]): number | null {
  const activeSizes = getActiveSizes(sizes)

  if (!activeSizes.length) return null

  return Math.min(...activeSizes.map((size) => Number(size.price)))
}

function getStockState(stock: number): 'out' | 'low' | 'ok' {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'

  return 'ok'
}

function getDiscountText(offer: FashionOffer): string {
  if (offer.discount_type === 'percentage') {
    return `${Number(offer.discount_value)}% OFF`
  }

  return `${formatPrice(Number(offer.discount_value))} OFF`
}

function calculateDiscountedPrice(
  price: number,
  offer: FashionOffer | null,
): number {
  if (!offer) return price

  if (offer.discount_type === 'percentage') {
    return Math.max(
      0,
      Math.round(price - price * (Number(offer.discount_value) / 100)),
    )
  }

  return Math.max(0, price - Number(offer.discount_value))
}

function isOfferLive(offer: FashionOffer, now: number): boolean {
  if (!offer.is_active) return false

  const start = new Date(offer.starts_at).getTime()
  const end = offer.ends_at ? new Date(offer.ends_at).getTime() : Infinity

  return now >= start && now <= end
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()

  items.forEach((item) => {
    const key = getKey(item)
    const list = map.get(key)

    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  })

  return map
}

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const items: PageItem[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) items.push('gap-start')

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (end < total - 1) items.push('gap-end')

  items.push(total)

  return items
}

function readWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

/* =========================================================
   SWIPE HOOK
========================================================= */

function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const startX = useRef<number | null>(null)
  const endX = useRef<number | null>(null)

  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      startX.current = event.touches[0]?.clientX ?? null
      endX.current = null
    },

    onTouchMove: (event: TouchEvent<HTMLElement>) => {
      endX.current = event.touches[0]?.clientX ?? null
    },

    onTouchEnd: () => {
      if (startX.current !== null && endX.current !== null) {
        const distance = startX.current - endX.current

        if (Math.abs(distance) >= 40) {
          onSwipe(distance > 0 ? 1 : -1)
        }
      }

      startX.current = null
      endX.current = null
    },
  }
}

/* =========================================================
   LOAD FASHION DATA
========================================================= */

async function loadFashionData() {
  const [
    categoriesResult,
    subcategoriesResult,
    designsResult,
    imagesResult,
    sizesResult,
    offersResult,
    offerCategoriesResult,
    offerSubcategoriesResult,
    offerDesignsResult,
  ] = await Promise.all([
    supabase
      .from('fashion_categories')
      .select('id, name, slug, description, image_url')
      .eq('is_active', true)
      .order('name', { ascending: true }),

    supabase
      .from('fashion_subcategories')
      .select('id, category_id, name, slug, description, image_url')
      .eq('is_active', true)
      .order('name', { ascending: true }),

    supabase
      .from('fashion_designs')
      .select(`
        id,
        subcategory_id,
        name,
        slug,
        description,
        product_details,
        additional_information,
        is_active,
        is_featured,
        delivery_min_days,
        delivery_max_days,
        created_at
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('fashion_design_images')
      .select('id, design_id, image_url, alt_text, display_order, is_primary')
      .order('display_order', { ascending: true }),

    supabase
      .from('fashion_design_sizes')
      .select('id, design_id, size, price, stock_quantity, is_active')
      .eq('is_active', true)
      .order('price', { ascending: true }),

    supabase
      .from('fashion_offers')
      .select(`
        id,
        title,
        description,
        discount_type,
        discount_value,
        promo_code,
        image_url,
        starts_at,
        ends_at,
        is_active,
        applies_to_all,
        priority
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false }),

    supabase
      .from('fashion_offer_categories')
      .select('offer_id, category_id'),

    supabase
      .from('fashion_offer_subcategories')
      .select('offer_id, subcategory_id'),

    supabase
      .from('fashion_offer_designs')
      .select('offer_id, design_id'),
  ])

  const failed = [
    categoriesResult.error,
    subcategoriesResult.error,
    designsResult.error,
    imagesResult.error,
    sizesResult.error,
    offersResult.error,
    offerCategoriesResult.error,
    offerSubcategoriesResult.error,
    offerDesignsResult.error,
  ].find(Boolean)

  if (failed) {
    throw new Error(failed.message || 'Unable to load fashion catalogue.')
  }

  const categories = (categoriesResult.data ?? []) as FashionCategory[]
  const subcategories = (subcategoriesResult.data ?? []) as FashionSubcategory[]
  const designRows = (designsResult.data ?? []) as FashionDesignRow[]
  const images = (imagesResult.data ?? []) as FashionImage[]
  const sizes = (sizesResult.data ?? []) as FashionSize[]
  const offers = (offersResult.data ?? []) as FashionOffer[]
  const offerCategories = (offerCategoriesResult.data ?? []) as OfferCategory[]
  const offerSubcategories = (offerSubcategoriesResult.data ??
    []) as OfferSubcategory[]
  const offerDesigns = (offerDesignsResult.data ?? []) as OfferDesign[]

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  )

  const subcategoryMap = new Map(
    subcategories.map((subcategory) => [subcategory.id, subcategory]),
  )

  const imagesByDesign = groupBy(images, (image) => image.design_id)
  const sizesByDesign = groupBy(sizes, (size) => size.design_id)

  const designs: FashionDesign[] = designRows
  .map((design) => {
    const subcategory =
      subcategoryMap.get(design.subcategory_id) ?? null

    const category = subcategory
      ? categoryMap.get(subcategory.category_id) ?? null
      : null

    return {
      ...design,
      images: imagesByDesign.get(design.id) ?? [],
      sizes: sizesByDesign.get(design.id) ?? [],
      category,
      subcategory,
    }
  })
  .filter(
    (design) =>
      design.category !== null &&
      design.subcategory !== null,
  )

  const scopes = new Map<string, OfferScope>(
    offers.map((offer): [string, OfferScope] => [
      offer.id,
      { offer, categoryIds: [], subcategoryIds: [], designIds: [] },
    ]),
  )

  offerCategories.forEach((link) => {
    scopes.get(link.offer_id)?.categoryIds.push(link.category_id)
  })

  offerSubcategories.forEach((link) => {
    scopes.get(link.offer_id)?.subcategoryIds.push(link.subcategory_id)
  })

  offerDesigns.forEach((link) => {
    scopes.get(link.offer_id)?.designIds.push(link.design_id)
  })

  return {
    categories,
    subcategories,
    designs,
    offerScopes: Array.from(scopes.values()),
  }
}

/* =========================================================
   OFFER MATCHING
========================================================= */

function getApplicableOffer(
  design: FashionDesign,
  offerScopes: OfferScope[],
  now: number,
): FashionOffer | null {
  const applicable = offerScopes.filter((scope) => {
    if (!isOfferLive(scope.offer, now)) return false
    if (scope.offer.applies_to_all) return true
    if (scope.designIds.includes(design.id)) return true

    if (
      design.subcategory?.id &&
      scope.subcategoryIds.includes(design.subcategory.id)
    ) {
      return true
    }

    if (
      design.category?.id &&
      scope.categoryIds.includes(design.category.id)
    ) {
      return true
    }

    return false
  })

  if (!applicable.length) return null

  return [...applicable].sort(
    (a, b) => Number(b.offer.priority) - Number(a.offer.priority),
  )[0].offer
}

/* =========================================================
   CATEGORY / SUBCATEGORY CARD
========================================================= */

function CircleCard({
  name,
  imageUrl,
  active,
  subcategory = false,
  onClick,
}: {
  name: string
  imageUrl: string | null
  active: boolean
  subcategory?: boolean
  onClick: () => void
}) {
  const image = getImageUrl(imageUrl)

  return (
    <button
      type="button"
      className={`fashion-circle-card ${subcategory ? 'subcategory' : ''} ${
        active ? 'active' : ''
      }`}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="fashion-circle-image">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <span className="fashion-circle-label">{name}</span>
    </button>
  )
}

/* =========================================================
   CARD IMAGE SLIDER  (shows ALL images of a design)
========================================================= */

function CardImageSlider({
  images,
  name,
  onOpen,
}: {
  images: GalleryImage[]
  name: string
  onOpen: () => void
}) {
  const [index, setIndex] = useState(0)
  const count = images.length

  const go = useCallback(
    (direction: number) => {
      setIndex((current) =>
        count ? (current + direction + count) % count : 0,
      )
    },
    [count],
  )

  const swipe = useSwipe(go)

  if (!count) {
    return (
      <div
        className="fashion-card-image-placeholder"
        onClick={onOpen}
        aria-label={`${name} — no image available`}
      >
        <span>W</span>
      </div>
    )
  }

  const activeIndex = Math.min(index, count - 1)

  return (
    <div
      className="fashion-card-slider"
      onClick={onOpen}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      {images.map((image, imageIndex) => (
        <div
          key={image.id}
          className={`fashion-card-slide ${
            imageIndex === activeIndex ? 'active' : ''
          }`}
          aria-hidden={imageIndex !== activeIndex}
        >
          <img
            src={image.url}
            alt={imageIndex === activeIndex ? image.alt : ''}
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            className="fashion-card-arrow left"
            onClick={(event) => {
              event.stopPropagation()
              go(-1)
            }}
            aria-label={`Previous image of ${name}`}
          >
            <ChevronIcon direction="left" />
          </button>

          <button
            type="button"
            className="fashion-card-arrow right"
            onClick={(event) => {
              event.stopPropagation()
              go(1)
            }}
            aria-label={`Next image of ${name}`}
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="fashion-card-dots">
            {images.map((image, imageIndex) => (
              <button
                key={image.id}
                type="button"
                className={imageIndex === activeIndex ? 'active' : ''}
                onClick={(event) => {
                  event.stopPropagation()
                  setIndex(imageIndex)
                }}
                onMouseEnter={() => setIndex(imageIndex)}
                aria-label={`Show image ${imageIndex + 1} of ${count}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* =========================================================
   DESIGN CARD
========================================================= */

function FashionDesignCard({
  design,
  offer,
  wishlist,
  onWishlist,
  onAddToCart,
  onRemoveFromCart,
  isInCart,
  onBookNow,
  onViewDetails,
}: {
  design: FashionDesign
  offer: FashionOffer | null
  wishlist: boolean
  onWishlist: (designId: string) => void
  onAddToCart: (design: FashionDesign, size: FashionSize) => void
  onRemoveFromCart: (design: FashionDesign, size: FashionSize) => void
  isInCart: (designId: string, sizeId: string) => boolean
  onBookNow: (design: FashionDesign, size: FashionSize) => void
  onViewDetails: (design: FashionDesign) => void
}) {
  const activeSizes = useMemo(() => getActiveSizes(design.sizes), [design.sizes])
  const gallery = useMemo(() => getGallery(design), [design])

  const [selectedSizeId, setSelectedSizeId] = useState(
    () => pickDefaultSize(activeSizes)?.id ?? '',
  )

  const selectedSize =
    activeSizes.find((size) => size.id === selectedSizeId) ??
    pickDefaultSize(activeSizes)

  const stock = selectedSize ? Number(selectedSize.stock_quantity) : 0
  const stockState = getStockState(stock)
  const basePrice = selectedSize ? Number(selectedSize.price) : null

  const discountedPrice =
    basePrice !== null ? calculateDiscountedPrice(basePrice, offer) : null

  const hasDiscount =
    basePrice !== null &&
    discountedPrice !== null &&
    discountedPrice < basePrice

  const isAvailable = Boolean(selectedSize?.is_active && stock > 0)

  const selectedSizeInCart = selectedSize
    ? isInCart(design.id, selectedSize.id)
    : false

  return (
    <article className="fashion-design-card">
      {/* IMAGE SLIDER */}
      <div className="fashion-card-media">
        <CardImageSlider
          images={gallery}
          name={design.name}
          onOpen={() => onViewDetails(design)}
        />

        {hasDiscount && offer && (
          <span className="fashion-discount-badge">
            {getDiscountText(offer)}
          </span>
        )}

        <button
          type="button"
          className={`fashion-wishlist-button ${wishlist ? 'active' : ''}`}
          onClick={() => onWishlist(design.id)}
          aria-pressed={wishlist}
          aria-label={
            wishlist
              ? `Remove ${design.name} from wishlist`
              : `Add ${design.name} to wishlist`
          }
        >
          <HeartIcon filled={wishlist} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="fashion-design-content">
        <div className="fashion-product-category">
          {design.category?.name || 'FASHION'}
          <span>/</span>
          {design.subcategory?.name || 'STYLE'}
        </div>

        <h3>{design.name}</h3>

        <div className="fashion-price-row">
          <div className="fashion-price-group">
            {discountedPrice !== null ? (
              <>
                <strong className="fashion-current-price">
                  {formatPrice(discountedPrice)}
                </strong>

                {hasDiscount && basePrice !== null && (
                  <del className="fashion-original-price">
                    {formatPrice(basePrice)}
                  </del>
                )}
              </>
            ) : (
              <strong className="fashion-current-price">Price on request</strong>
            )}
          </div>

          <button
            type="button"
            className="fashion-view-details-button"
            onClick={() => onViewDetails(design)}
          >
            <span>View details</span>
            <ArrowIcon />
          </button>
        </div>

        <p className="fashion-design-description">{design.description}</p>

        {/* SIZES */}
        <div className="fashion-size-section">
          <div className="fashion-size-heading">
            <span>Size</span>
            <strong>{selectedSize?.size || '—'}</strong>
          </div>

          <div
            className="fashion-size-list"
            role="group"
            aria-label={`Available sizes for ${design.name}`}
          >
            {activeSizes.map((size) => {
              const sizeStock = Number(size.stock_quantity)
              const available = sizeStock > 0

              return (
                <button
                  key={size.id}
                  type="button"
                  className={size.id === selectedSize?.id ? 'active' : ''}
                  disabled={!available}
                  onClick={() => setSelectedSizeId(size.id)}
                  aria-pressed={size.id === selectedSize?.id}
                  title={
                    available
                      ? `${size.size} - ${sizeStock} available`
                      : `${size.size} - Out of stock`
                  }
                >
                  {size.size}
                </button>
              )
            })}
          </div>
        </div>

        {/* STOCK + DELIVERY */}
        <div className="fashion-stock-delivery-row">
          <div className={`fashion-stock-left ${stockState}`}>
            {stockState === 'out'
              ? 'Out of stock'
              : stockState === 'low'
                ? `Only ${stock} left`
                : `${stock} available`}
          </div>

          <div className="fashion-delivery">
            <span className="fashion-delivery-icon">
              <CheckIcon />
            </span>

            <span>
              Delivery{' '}
              <strong>
                {design.delivery_min_days}–{design.delivery_max_days} days
              </strong>
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="fashion-card-actions">
          <button
            type="button"
            className={`fashion-cart-button ${
              selectedSizeInCart ? 'remove' : ''
            }`}
            disabled={!isAvailable}
            onClick={() => {
              if (!selectedSize || !isAvailable) return

              if (selectedSizeInCart) {
                onRemoveFromCart(design, selectedSize)
              } else {
                onAddToCart(design, selectedSize)
              }
            }}
          >
            {selectedSizeInCart ? 'Remove from cart' : 'Add to cart'}
          </button>

          <button
            type="button"
            className="fashion-book-button"
            disabled={!isAvailable}
            onClick={() => {
              if (selectedSize && isAvailable) {
                onBookNow(design, selectedSize)
              }
            }}
          >
            Book now
          </button>
        </div>
      </div>
    </article>
  )
}

/* =========================================================
   PRODUCT DETAILS MODAL
========================================================= */

function FashionProductDetailsModal({
  design,
  offer,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  onBookNow,
  isInCart,
}: {
  design: FashionDesign
  offer: FashionOffer | null
  onClose: () => void
  onAddToCart: (design: FashionDesign, size: FashionSize) => void
  onRemoveFromCart: (design: FashionDesign, size: FashionSize) => void
  onBookNow: (design: FashionDesign, size: FashionSize) => void
  isInCart: (designId: string, sizeId: string) => boolean
}) {
  const sizes = useMemo(() => getActiveSizes(design.sizes), [design.sizes])
  const images = useMemo(() => getGallery(design), [design])

  const [selectedSizeId, setSelectedSizeId] = useState(
    () => pickDefaultSize(sizes)?.id ?? '',
  )
  const [imageIndex, setImageIndex] = useState(0)

  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const changeImage = useCallback(
    (direction: number) => {
      if (!images.length) return

      setImageIndex(
        (current) => (current + direction + images.length) % images.length,
      )
    },
    [images.length],
  )

  const swipe = useSwipe(changeImage)

  const selectedSize =
    sizes.find((size) => size.id === selectedSizeId) ?? pickDefaultSize(sizes)

  const stock = selectedSize ? Number(selectedSize.stock_quantity) : 0
  const stockState = getStockState(stock)
  const basePrice = selectedSize ? Number(selectedSize.price) : null

  const discountedPrice =
    basePrice !== null ? calculateDiscountedPrice(basePrice, offer) : null

  const hasDiscount =
    basePrice !== null &&
    discountedPrice !== null &&
    discountedPrice < basePrice

  const isAvailable = Boolean(selectedSize?.is_active && stock > 0)

  const selectedSizeInCart = selectedSize
    ? isInCart(design.id, selectedSize.id)
    : false

  const activeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0))
  const currentImage = images[activeImageIndex]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') changeImage(-1)
      if (event.key === 'ArrowRight') changeImage(1)
    }

    window.addEventListener('keydown', handleKeys)

    return () => window.removeEventListener('keydown', handleKeys)
  }, [onClose, changeImage])

  function handleZoomMove(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    event.currentTarget.style.setProperty('--zoom-x', `${x}%`)
    event.currentTarget.style.setProperty('--zoom-y', `${y}%`)
  }

  return (
    <div
      className="fashion-product-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="fashion-product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${design.name} product details`}
      >
        <header className="fashion-product-modal-header">
          <div>
            <span>Product details</span>
            <h2>{design.name}</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="fashion-product-modal-close"
            onClick={onClose}
            aria-label="Close product details"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="fashion-product-modal-body">
          {/* GALLERY */}
          <section className="fashion-product-gallery">
            {images.length > 1 && (
              <div className="fashion-product-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={index === activeImageIndex ? 'active' : ''}
                    onClick={() => setImageIndex(index)}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img src={image.url} alt={image.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div
              className="fashion-product-main-image"
              onMouseMove={handleZoomMove}
              onTouchStart={swipe.onTouchStart}
              onTouchMove={swipe.onTouchMove}
              onTouchEnd={swipe.onTouchEnd}
            >
              {currentImage ? (
                <img
                  key={currentImage.id}
                  src={currentImage.url}
                  alt={currentImage.alt}
                  draggable={false}
                />
              ) : (
                <div className="fashion-product-image-placeholder">
                  <span>W</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="fashion-product-image-arrow left"
                    onClick={() => changeImage(-1)}
                    aria-label="Previous product image"
                  >
                    <ChevronIcon direction="left" />
                  </button>

                  <button
                    type="button"
                    className="fashion-product-image-arrow right"
                    onClick={() => changeImage(1)}
                    aria-label="Next product image"
                  >
                    <ChevronIcon direction="right" />
                  </button>

                  <div className="fashion-product-image-indicators">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        className={index === activeImageIndex ? 'active' : ''}
                        onClick={() => setImageIndex(index)}
                        aria-label={`Image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* INFORMATION */}
          <section className="fashion-product-information">
            <div className="fashion-product-breadcrumb">
              {design.category?.name || 'FASHION'}
              <span>/</span>
              {design.subcategory?.name || 'STYLE'}
            </div>

            <h1>{design.name}</h1>

            <p className="fashion-product-description">{design.description}</p>

            <div className="fashion-product-price">
              {discountedPrice !== null ? (
                <>
                  <strong>{formatPrice(discountedPrice)}</strong>

                  {hasDiscount && basePrice !== null && (
                    <del>{formatPrice(basePrice)}</del>
                  )}

                  {hasDiscount && offer && <span>{getDiscountText(offer)}</span>}
                </>
              ) : (
                <strong>Price on request</strong>
              )}
            </div>

            <div className="fashion-product-size-section">
              <div className="fashion-product-size-heading">
                <strong>Select size</strong>
                <span>{selectedSize?.size || 'Unavailable'}</span>
              </div>

              <div
                className="fashion-product-size-list"
                role="group"
                aria-label="Select size"
              >
                {sizes.map((size) => {
                  const available = Number(size.stock_quantity) > 0

                  return (
                    <button
                      key={size.id}
                      type="button"
                      disabled={!available}
                      className={size.id === selectedSize?.id ? 'active' : ''}
                      aria-pressed={size.id === selectedSize?.id}
                      onClick={() => setSelectedSizeId(size.id)}
                    >
                      {size.size}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSize && (
              <div className={`fashion-product-stock ${stockState}`}>
                {stockState === 'out'
                  ? 'Out of stock'
                  : stockState === 'low'
                    ? `Only ${stock} left in stock`
                    : `${stock} available in stock`}
              </div>
            )}

            <div className="fashion-product-delivery">
              <span className="fashion-delivery-icon">
                <CheckIcon />
              </span>

              <span>
                Delivery{' '}
                <strong>
                  {design.delivery_min_days}–{design.delivery_max_days} days
                </strong>
              </span>
            </div>

            <div className="fashion-product-actions">
              <button
                type="button"
                className={selectedSizeInCart ? 'remove' : ''}
                disabled={!isAvailable}
                onClick={() => {
                  if (!selectedSize || !isAvailable) return

                  if (selectedSizeInCart) {
                    onRemoveFromCart(design, selectedSize)
                  } else {
                    onAddToCart(design, selectedSize)
                  }
                }}
              >
                {selectedSizeInCart ? 'Remove from cart' : 'Add to cart'}
              </button>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  if (selectedSize && isAvailable) {
                    onBookNow(design, selectedSize)
                    onClose()
                  }
                }}
              >
                Book now
              </button>
            </div>

            {design.product_details?.trim() && (
              <section className="fashion-product-info-section">
                <h2>About this item</h2>
                <div className="fashion-product-text">
                  {design.product_details}
                </div>
              </section>
            )}

            {design.additional_information?.trim() && (
              <section className="fashion-product-info-section">
                <h2>Additional information</h2>
                <div className="fashion-product-text">
                  {design.additional_information}
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   PROMOTION CARD
========================================================= */

function FashionPromoCard({
  offer,
  featured,
}: {
  offer: FashionOffer
  featured?: boolean
}) {
  const image = getImageUrl(offer.image_url)

  return (
    <article
      className={`fashion-promo-card ${featured ? 'fashion-promo-featured' : ''}`}
    >
      <div className="fashion-promo-copy">
        <span className="fashion-promo-label">
          {featured ? 'EXCLUSIVE FASHION OFFER' : 'FASHION OFFER'}
        </span>

        <h2>{offer.title}</h2>

        <strong className="fashion-promo-discount">
          {getDiscountText(offer)}
        </strong>

        <p>{offer.description}</p>

        {offer.promo_code && (
          <div className="fashion-promo-code">
            <span>USE CODE</span>
            <strong>{offer.promo_code}</strong>
          </div>
        )}

        {offer.ends_at && (
          <div className="fashion-promo-validity">
            Valid until {formatDate(offer.ends_at)}
          </div>
        )}

        <a href="#fashion-designs" className="fashion-promo-button">
          Explore designs
          <ArrowIcon />
        </a>
      </div>

      <div className="fashion-promo-art">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <div className="fashion-promo-placeholder">
            <span>W</span>
          </div>
        )}
      </div>
    </article>
  )
}

/* =========================================================
   SORT DROPDOWN
========================================================= */

function FashionSortDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  const selected =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function closeOnOutsideClick() {
      setOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('click', closeOnOutsideClick)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('click', closeOnOutsideClick)
    }
  }, [open])

  return (
    <div className={`fashion-sort-dropdown ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="fashion-sort-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
      >
        <span>Sort by</span>
        <strong>{selected.label}</strong>
        <span className="fashion-sort-arrow">↑</span>
      </button>

      {open && (
        <div
          className="fashion-sort-menu"
          role="listbox"
          onClick={(event) => event.stopPropagation()}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={value === option.value ? 'active' : ''}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   HORIZONTAL CAROUSEL
========================================================= */

function FashionCarousel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(direction: number) {
    ref.current?.scrollBy({ left: direction * 300, behavior: 'smooth' })
  }

  return (
    <div className={`fashion-carousel ${className}`}>
      <button
        type="button"
        className="fashion-carousel-arrow left"
        onClick={() => scroll(-1)}
        aria-label="Previous"
      >
        <ChevronIcon direction="left" />
      </button>

      <div ref={ref} className="fashion-carousel-track">
        {children}
      </div>

      <button
        type="button"
        className="fashion-carousel-arrow right"
        onClick={() => scroll(1)}
        aria-label="Next"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  )
}

/* =========================================================
   HERO
========================================================= */

function FashionHero({
  designs,
  onViewDetails,
}: {
  designs: FashionDesign[]
  onViewDetails: (design: FashionDesign) => void
}) {
  const slides = useMemo<HeroSlide[]>(() => {
    const list: HeroSlide[] = [
      {
        id: 'brand',
        image: fashionHero,
        alt: 'WildFloral fashion collection',
        design: null,
      },
    ]

    designs.forEach((design) => {
      if (list.length >= 6) return

      const image = getGallery(design)[0]

      if (image) {
        list.push({
          id: design.id,
          image: image.url,
          alt: image.alt,
          design,
        })
      }
    })

    return list
  }, [designs])

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = slides.length
  const activeIndex = Math.min(index, count - 1)
  const active = slides[activeIndex]

  const deliveryRange = useMemo(() => {
    if (!designs.length) return null

    return {
      min: Math.min(...designs.map((design) => Number(design.delivery_min_days))),
      max: Math.max(...designs.map((design) => Number(design.delivery_max_days))),
    }
  }, [designs])

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setTimeout(() => {
      setIndex((activeIndex + 1) % count)
    }, HERO_INTERVAL)

    return () => window.clearTimeout(timer)
  }, [count, paused, activeIndex])

  function move(direction: number) {
    setIndex((activeIndex + direction + count) % count)
  }

  const spotlightDesign = active.design
  const spotlightPrice = spotlightDesign
    ? getLowestPrice(spotlightDesign.sizes)
    : null

  return (
    <section className="fashion-hero">
      <div className="fashion-hero-copy">
        <span className="fashion-hero-eyebrow">WildFloral fashion</span>

        <h1>
          Fashion made <em>around you</em>
        </h1>

        <p className="fashion-hero-lead">
          Browse designs by category, choose your size and book it. Can’t find
          the one you have in mind? We’ll design it with you.
        </p>

        <div className="fashion-hero-cta">
          <a href="#fashion-designs" className="fashion-hero-button">
            Shop the collection
            <ArrowIcon />
          </a>

          <Link to="/fashion/custom" className="fashion-hero-link">
            Request a custom design
          </Link>
        </div>

        <ul className="fashion-hero-points">
          <li>
            <span className="fashion-delivery-icon">
              <CheckIcon />
            </span>
            Sizes and stock shown before you book
          </li>

          <li>
            <span className="fashion-delivery-icon">
              <CheckIcon />
            </span>
            {deliveryRange
              ? `Delivery in ${deliveryRange.min}–${deliveryRange.max} days`
              : 'Delivered to your door'}
          </li>

          <li>
            <span className="fashion-delivery-icon">
              <CheckIcon />
            </span>
            Custom pieces cut to your measurements
          </li>
        </ul>
      </div>

      <div
        className="fashion-hero-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="fashion-hero-frame">
          {slides.map((slide, slideIndex) => (
            <img
              key={slide.id}
              src={slide.image}
              alt={slideIndex === activeIndex ? slide.alt : ''}
              className={slideIndex === activeIndex ? 'active' : ''}
              loading={slideIndex === 0 ? 'eager' : 'lazy'}
              aria-hidden={slideIndex !== activeIndex}
              draggable={false}
            />
          ))}

          {count > 1 && (
            <div className="fashion-hero-controls">
              <button
                type="button"
                className="fashion-hero-arrow"
                onClick={() => move(-1)}
                aria-label="Previous slide"
              >
                <ChevronIcon direction="left" />
              </button>

              <div className="fashion-hero-progress">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={slideIndex === activeIndex ? 'active' : ''}
                    onClick={() => setIndex(slideIndex)}
                    aria-label={`Show slide ${slideIndex + 1} of ${count}`}
                  >
                    {slideIndex === activeIndex && (
                      <span
                        key={`${slide.id}-${paused ? 'paused' : 'running'}`}
                        className={`fashion-hero-fill ${paused ? 'paused' : ''}`}
                      />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="fashion-hero-arrow"
                onClick={() => move(1)}
                aria-label="Next slide"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          )}
        </div>

        <div className="fashion-hero-spotlight" key={active.id}>
          {spotlightDesign ? (
            <>
              <span className="fashion-spotlight-label">
                {spotlightDesign.subcategory?.name ||
                  spotlightDesign.category?.name ||
                  'Featured'}
              </span>

              <strong>{spotlightDesign.name}</strong>

              {spotlightPrice !== null && (
                <span className="fashion-spotlight-price">
                  From {formatPrice(spotlightPrice)}
                </span>
              )}

              <button
                type="button"
                className="fashion-spotlight-button"
                onClick={() => onViewDetails(spotlightDesign)}
              >
                View details
                <ArrowIcon />
              </button>
            </>
          ) : (
            <>
              <span className="fashion-spotlight-label">The edit</span>
              <strong>The WildFloral collection</strong>
              <span className="fashion-spotlight-price">
                Made in your size
              </span>

              <a href="#fashion-designs" className="fashion-spotlight-button">
                Browse designs
                <ArrowIcon />
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   MAIN PAGE
========================================================= */

function Fashion() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<FashionCategory[]>([])
  const [subcategories, setSubcategories] = useState<FashionSubcategory[]>([])
  const [designs, setDesigns] = useState<FashionDesign[]>([])
  const [offerScopes, setOfferScopes] = useState<OfferScope[]>([])

  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [selectedSubcategory, setSelectedSubcategory] = useState(ALL)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [cartItems, setCartItems] = useState<FashionCartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const [selectedDesignForDetails, setSelectedDesignForDetails] =
    useState<FashionDesign | null>(null)

  const [wishlistIds, setWishlistIds] = useState<string[]>(readWishlist)
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState<ToastState>(null)

  const cartCount = getFashionCartCount()

  /* LOAD */

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await loadFashionData()

      setCategories(data.categories)
      setSubcategories(data.subcategories)
      setDesigns(data.designs)
      setOfferScopes(data.offerScopes)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load fashion catalogue.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

    useEffect(() => {
    void loadData()
  }, [loadData])

  /* REFRESH CATALOGUE WHEN PAGE BECOMES ACTIVE */

  useEffect(() => {
    function handleWindowFocus() {
      void loadData()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadData()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      window.removeEventListener(
        'focus',
        handleWindowFocus,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [loadData])

    /* CART INIT */

  useEffect(() => {
    function syncCartFromStorage() {
      setCartItems(getFashionCart())
    }

    syncCartFromStorage()

    window.addEventListener(
      'focus',
      syncCartFromStorage,
    )

    document.addEventListener(
      'visibilitychange',
      syncCartFromStorage,
    )

    return () => {
      window.removeEventListener(
        'focus',
        syncCartFromStorage,
      )

      document.removeEventListener(
        'visibilitychange',
        syncCartFromStorage,
      )
    }
  }, [])

  /* WISHLIST PERSISTENCE */

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds))
    } catch {
      /* storage unavailable — wishlist stays in memory */
    }
  }, [wishlistIds])

  /* CART BODY LOCK */

  useEffect(() => {
    if (!cartOpen) return

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen])

  /* OFFER CLOCK */

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)

    return () => window.clearInterval(timer)
  }, [])

  /* CART ESCAPE */

  useEffect(() => {
    if (!cartOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setCartOpen(false)
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [cartOpen])

  /* TOAST */

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(null), 2800)

    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message })
  }, [])

  const closeDetails = useCallback(() => {
    setSelectedDesignForDetails(null)
  }, [])

  /* FILTERS */

  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(ALL)
  }

  function handleSubcategoryChange(subcategoryId: string) {
    setSelectedSubcategory(subcategoryId)

    window.setTimeout(() => {
      document
        .getElementById('fashion-designs')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function clearFilters() {
    setSelectedCategory(ALL)
    setSelectedSubcategory(ALL)
    setSearch('')
  }

  const visibleSubcategories = useMemo(() => {
  const activeCategoryIds = new Set(
    categories.map((category) => category.id),
  )

  if (selectedCategory === ALL) {
    return subcategories.filter((subcategory) =>
      activeCategoryIds.has(subcategory.category_id),
    )
  }

  return subcategories.filter(
    (subcategory) =>
      subcategory.category_id === selectedCategory &&
      activeCategoryIds.has(subcategory.category_id),
  )
}, [categories, subcategories, selectedCategory])

  /* FILTER + SORT */

  const filteredDesigns = useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = designs.filter((design) => {
      const matchesCategory =
        selectedCategory === ALL || design.category?.id === selectedCategory

      const matchesSubcategory =
        selectedSubcategory === ALL ||
        design.subcategory?.id === selectedSubcategory

      const matchesSearch =
        !query ||
        [
          design.name,
          design.slug,
          design.description,
          design.category?.name,
          design.subcategory?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesCategory && matchesSubcategory && matchesSearch
    })

    return [...result].sort((a, b) => {
      if (sortBy === 'price-low') {
        return (
          (getLowestPrice(a.sizes) ?? Infinity) -
          (getLowestPrice(b.sizes) ?? Infinity)
        )
      }

      if (sortBy === 'price-high') {
        return (getLowestPrice(b.sizes) ?? 0) - (getLowestPrice(a.sizes) ?? 0)
      }

      if (sortBy === 'name-az') return a.name.localeCompare(b.name)
      if (sortBy === 'name-za') return b.name.localeCompare(a.name)

      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  }, [designs, selectedCategory, selectedSubcategory, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredDesigns.length / PAGE_SIZE))

  const paginatedDesigns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE

    return filteredDesigns.slice(start, start + PAGE_SIZE)
  }, [filteredDesigns, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedSubcategory, search, sortBy])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  function goToPage(page: number) {
    setCurrentPage(page)

    document
      .getElementById('fashion-designs')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* WISHLIST */

  function toggleWishlist(designId: string) {
    setWishlistIds((current) =>
      current.includes(designId)
        ? current.filter((id) => id !== designId)
        : [...current, designId],
    )
  }

  /* CART */

  function syncCart(cart: FashionCartItem[]) {
    setCartItems(cart)
  }

  function isFashionItemInCart(designId: string, designSizeId: string) {
    return cartItems.some(
      (item) =>
        item.designId === designId &&
        item.designSizeId === designSizeId &&
        Number(item.quantity) > 0,
    )
  }

  function handleAddToCart(
  design: FashionDesign,
  size: FashionSize,
) {
  const stock = Number(size.stock_quantity)

  if (!size.is_active || stock <= 0) {
    showToast('This item is currently out of stock')
    return
  }

  const existingItem = cartItems.find(
    (item) =>
      item.designId === design.id &&
      item.designSizeId === size.id,
  )

  const currentQuantity = existingItem
    ? Number(existingItem.quantity)
    : 0

  if (currentQuantity >= stock) {
    showToast(
      `Only ${stock} ${size.size} item${
        stock === 1 ? '' : 's'
      } available`,
    )
    return
  }

  const cart = addToFashionCart({
    designId: design.id,
    designSizeId: size.id,
    size: size.size,
    quantity: 1,
  })

  syncCart(cart)

  showToast(
    `${design.name} (${size.size}) added to your cart`,
  )
}

function handleRemoveFromCart(
  design: FashionDesign,
  size: FashionSize,
) {
  syncCart(
    removeFromFashionCart(
      design.id,
      size.id,
    ),
  )

  showToast(
    `${design.name} (${size.size}) removed from your cart`,
  )
}

function getCartItemStock(
  item: FashionCartItem,
) {
  const design = designs.find(
    (design) => design.id === item.designId,
  )

  const size = design?.sizes.find(
    (size) => size.id === item.designSizeId,
  )

  return size
    ? Number(size.stock_quantity)
    : 0
}

function handleIncreaseCartItem(
  item: FashionCartItem,
) {
  const stock = getCartItemStock(item)
  const currentQuantity = Number(item.quantity)

  if (stock <= 0) {
    showToast('This item is out of stock')
    return
  }

  if (currentQuantity >= stock) {
    showToast(
      `Only ${stock} available in stock`,
    )
    return
  }

  syncCart(
    updateFashionCartQuantity(
      item.designId,
      item.designSizeId,
      currentQuantity + 1,
    ),
  )
}

  function handleDecreaseCartItem(item: FashionCartItem) {
    syncCart(
      updateFashionCartQuantity(
        item.designId,
        item.designSizeId,
        Number(item.quantity) - 1,
      ),
    )
  }

  function handleRemoveCartItem(item: FashionCartItem) {
    syncCart(removeFromFashionCart(item.designId, item.designSizeId))
  }

  function handleClearCart() {
    clearFashionCart()
    syncCart([])
  }

  /* BOOK NOW */

  function handleBookNow(design: FashionDesign, size: FashionSize) {
    if (!size.is_active || Number(size.stock_quantity) <= 0) return

    const selection = {
      designId: design.id,
      designName: design.name,
      sizeId: size.id,
      size: size.size,
      price: Number(size.price),
      quantity: 1,
    }

    try {
      window.sessionStorage.setItem(
        'wildfloral_selected_fashion',
        JSON.stringify(selection),
      )
    } catch {
      /* storage unavailable — booking page will fall back to the cart */
    }

    if (!isFashionItemInCart(design.id, size.id)) {
      syncCart(
        addToFashionCart({
          designId: design.id,
          designSizeId: size.id,
          size: size.size,
          quantity: 1,
        }),
      )
    }

    navigate('/fashion-booking')
  }

  /* ACTIVE OFFERS */

  const activeOffers = useMemo(
    () =>
      offerScopes
        .filter(
          (scope) =>
            isOfferLive(scope.offer, now) &&
            (scope.offer.applies_to_all ||
              scope.categoryIds.length > 0 ||
              scope.subcategoryIds.length > 0 ||
              scope.designIds.length > 0),
        )
        .sort((a, b) => Number(b.offer.priority) - Number(a.offer.priority))
        .map((scope) => scope.offer),
    [offerScopes, now],
  )

  /* CART LINES */

  const cartLines = useMemo(
    () =>
      cartItems.map((item) => {
        const design =
          designs.find((entry) => entry.id === item.designId) ?? null

        const size =
          design?.sizes.find((entry) => entry.id === item.designSizeId) ?? null

        const offer = design ? getApplicableOffer(design, offerScopes, now) : null

        const basePrice = size ? Number(size.price) : null
        const unitPrice =
          basePrice !== null ? calculateDiscountedPrice(basePrice, offer) : null

        const image = design ? (getGallery(design)[0] ?? null) : null

        return { item, design, basePrice, unitPrice, image }
      }),
    [cartItems, designs, offerScopes, now],
  )

  const subtotal = cartLines.reduce(
    (sum, line) => sum + (line.unitPrice ?? 0) * Number(line.item.quantity),
    0,
  )

  /* LOADING */

  if (loading) {
    return (
      <main className="fashion-page">
        <div className="fashion-loading">
          <div className="fashion-spinner" />
          <span>Loading fashion collection...</span>
        </div>
      </main>
    )
  }

  /* PAGE */

  return (
    <main className="fashion-page">
      {/* HERO */}
      <FashionHero designs={designs} onViewDetails={setSelectedDesignForDetails} />

      {/* CATEGORIES */}
      <section className="fashion-category-section">
        <div className="fashion-section-heading">
          <div>
            <span className="fashion-section-eyebrow">SHOP BY CATEGORY</span>

            <h2>
              Find your
              <span>perfect style</span>
            </h2>
          </div>
        </div>

        <FashionCarousel>
          <button
            type="button"
            className={`fashion-circle-card ${
              selectedCategory === ALL ? 'active' : ''
            }`}
            onClick={() => handleCategoryChange(ALL)}
            aria-pressed={selectedCategory === ALL}
          >
            <div className="fashion-circle-image fashion-circle-all">ALL</div>
            <span className="fashion-circle-label">All</span>
          </button>

          {categories.map((category) => (
            <CircleCard
              key={category.id}
              name={category.name}
              imageUrl={category.image_url}
              active={selectedCategory === category.id}
              onClick={() => handleCategoryChange(category.id)}
            />
          ))}
        </FashionCarousel>
      </section>

      {/* SUBCATEGORIES */}
      {visibleSubcategories.length > 0 && (
        <section
          id="fashion-subcategories"
          className="fashion-category-section fashion-subcategory-section"
        >
          <div className="fashion-section-heading compact">
            <div>
              <span className="fashion-section-eyebrow">EXPLORE STYLES</span>

              <h2>
                Browse
                <span>collections</span>
              </h2>
            </div>
          </div>

          <FashionCarousel>
            <button
              type="button"
              className={`fashion-circle-card ${
                selectedSubcategory === ALL ? 'active' : ''
              }`}
              onClick={() => handleSubcategoryChange(ALL)}
              aria-pressed={selectedSubcategory === ALL}
            >
              <div className="fashion-circle-image fashion-circle-all">ALL</div>
              <span className="fashion-circle-label">All styles</span>
            </button>

            {visibleSubcategories.map((subcategory) => (
              <CircleCard
                key={subcategory.id}
                name={subcategory.name}
                imageUrl={subcategory.image_url}
                subcategory
                active={selectedSubcategory === subcategory.id}
                onClick={() => handleSubcategoryChange(subcategory.id)}
              />
            ))}
          </FashionCarousel>
        </section>
      )}

      {/* DESIGN CATALOGUE */}
      <section id="fashion-designs" className="fashion-designs-section">
        <div className="fashion-designs-header">
          <div>
            <span className="fashion-section-eyebrow">FASHION COLLECTION</span>

            <h2>
              Choose your
              <span>style</span>
            </h2>

            <p>{filteredDesigns.length} designs available</p>
          </div>

          <div className="fashion-tools">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search designs..."
              aria-label="Search fashion designs"
            />

            <FashionSortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {error && (
          <div className="fashion-error" role="alert">
            {error}
          </div>
        )}

        {paginatedDesigns.length === 0 ? (
          <div className="fashion-empty-state">
            <div>No fashion designs match your filters.</div>

            <button type="button" onClick={clearFilters}>
              View all designs
            </button>
          </div>
        ) : (
          <div className="fashion-designs-grid">
            {paginatedDesigns.map((design) => (
              <FashionDesignCard
                key={design.id}
                design={design}
                offer={getApplicableOffer(design, offerScopes, now)}
                wishlist={wishlistIds.includes(design.id)}
                onWishlist={toggleWishlist}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                isInCart={isFashionItemInCart}
                onBookNow={handleBookNow}
                onViewDetails={setSelectedDesignForDetails}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <nav className="fashion-pagination" aria-label="Pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronIcon direction="left" />
            </button>

            {getPageItems(currentPage, totalPages).map((item) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  className={currentPage === item ? 'active' : ''}
                  aria-current={currentPage === item ? 'page' : undefined}
                  onClick={() => goToPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className="fashion-pagination-gap">
                  …
                </span>
              ),
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronIcon direction="right" />
            </button>
          </nav>
        )}
      </section>

      {/* SPECIAL OFFERS */}
      {activeOffers.length > 0 && (
        <section className="fashion-offers-section">
          <div className="fashion-section-heading">
            <div>
              <span className="fashion-section-eyebrow">SPECIAL OFFERS</span>

              <h2>
                Exclusive
                <span>fashion offers</span>
              </h2>
            </div>

            <p>
              Enjoy current promotions across the WildFloral fashion
              collection.
            </p>
          </div>

          <div className="fashion-offers-grid">
            {activeOffers.slice(0, 2).map((offer, index) => (
              <FashionPromoCard
                key={offer.id}
                offer={offer}
                featured={index === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* CUSTOM DESIGN */}
      <section className="fashion-custom-section">
        <div className="fashion-custom-content">
          <span>PERSONALIZED FASHION</span>

          <h2>
            Have your own
            <em>design in mind?</em>
          </h2>

          <p>
            Create a personalized outfit designed around your measurements,
            preferences, and occasion.
          </p>

          <Link to="/fashion/custom" className="fashion-custom-button">
            Request custom design
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="fashion-benefits-strip">
        <div className="fashion-benefits-container">
          <div className="fashion-benefit-item">
            <div className="fashion-benefit-icon">✓</div>

            <div className="fashion-benefit-content">
              <strong>QUALITY PRODUCTS</strong>
              <span>Carefully selected materials</span>
            </div>
          </div>

          <div className="fashion-benefit-divider" />

          <div className="fashion-benefit-item">
            <div className="fashion-benefit-icon">✓</div>

            <div className="fashion-benefit-content">
              <strong>SECURE PAYMENT</strong>
              <span>Safe &amp; secure checkout</span>
            </div>
          </div>

          <div className="fashion-benefit-divider" />

          <div className="fashion-benefit-item">
            <div className="fashion-benefit-icon">↻</div>

            <div className="fashion-benefit-content">
              <strong>EASY SUPPORT</strong>
              <span>We’re here to help</span>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING CART */}
      <button
        type="button"
        className="fashion-floating-cart"
        onClick={() => setCartOpen(true)}
        aria-label={`Open shopping cart${cartCount ? `, ${cartCount} items` : ''}`}
      >
        <ShoppingBagIcon />

        {cartCount > 0 && <span>{cartCount}</span>}
      </button>

      {/* TOAST */}
      {toast && (
        <div className="fashion-toast" role="status" key={toast.id}>
          <span>{toast.message}</span>

          <button
            type="button"
            onClick={() => {
              setToast(null)
              setCartOpen(true)
            }}
          >
            View cart
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div
          className="fashion-cart-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false)
          }}
        >
          <aside
            className="fashion-cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <header className="fashion-cart-header">
              <div>
                <span>YOUR BAG</span>
                <h2>Shopping cart</h2>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <CloseIcon />
              </button>
            </header>

            {cartItems.length === 0 ? (
              <div className="fashion-cart-empty">
                <ShoppingBagIcon />

                <h3>Your cart is empty</h3>

                <p>Add a fashion design to begin your order.</p>

                <button type="button" onClick={() => setCartOpen(false)}>
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="fashion-cart-items">
                  {cartLines.map(({ item, design, basePrice, unitPrice, image }) => (
                    <div
                      key={`${item.designId}-${item.designSizeId}`}
                      className="fashion-cart-item"
                    >
                      <div className="fashion-cart-item-image">
                        {image ? (
                          <img
                            src={image.url}
                            alt={design?.name ?? 'Fashion design'}
                          />
                        ) : (
                          <span>W</span>
                        )}
                      </div>

                      <div className="fashion-cart-item-details">
                        <strong>{design?.name ?? 'Fashion design'}</strong>

                        <span>Size {item.size}</span>

                        {unitPrice !== null && (
                          <b>
                            {formatPrice(unitPrice)}
                            {basePrice !== null && unitPrice < basePrice && (
                              <del>{formatPrice(basePrice)}</del>
                            )}
                          </b>
                        )}
                      </div>

                      <div className="fashion-cart-quantity">
                        <button
                          type="button"
                          onClick={() => handleDecreaseCartItem(item)}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon />
                        </button>

                        <strong>{item.quantity}</strong>

                        <button
                            type="button"
                            disabled={
                              Number(item.quantity) >=
                              getCartItemStock(item)
                            }
                            onClick={() =>
                              handleIncreaseCartItem(item)
                            }
                            aria-label="Increase quantity"
                          >
                            <PlusIcon />
                          </button>
                      </div>

                      <button
                        type="button"
                        className="fashion-cart-remove"
                        onClick={() => handleRemoveCartItem(item)}
                        aria-label={`Remove ${design?.name ?? 'fashion item'}`}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>

                <footer className="fashion-cart-footer">
                  <div className="fashion-cart-subtotal">
                    <span>Estimated subtotal</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>

                  <p className="fashion-cart-note">
                    Final price and delivery are confirmed on the booking page.
                  </p>

                  <Link
                    to="/fashion-booking"
                    className="fashion-cart-checkout"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue to booking
                    <ArrowIcon />
                  </Link>

                  <button
                    type="button"
                    className="fashion-cart-clear"
                    onClick={handleClearCart}
                  >
                    Clear cart
                  </button>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedDesignForDetails && (
        <FashionProductDetailsModal
          design={selectedDesignForDetails}
          offer={getApplicableOffer(selectedDesignForDetails, offerScopes, now)}
          onClose={closeDetails}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onBookNow={handleBookNow}
          isInCart={isFashionItemInCart}
        />
      )}
    </main>
  )
}

export default Fashion
