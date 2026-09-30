import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '../../../lib/supabase'
import { SEO } from '../../../components/common/SEO'
import { FAQSection, HOME_FAQS } from '../../../components/common/FAQSection'
import { BusinessAtAGlance } from '../../../components/common/BusinessAtAGlance'
import {
  getLocalBusinessSchema,
  getOrganizationSchema,
  getWebSiteSchema,
  getFaqSchema,
} from '../../../lib/seoSchemas'
import './Home.css'

/* =========================================================
   EDITORIAL FEATURE IMAGES
========================================================= */

import homeFeatureImageOne from '../../../assets/home page/1.png'
import homeFeatureImageTwo from '../../../assets/home page/2.png'
import hairStylingImage from '../../../assets/home page/Hair Styling.png'
import bridalMakeupImage from '../../../assets/home page/Bridal Makeup.png'
import fashionPageImage from '../../../assets/home page/fashionpage.png'

/* =========================================================
   GALLERY IMAGES
   (1 & 2 are already used above — this uses the remaining
   images from the same "home page" assets folder.)
========================================================= */

import homeGalleryImageThree from '../../../assets/home page/3.png'
import homeGalleryImageFour from '../../../assets/home page/4.png'
import homeGalleryImageFive from '../../../assets/home page/5.png'
import homeGalleryImageSix from '../../../assets/home page/6.png'
import homeGalleryImageSeven from '../../../assets/home page/7.png'
import homeGalleryImageEight from '../../../assets/home page/8.png'
import homeGalleryImageNine from '../../../assets/home page/9.png'
import homeGalleryImageTen from '../../../assets/home page/10.png'

/* =========================================================
   DETAILS SECTION — SPLIT IMAGE
   Uses image 1 (already imported as homeFeatureImageOne)
   for the "Designed Specifically for You" panel.
========================================================= */

type HomeGalleryImage = {
  id: string
  src: string
  alt: string
  caption: string
}

const homeGalleryImages: HomeGalleryImage[] = [
  {
    id: 'gallery-03',
    src: homeGalleryImageThree,
    alt: 'Wildfloral stylist preparing a fitting',
    caption: 'The Fitting Room',
  },
  {
    id: 'gallery-04',
    src: homeGalleryImageFour,
    alt: 'Golden hour light inside the Wildfloral studio',
    caption: 'Golden Hour Glow',
  },
  {
    id: 'gallery-05',
    src: homeGalleryImageFive,
    alt: 'Hand-tied botanical arrangement used in treatments',
    caption: 'Hand-Tied Botanicals',
  },
  {
    id: 'gallery-06',
    src: homeGalleryImageSix,
    alt: 'Close-up of the final stitching on a garment',
    caption: 'The Final Stitch',
  },
  {
    id: 'gallery-07',
    src: homeGalleryImageSeven,
    alt: 'Soft studio lighting over a styling station',
    caption: 'Studio Light',
  },
  {
    id: 'gallery-08',
    src: homeGalleryImageEight,
    alt: 'Bridal preparation moment at Wildfloral',
    caption: 'Bridal Preparation',
  },
  {
    id: 'gallery-09',
    src: homeGalleryImageNine,
    alt: 'Fabric textures and trims laid out for a design',
    caption: 'Textures & Trims',
  },
  {
    id: 'gallery-10',
    src: homeGalleryImageTen,
    alt: 'Finishing details on a completed look',
    caption: 'Closing Details',
  },
]

const galleryStaggerDelays = [
  'atelier-scroll-delay-1',
  'atelier-scroll-delay-2',
  'atelier-scroll-delay-3',
]

type HomeBeautyService = {
  id: string
  name: string
  category: string | null
  image_url: string
}

type HomeBeautyServiceRow = Omit<HomeBeautyService, 'image_url'> & {
  image_url: string | null
}

type HomeFashionImage = {
  id: string
  name: string
  imageUrl: string
  altText: string | null
}

type HomeFashionDesign = {
  id: string
  name: string
}

type HomeFashionImageRow = {
  id: string
  design_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

const DEFAULT_BEAUTY_SERVICES: HomeBeautyService[] = [
  {
    id: 'default-beauty-1',
    name: 'Hair Styling',
    category: 'Hair',
    image_url: hairStylingImage,
  },
  {
    id: 'default-beauty-2',
    name: 'Bridal Makeup',
    category: 'Bridal',
    image_url: bridalMakeupImage,
  },
]

const DEFAULT_FASHION_IMAGES: HomeFashionImage[] = [
  {
    id: 'default-fashion-1',
    name: 'Style Dress',
    imageUrl: fashionPageImage,
    altText: 'Bespoke Atelier Fashion Dress',
  },
]

/* =========================================================
   HERO ANIMATION FRAMES
========================================================= */

const sortFrameUrls = (
  frames: Record<string, string>,
) => {
  return Object.entries(frames)
    .sort(([firstPath], [secondPath]) => {
      const firstNumber = Number(
        firstPath.match(/ezgif-frame-(\d+)\.jpg$/)?.[1] ?? 0,
      )

      const secondNumber = Number(
        secondPath.match(/ezgif-frame-(\d+)\.jpg$/)?.[1] ?? 0,
      )

      return firstNumber - secondNumber
    })
    .map(([, url]) => url)
}

const desktopFrameUrls = sortFrameUrls(
  import.meta.glob(
    '../../../assets/home page hero animation/disktop/ezgif-frame-*.jpg',
    {
      eager: true,
      import: 'default',
      query: '?url',
    },
  ) as Record<string, string>,
)

const mobileFrameUrls = sortFrameUrls(
  import.meta.glob(
    '../../../assets/home page hero animation/mobile/ezgif-frame-*.jpg',
    {
      eager: true,
      import: 'default',
      query: '?url',
    },
  ) as Record<string, string>,
)




/* =========================================================
   HOME
========================================================= */

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameIndexRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const [beautyServices, setBeautyServices] = useState<HomeBeautyService[]>(DEFAULT_BEAUTY_SERVICES)
  const [fashionImages, setFashionImages] = useState<HomeFashionImage[]>(DEFAULT_FASHION_IMAGES)
  const [imageLoadError, setImageLoadError] = useState('')
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false)

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 768,
  )

  const handleSkipHero = () => {
    const target = document.getElementById('home-story-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      const heroShell = document.querySelector('.home-hero-shell') as HTMLElement | null
      if (heroShell) {
        window.scrollTo({
          top: heroShell.offsetTop + heroShell.offsetHeight,
          behavior: 'smooth',
        })
      }
    }
  }

  /* =====================================================
     SCROLL REVEAL (Personal Style, Editorial Feature,
     Beauty Philosophy sections + new sections)
  ===================================================== */

  useEffect(() => {
    const elements = document.querySelectorAll(
      `
        .atelier-style-section .atelier-scroll-reveal,
        .atelier-feature-section .atelier-scroll-reveal,
        .atelier-philosophy-section .atelier-scroll-reveal,
        .atelier-gallery-section .atelier-scroll-reveal,
        .wf-details-section .atelier-scroll-reveal,
        .wf-split-section .atelier-scroll-reveal,
        .wf-testimonial-section .atelier-scroll-reveal,
        .wf-final-cta-section .atelier-scroll-reveal
      `,
    )

    if (elements.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              'atelier-scroll-visible',
            )
          } else {
            entry.target.classList.remove(
              'atelier-scroll-visible',
            )
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px',
      },
    )

    elements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [beautyServices, fashionImages])

  const frameUrls = isMobile
    ? mobileFrameUrls
    : desktopFrameUrls

  useEffect(() => {
    let isMounted = true

    const loadFeaturedImages = async () => {
      try {
        const [beautyResult, fashionDesignsResult] = await Promise.all([
          supabase
            .from('services')
            .select('id, name, category, image_url')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('fashion_designs')
            .select('id, name')
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false }),
        ])

        if (beautyResult.error) {
          throw new Error(beautyResult.error.message)
        }

        if (fashionDesignsResult.error) {
          throw new Error(fashionDesignsResult.error.message)
        }

        const beautyRows =
          (beautyResult.data ?? []) as HomeBeautyServiceRow[]
        const fashionDesigns =
          (fashionDesignsResult.data ?? []) as HomeFashionDesign[]

        const fashionImagesResult = fashionDesigns.length > 0
          ? await supabase
            .from('fashion_design_images')
            .select('id, design_id, image_url, alt_text, display_order, is_primary')
            .in('design_id', fashionDesigns.map((design) => design.id))
            .order('is_primary', { ascending: false })
            .order('display_order', { ascending: true })
          : { data: [], error: null }

        if (fashionImagesResult.error) {
          throw new Error(fashionImagesResult.error.message)
        }

        const designNames = new Map(
          fashionDesigns.map((design) => [design.id, design.name]),
        )
        const fashionRows =
          (fashionImagesResult.data ?? []) as HomeFashionImageRow[]

        const featuredBeautyServices: HomeBeautyService[] = beautyRows.slice(0, 2).map((service, index) => ({
          id: service.id,
          name: service.name,
          category: service.category,
          image_url: index === 0 ? hairStylingImage : bridalMakeupImage,
        }))

        const finalBeautyServices = featuredBeautyServices.length > 0
          ? [
              ...featuredBeautyServices,
              ...DEFAULT_BEAUTY_SERVICES.slice(featuredBeautyServices.length),
            ]
          : DEFAULT_BEAUTY_SERVICES

        const mappedFashionImages: HomeFashionImage[] = (
          fashionRows.length > 0
            ? [{
                id: fashionRows[0].id,
                name: designNames.get(fashionRows[0].design_id) || 'Style Dress',
                imageUrl: fashionPageImage,
                altText: fashionRows[0].alt_text || 'Bespoke Atelier Fashion Dress',
              }]
            : DEFAULT_FASHION_IMAGES
        )

        const finalFashionImages = mappedFashionImages.length > 0
          ? mappedFashionImages
          : DEFAULT_FASHION_IMAGES

        if (isMounted) {
          setBeautyServices(finalBeautyServices)
          setFashionImages(finalFashionImages)
          setImageLoadError('')
        }
      } catch (error) {
        console.error('Unable to load featured home page images.', error)

        if (isMounted) {
          setBeautyServices(DEFAULT_BEAUTY_SERVICES)
          setFashionImages(DEFAULT_FASHION_IMAGES)
          setImageLoadError('')
        }
      } finally {
        if (isMounted) {
          setIsFeaturedLoading(false)
        }
      }
    }

    void loadFeaturedImages()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleViewportResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener(
      'resize',
      handleViewportResize,
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleViewportResize,
      )
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || frameUrls.length === 0) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const frames: HTMLImageElement[] = new Array(frameUrls.length)
    let currentFrame = 0
    let destroyed = false

    /* =====================================================
       LOAD IMAGE
    ===================================================== */

    const loadFrame = (index: number) => {
      if (destroyed || index < 0 || index >= frameUrls.length) {
        return
      }

      if (frames[index]) {
        return
      }

      const image = new Image()

      image.decoding = 'async'
      image.src = frameUrls[index]

      image.onload = () => {
        if (destroyed) return

        frames[index] = image

        if (index === 0) {
          drawFrame(0)
        }
      }
    }

    /* =====================================================
       DRAW FRAME
    ===================================================== */

    const drawFrame = (index: number) => {
      const image = frames[index]

      if (
        !image ||
        !image.complete ||
        image.naturalWidth === 0
      ) {
        return
      }

      const width = canvas.clientWidth
      const height = canvas.clientHeight

      if (width === 0 || height === 0) {
        return
      }

      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        2,
      )

      const canvasWidth = Math.round(width * pixelRatio)
      const canvasHeight = Math.round(height * pixelRatio)

      if (
        canvas.width !== canvasWidth ||
        canvas.height !== canvasHeight
      ) {
        canvas.width = canvasWidth
        canvas.height = canvasHeight
      }

      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0,
      )

      context.clearRect(0, 0, width, height)

      /* CONTAIN */
/* COVER */
const imageRatio =
  image.naturalWidth / image.naturalHeight

const containerRatio = width / height

let drawWidth = width
let drawHeight = height
let offsetX = 0
let offsetY = 0

/*
 * =========================================================
 * RESPONSIVE IMAGE FIT
 * =========================================================
 *
 * Desktop:
 * Keep the existing cover behavior exactly.
 *
 * Tablet:
 * Slightly reduce the vertical crop.
 *
 * Mobile:
 * Scale based on width so the subject remains more visible.
 */

if (width <= 768) {
  /*
   * MOBILE
   *
   * Fit the image to the viewport width first.
   * This prevents the aggressive portrait-screen crop
   * caused by height-based cover scaling.
   */
  drawWidth = width
  drawHeight = width / imageRatio

  /*
   * If the image is shorter than the viewport,
   * scale it up just enough to cover the viewport.
   */
  if (drawHeight < height) {
    drawHeight = height
    drawWidth = height * imageRatio
  }

  /*
   * Keep the image centered horizontally.
   */
  offsetX = (width - drawWidth) / 2

  /*
   * Slightly bias the image upward on mobile.
   *
   * Negative value = show more of the upper part
   * of the source image.
   */
  offsetY = (height - drawHeight) * 0.42

} else if (width <= 1000) {
  /*
   * TABLET
   *
   * Keep cover behavior but bias the image slightly
   * upward to improve framing on narrower screens.
   */
  if (containerRatio > imageRatio) {
    drawWidth = width
    drawHeight = width / imageRatio
    offsetY = (height - drawHeight) * 0.45
  } else {
    drawHeight = height
    drawWidth = height * imageRatio
    offsetX = (width - drawWidth) / 2
  }

} else {
  /*
   * DESKTOP
   *
   * Existing behavior preserved.
   */
  if (containerRatio > imageRatio) {
    drawWidth = width
    drawHeight = width / imageRatio
    offsetY = (height - drawHeight) / 2
  } else {
    drawHeight = height
    drawWidth = height * imageRatio
    offsetX = (width - drawWidth) / 2
  }
}

context.drawImage(
  image,
  offsetX,
  offsetY,
  drawWidth,
  drawHeight,
)
    }

    /* =====================================================
       REQUEST FRAME DRAW
    ===================================================== */

    const requestFrameDraw = (index: number) => {
      frameIndexRef.current = index

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null
        drawFrame(index)
      })
    }

    /* =====================================================
       PRELOAD FIRST FRAME
    ===================================================== */

    loadFrame(0)

    /* =====================================================
       PRELOAD REMAINING FRAMES
    ===================================================== */

    const preloadRemainingFrames = () => {
      let nextIndex = 1

      const loadChunk = () => {
        if (destroyed) return

        const chunkEnd = Math.min(
          nextIndex + 10,
          frameUrls.length,
        )

        while (nextIndex < chunkEnd) {
          loadFrame(nextIndex)
          nextIndex += 1
        }

        if (nextIndex < frameUrls.length) {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadChunk)
          } else {
            setTimeout(loadChunk, 50)
          }
        }
      }

      loadChunk()
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        preloadRemainingFrames,
      )
    } else {
      setTimeout(
        preloadRemainingFrames,
        100,
      )
    }

    /* =====================================================
       SCROLL → FRAME
    ===================================================== */

    const handleScroll = () => {
      const hero = canvas.closest(
        '.home-hero-shell',
      ) as HTMLElement | null

      const viewport = canvas.closest(
        '.home-hero-viewport',
      ) as HTMLElement | null

      if (!hero || !viewport) return

      const heroTop = hero.offsetTop
      const heroHeight =
        hero.offsetHeight - viewport.offsetHeight

      if (heroHeight <= 0) return

      const scrollProgress = Math.min(
        1,
        Math.max(
          0,
          (window.scrollY - heroTop) / heroHeight,
        ),
      )

      const nextFrame = Math.round(
        scrollProgress * (frameUrls.length - 1),
      )

      if (nextFrame === currentFrame) {
        return
      }

      currentFrame = nextFrame

      if (frames[nextFrame]) {
        requestFrameDraw(nextFrame)
      } else {
        /*
         * If the exact frame is still loading,
         * find the nearest already-loaded frame.
         */
        for (
          let offset = 1;
          offset < frameUrls.length;
          offset++
        ) {
          const previous = nextFrame - offset
          const next = nextFrame + offset

          if (previous >= 0 && frames[previous]) {
            requestFrameDraw(previous)
            break
          }

          if (
            next < frameUrls.length &&
            frames[next]
          ) {
            requestFrameDraw(next)
            break
          }
        }
      }
    }

    /* =====================================================
       RESIZE
    ===================================================== */

    const handleResize = () => {
      drawFrame(frameIndexRef.current)
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true },
    )

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      destroyed = true

      window.removeEventListener(
        'scroll',
        handleScroll,
      )

      window.removeEventListener(
        'resize',
        handleResize,
      )

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(
          animationFrameRef.current,
        )
      }
    }
  }, [frameUrls])

  const hasFeaturedContent =
    beautyServices.length > 0 || fashionImages.length > 0

  const homeSchemas = useMemo(
    () => [
      getOrganizationSchema(),
      getWebSiteSchema(),
      getLocalBusinessSchema(),
      getFaqSchema(HOME_FAQS),
    ],
    [],
  )

  return (
    <main className="home-page">
      <SEO
        title="WildFloral | Beauty & Fashion Studio in Hosur"
        description="WildFloral is a luxury beauty and fashion studio in Hosur — bridal makeup, couture, custom outfit design and personalized consultations. Book your appointment."
        canonical="https://www.wildfloral.online/"
        schemas={homeSchemas}
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="home-hero-shell">

        <div className="home-hero-viewport">

          <canvas
            ref={canvasRef}
            className="home-hero-canvas"
          />

          <div
            className="home-hero-overlay"
            aria-hidden="true"
          />

          <div className="home-hero-content">

            <div className="home-hero-text-block">

              <p className="home-hero-eyebrow">
                WILDFLORAL
              </p>

              <h1 className="home-hero-heading">
                WildFloral – Beauty &amp;
                <span>Fashion in Hosur</span>
              </h1>

              <p className="home-hero-copy">
                A luxury beauty and haute fashion studio in Hosur featuring master artisans, private chamber sanctums, and elevated doorstep experiences.
              </p>

            </div>

          </div>

          <div
            className="home-hero-scroll-indicator"
            aria-hidden="true"
          >
            <span>
              Scroll to explore
            </span>

            <i />
          </div>

          {/* =================================================
              SKIP BUTTON (Right Corner)
          ================================================= */}
          <button
            type="button"
            className="home-hero-skip-btn"
            onClick={handleSkipHero}
            aria-label="Skip hero section to main content"
          >
            <span>Skip</span>
            <svg
              className="home-hero-skip-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

        </div>

      </section>

      {/* =====================================================
          STORY
      ===================================================== */}

      <section id="home-story-section" className="home-story-section">

        <div className="home-story-inner">

          <p className="home-story-eyebrow">
            WILDFLORAL
          </p>

          <h2>
            Beauty &amp; Fashion
            <span>
              Designed Around You
            </span>
          </h2>

          <p className="home-story-copy">
            Discover professional beauty care,
            personalized styling, and fashion design
            created to reflect your individuality.
          </p>

          <div className="home-story-actions">

            <a
              href="/booking"
              className="home-primary-link"
            >
              Book Appointment
            </a>

            <a
              href="/services"
              className="home-secondary-link"
            >
              Explore Services
            </a>

          </div>

        </div>

      </section>

      {/* =====================================================
          AT A GLANCE FACT BLOCK (LOCAL SEO & GEO)
      ===================================================== */}
      <BusinessAtAGlance />

{/* =====================================================
    PERSONAL STYLE
===================================================== */}

<section className="atelier-section atelier-style-section">

  <div className="atelier-container">

    {/* =================================================
        SECTION HEADER
    ================================================= */}

    <div className="atelier-section-heading">

      <div className="atelier-heading-content">

        <span className="atelier-eyebrow">
          PERSONAL STYLE
        </span>

        <h2>
          Crafted for Your
          <em>Personal Style</em>
        </h2>

      </div>

      <p className="atelier-section-description">
        Every detail is considered to create a beauty and
        fashion experience that feels distinctly yours.
      </p>

    </div>


    {/* =================================================
        IMAGE ERROR
    ================================================= */}

    {imageLoadError && (
      <p
        className="atelier-image-error"
        role="alert"
      >
        {imageLoadError}
      </p>
    )}


    {/* =================================================
        LOADING SKELETON
    ================================================= */}

    {isFeaturedLoading && (
      <div
        className="atelier-service-grid"
        aria-busy="true"
        aria-label="Loading featured services"
      >
        <div className="atelier-skeleton-card" />
        <div className="atelier-skeleton-card" />
        <div className="atelier-skeleton-card" />
      </div>
    )}


    {/* =================================================
        EMPTY STATE
    ================================================= */}

    {!isFeaturedLoading &&
      !imageLoadError &&
      !hasFeaturedContent && (
        <p className="atelier-empty-state">
          New services and designs are on the way — check
          back soon.
        </p>
    )}


    {/* =================================================
        SERVICE CARDS
    ================================================= */}

    {!isFeaturedLoading && hasFeaturedContent && (
      <div className="atelier-service-grid">

        {/* =================================================
            CARD 01 + 02 — BEAUTY
        ================================================= */}

        {beautyServices
          .slice(0, 2)
          .map((service, index) => {
            const fallbackSrc = index === 0 ? hairStylingImage : bridalMakeupImage

            return (
              <article
                className={`atelier-service-card atelier-scroll-reveal ${
                  index === 0
                    ? 'atelier-scroll-delay-1'
                    : 'atelier-scroll-delay-2'
                }`}
                key={service.id}
              >

                <div className="atelier-card-image">

                  <img
                    src={service.image_url || fallbackSrc}
                    alt={service.name}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (target.src !== fallbackSrc) {
                        target.src = fallbackSrc
                      }
                    }}
                  />

                  <div
                    className="atelier-card-image-overlay"
                    aria-hidden="true"
                  >
                    <span>
                      0{index + 1}
                    </span>
                  </div>

                </div>


                <div className="atelier-card-content">

                  <div className="atelier-card-meta">

                    <span>
                      0{index + 1} / BEAUTY
                    </span>

                    <span>
                      WILDFLORAL
                    </span>

                  </div>


                  <h3>
                    {service.name}
                  </h3>


                  <p>
                    {service.category ||
                      'A personalized beauty service'}
                  </p>


                  <a
                    href="/services"
                    className="atelier-card-link"
                  >

                    <span>
                      Explore Service
                    </span>

                    <span
                      className="atelier-card-arrow"
                      aria-hidden="true"
                    >
                      ↗
                    </span>

                  </a>

                </div>

              </article>
            )
          })}


        {/* =================================================
            CARD 03 — FASHION
        ================================================= */}

        {fashionImages
          .slice(0, 1)
          .map((image) => {
            const fallbackSrc = fashionPageImage

            return (
              <article
                className="atelier-service-card atelier-scroll-reveal atelier-scroll-delay-3"
                key={image.id}
              >

                <div className="atelier-card-image">

                  <img
                    src={image.imageUrl || fallbackSrc}
                    alt={
                      image.altText ||
                      image.name
                    }
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (target.src !== fallbackSrc) {
                        target.src = fallbackSrc
                      }
                    }}
                  />

                  <div
                    className="atelier-card-image-overlay"
                    aria-hidden="true"
                  >
                    <span>
                      03
                    </span>
                  </div>

                </div>


                <div className="atelier-card-content">

                  <div className="atelier-card-meta">

                    <span>
                      03 / FASHION
                    </span>

                    <span>
                      ATELIER
                    </span>

                  </div>


                  <h3>
                    {image.name}
                  </h3>


                  <p>
                    Bespoke fashion shaped around
                    your style and occasion.
                  </p>


                  <a
                    href="/fashion"
                    className="atelier-card-link"
                  >

                    <span>
                      Explore Fashion
                    </span>

                    <span
                      className="atelier-card-arrow"
                      aria-hidden="true"
                    >
                      ↗
                    </span>

                  </a>

                </div>

              </article>
            )
          })}

      </div>
    )}

  </div>

</section>

{/* =====================================================
    EDITORIAL FEATURE
===================================================== */}

<section className="atelier-feature-section">

  {/* =================================================
      SECTION HEADER
  ================================================= */}

  <div className="atelier-section-heading">

    <div className="atelier-heading-content">

      <span className="atelier-eyebrow">
        EDITORIAL FEATURE
      </span>

      <h2>
        Beauty &amp; Fashion
        <em>In Every Detail</em>
      </h2>

    </div>

    <p className="atelier-section-description">
      Thoughtfully composed beauty and fashion moments,
      created with an editorial point of view.
    </p>

  </div>


  <div className="atelier-feature-container">

    {/* =================================================
        IMAGE 01
    ================================================= */}

    <article
      className="
        atelier-feature-image-card
        atelier-scroll-reveal
        atelier-scroll-delay-1
      "
    >

      <div className="atelier-feature-image">

        {homeFeatureImageOne ? (
          <img
            src={homeFeatureImageOne}
            alt="Wildfloral fashion atelier"
            loading="lazy"
          />
        ) : (
          <div
            className="atelier-feature-image-fallback"
            aria-hidden="true"
          />
        )}

      </div>


      <div className="atelier-feature-image-caption">

        <div>
          <span>
            ATELIER CRAFT
          </span>

          <h3>
            Bespoke Drape &amp; Line
          </h3>
        </div>

        <em>
          01
        </em>

      </div>

    </article>


    {/* =================================================
        CENTER EDITORIAL CARD
    ================================================= */}

    <article
      className="
        atelier-feature-editorial
        atelier-scroll-reveal
        atelier-scroll-delay-2
      "
    >

      <div className="atelier-feature-editorial-icon">
        ✧
      </div>


      <span className="atelier-feature-editorial-label">
        PURE BOTANICALS
      </span>


      <blockquote>
        "Every treatment is
        custom-compounded from
        certified botanical
        distillations, matched
        precisely to cellular
        resonance."
      </blockquote>


      <div className="atelier-feature-editorial-footer">

        <span>
          COMPOUNDED FRESH
        </span>

        <small>
          Cold-pressed botanical oils
        </small>

      </div>

    </article>


    {/* =================================================
        IMAGE 02
    ================================================= */}

    <article
      className="
        atelier-feature-image-card
        atelier-feature-image-card-right
        atelier-scroll-reveal
        atelier-scroll-delay-3
      "
    >

      <div className="atelier-feature-image">

        {homeFeatureImageTwo ? (
          <img
            src={homeFeatureImageTwo}
            alt="Wildfloral beauty artistry"
            loading="lazy"
          />
        ) : (
          <div
            className="atelier-feature-image-fallback"
            aria-hidden="true"
          />
        )}

      </div>


      <div className="atelier-feature-image-caption">

        <div>
          <span>
            SKIN HARMONY
          </span>

          <h3>
            Luminous Artistry
          </h3>
        </div>

        <em>
          02
        </em>

      </div>

    </article>

  </div>

</section>

{/* =====================================================
    BEAUTY PHILOSOPHY
===================================================== */}

<section className="atelier-philosophy-section">

  <div className="atelier-philosophy-container">

    {/* =================================================
        PHILOSOPHY QUOTE
    ================================================= */}

    <div
      className="
        atelier-philosophy-quote
        atelier-scroll-reveal
        atelier-scroll-delay-1
      "
    >

      <span className="atelier-philosophy-symbol">
        ✦
      </span>

      <blockquote>
        "True luxury is a personal silhouette tailored to
        your innate grace."
      </blockquote>

      <span className="atelier-philosophy-label">
        WILDFLORAL ATELIER
      </span>

      <small>
        BEAUTY &amp; FASHION
      </small>

    </div>


    {/* =================================================
        PHILOSOPHY CARDS
    ================================================= */}

    <div className="atelier-philosophy-grid">

      {/* CARD 01 */}

      <article
        className="
          atelier-philosophy-card
          atelier-scroll-reveal
          atelier-scroll-delay-1
        "
      >

        <span className="atelier-philosophy-number">
          01
        </span>

        <h3>
          Botanical Formulation
        </h3>

        <p>
          We believe beauty begins with considered
          ingredients, precise rituals, and formulas
          created to complement your natural rhythm.
        </p>

      </article>


      {/* CARD 02 */}

      <article
        className="
          atelier-philosophy-card
          atelier-scroll-reveal
          atelier-scroll-delay-2
        "
      >

        <span className="atelier-philosophy-number">
          02
        </span>

        <h3>
          Sartorial Precision
        </h3>

        <p>
          Every silhouette is thoughtfully shaped around
          your proportions, personality, occasion, and
          individual expression.
        </p>

      </article>


      {/* CARD 03 */}

      <article
        className="
          atelier-philosophy-card
          atelier-scroll-reveal
          atelier-scroll-delay-3
        "
      >

        <span className="atelier-philosophy-number">
          03
        </span>

        <h3>
          Intimate Sanctuary
        </h3>

        <p>
          Your experience is designed as a private
          moment of refinement, where beauty and fashion
          come together effortlessly.
        </p>

      </article>

    </div>


    {/* =================================================
        CONSULTATION CTA
    ================================================= */}

    <div
      className="
        atelier-philosophy-cta
        atelier-scroll-reveal
        atelier-scroll-delay-3
      "
    >

      <div className="atelier-philosophy-cta-content">

        <span>
          PRIVATE ATELIER
        </span>

        <h2>
          Begin Your Consultation
        </h2>

        <p>
          Discover a personalized beauty and fashion
          experience created entirely around you.
        </p>

      </div>


      <div className="atelier-philosophy-cta-actions">

        <a
          href="/booking"
          className="atelier-philosophy-primary-link"
        >
          <span>
            BOOK APPOINTMENT
          </span>

          <span aria-hidden="true">
            ↗
          </span>
        </a>


        <a
          href="/services"
          className="atelier-philosophy-secondary-link"
        >
          EXPLORE SERVICES
        </a>

      </div>

    </div>

  </div>

</section>

{/* =====================================================
    GALLERY
===================================================== */}

<section className="atelier-gallery-section">

  <div className="atelier-container">

    {/* =================================================
        SECTION HEADER
    ================================================= */}

    <div className="atelier-section-heading">

      <div className="atelier-heading-content">

        <span className="atelier-eyebrow">
          THE COLLECTION
        </span>

        <h2>
          Moments From
          <em>The Atelier Floor</em>
        </h2>

      </div>

      <p className="atelier-section-description">
        A closer look at the textures, rituals, and
        finishing touches behind every Wildfloral
        appointment.
      </p>

    </div>


    {/* =================================================
        GALLERY GRID
    ================================================= */}

    <div className="atelier-gallery-grid">

      {homeGalleryImages.map((image, index) => (

        <figure
          className={`atelier-gallery-item atelier-scroll-reveal ${
            galleryStaggerDelays[index % galleryStaggerDelays.length]
          }`}
          key={image.id}
        >

          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
          />

          <figcaption>
            {image.caption}
          </figcaption>

        </figure>

      ))}

    </div>

  </div>

</section>


{/* =====================================================
    THE DETAILS MATTER
===================================================== */}

<section className="wf-details-section">

  <div className="wf-details-container">

    {/* =================================================
        SECTION HEADER
    ================================================= */}

    <div className="wf-details-header atelier-scroll-reveal atelier-scroll-delay-1">

      <span className="wf-details-eyebrow">
        WILDFLORAL ATELIER
      </span>

      <h2 className="wf-details-heading">
        The Details Matter.
      </h2>

      <p className="wf-details-subheading">
        Every appointment is shaped around the things that make you,
        you — your personality, your vision, your occasion, your taste.
      </p>

    </div>


    {/* =================================================
        FOUR FEATURE CARDS
    ================================================= */}

    <div className="wf-details-grid">

      <article className="wf-details-card atelier-scroll-reveal atelier-scroll-delay-1">
        <div className="wf-details-card-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 3C14 3 7 8.5 7 15C7 18.866 10.134 22 14 22C17.866 22 21 18.866 21 15C21 8.5 14 3 14 3Z" stroke="#765282" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M14 22V25" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M11 25H17" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="wf-details-card-number">01</span>
        <h3>Expert Craftsmanship</h3>
        <p>
          Each service is delivered with precision and artistry
          developed through years of dedicated practice.
        </p>
      </article>

      <article className="wf-details-card atelier-scroll-reveal atelier-scroll-delay-2">
        <div className="wf-details-card-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="10" r="5" stroke="#765282" strokeWidth="1.4"/>
            <path d="M5 24C5 19.582 9.029 16 14 16C18.971 16 23 19.582 23 24" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="wf-details-card-number">02</span>
        <h3>Personalised Care</h3>
        <p>
          Your appointments are never off-the-shelf. Every
          decision is made with your unique needs in mind.
        </p>
      </article>

      <article className="wf-details-card atelier-scroll-reveal atelier-scroll-delay-3">
        <div className="wf-details-card-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4L16.5 10.5L23 11L18 16L19.5 23L14 20L8.5 23L10 16L5 11L11.5 10.5L14 4Z" stroke="#765282" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="wf-details-card-number">03</span>
        <h3>Premium Quality</h3>
        <p>
          Only the finest materials and formulations are used —
          chosen for their efficacy and sensory experience.
        </p>
      </article>

      <article className="wf-details-card atelier-scroll-reveal atelier-scroll-delay-3">
        <div className="wf-details-card-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="20" height="14" rx="2" stroke="#765282" strokeWidth="1.4"/>
            <path d="M9 8V6C9 4.895 9.895 4 11 4H17C18.105 4 19 4.895 19 6V8" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M14 13V17" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M12 15H16" stroke="#765282" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="wf-details-card-number">04</span>
        <h3>Made For You</h3>
        <p>
          From the first consultation to the final look,
          everything is curated entirely around you.
        </p>
      </article>

    </div>

  </div>

</section>


{/* =====================================================
    DESIGNED SPECIFICALLY FOR YOU — SPLIT SECTION
===================================================== */}

<section className="wf-split-section">

  {/* =================================================
      LEFT — IMAGE
  ================================================= */}

  <div className="wf-split-image-col atelier-scroll-reveal atelier-scroll-delay-1">

    <div className="wf-split-image-wrap">

      {homeFeatureImageOne ? (
        <img
          src={homeFeatureImageOne}
          alt="Wildfloral atelier — made for you"
          loading="lazy"
        />
      ) : (
        <div
          className="wf-split-image-fallback"
          aria-hidden="true"
        />
      )}

      <div
        className="wf-split-image-badge"
        aria-hidden="true"
      >
        <span>MADE FOR YOU</span>
      </div>

    </div>

  </div>


  {/* =================================================
      RIGHT — COPY
  ================================================= */}

  <div className="wf-split-copy-col atelier-scroll-reveal atelier-scroll-delay-2">

    <span className="wf-split-eyebrow">
      ATELIER PARTNER
    </span>

    <h2 className="wf-split-heading">
      Designed Specifically
      <em> for You.</em>
    </h2>

    <p className="wf-split-body">
      Your assessments. Your personality. Your occasion. Your
      vision. At Wildfloral, every visit is a conversation — we
      listen first, then create.
    </p>

    <p className="wf-split-body">
      From The Fitting Room to The Final Stitch, every detail is shaped
      to make your experience feel as individual as the look itself.
    </p>

    <a
      href="/services"
      className="wf-split-link"
    >
      <span>DISCOVER YOUR STYLE</span>
      <span className="wf-split-link-arrow" aria-hidden="true">↗</span>
    </a>

  </div>

</section>


{/* =====================================================
    TESTIMONIAL QUOTE
===================================================== */}

<section className="wf-testimonial-section">

  <div className="wf-testimonial-container">

    <div className="wf-testimonial-inner atelier-scroll-reveal atelier-scroll-delay-1">

      <span
        className="wf-testimonial-mark"
        aria-hidden="true"
      >
        ✦
      </span>

      <blockquote className="wf-testimonial-quote">
        "I came looking for a beautiful look,
        I left feeling completely myself."
      </blockquote>

      <footer className="wf-testimonial-footer">
        <span className="wf-testimonial-attribution">
          A WILDFLORAL CLIENT
        </span>
        <span
          className="wf-testimonial-divider"
          aria-hidden="true"
        />
        <span className="wf-testimonial-location">
          BEAUTY &amp; FASHION
        </span>
      </footer>

    </div>

  </div>

</section>


{/* =====================================================
    FAQ SECTION (SCHEMA & USER ASSISTANCE)
===================================================== */}
<FAQSection />


{/* =====================================================
    FINAL CTA — YOUR STYLE. YOUR MOMENT.
===================================================== */}

<section className="wf-final-cta-section">

  <div
    className="wf-final-cta-overlay"
    aria-hidden="true"
  />

  <div className="wf-final-cta-container">

    <div className="wf-final-cta-inner atelier-scroll-reveal atelier-scroll-delay-1">

      <span className="wf-final-cta-eyebrow">
        YOUR WILDFLORAL
      </span>

      <h2 className="wf-final-cta-heading">
        Your Style. Your Moment.
        <em> Your WildFloral.</em>
      </h2>

      <p className="wf-final-cta-body">
        Begin your personalized beauty and fashion experience
        with a consultation designed entirely around you.
      </p>

      <div className="wf-final-cta-actions">

        <a
          href="/booking"
          className="wf-final-cta-primary"
        >
          BOOK APPOINTMENT
        </a>

        <a
          href="/services"
          className="wf-final-cta-secondary"
        >
          EXPLORE SERVICES
        </a>

      </div>

    </div>

  </div>

</section>

    </main>
  )
}

export default Home