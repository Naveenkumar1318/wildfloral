import {
  useEffect,
  useRef,
  useState,
} from 'react'

import './Home.css'

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

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 768,
  )

  const frameUrls = isMobile
    ? mobileFrameUrls
    : desktopFrameUrls

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

  return (
    <main className="home-page">

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
                Beauty &
                <span>Fashion</span>
              </h1>

              <p className="home-hero-copy">
                Discover beauty services, fashion design,
                and personalized experiences created
                around you.
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

        </div>

      </section>

      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="home-story-section">

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
          SERVICES
      ===================================================== */}

      <section className="home-services-section">

        <div className="home-services-inner">

          <div className="home-services-heading-wrap">

            <p className="home-story-eyebrow home-story-eyebrow--light">
              OUR SERVICES
            </p>

            <h3>
              Crafted for Your
              <br />
              Personal Style
            </h3>

          </div>

          <div className="home-services-grid">

            <article className="home-service-card">

              <span className="home-card-kicker">
                01
              </span>

              <h4>
                Hair Styling
              </h4>

              <p>
                Professional styling designed for
                everyday looks and special occasions.
              </p>

            </article>

            <article className="home-service-card">

              <span className="home-card-kicker">
                02
              </span>

              <h4>
                Bridal Makeup
              </h4>

              <p>
                Complete bridal beauty styling for
                your most memorable moments.
              </p>

            </article>

            <article className="home-service-card">

              <span className="home-card-kicker">
                03
              </span>

              <h4>
                Fashion Design
              </h4>

              <p>
                Personalized outfits created around
                your measurements and individual style.
              </p>

            </article>

          </div>

        </div>

            </section>

      {/* =====================================================
          WILDFLORAL EXPERIENCE
      ===================================================== */}

      <section className="home-experience-section">

        <div className="home-experience-inner">

          <div className="home-experience-intro">

            <p className="home-section-eyebrow">
              THE WILDFLORAL EXPERIENCE
            </p>

            <h2>
              More Than Beauty.
              <span>
                A Personal Experience.
              </span>
            </h2>

            <p>
              From the first consultation to the final reveal,
              every detail is thoughtfully created around you,
              your occasion, and your individual style.
            </p>

          </div>

          <div className="home-experience-grid">

            <article className="home-experience-item">
              <span>01</span>

              <div>
                <h3>Discover</h3>

                <p>
                  We begin by understanding your personality,
                  preferences, occasion, and vision.
                </p>
              </div>
            </article>

            <article className="home-experience-item">
              <span>02</span>

              <div>
                <h3>Create</h3>

                <p>
                  Our beauty professionals and designers
                  bring your ideas to life with care.
                </p>
              </div>
            </article>

            <article className="home-experience-item">
              <span>03</span>

              <div>
                <h3>Refine</h3>

                <p>
                  Every detail is carefully adjusted until
                  everything feels naturally right for you.
                </p>
              </div>
            </article>

            <article className="home-experience-item">
              <span>04</span>

              <div>
                <h3>Reveal</h3>

                <p>
                  Step into your finished look with confidence,
                  elegance, and a sense of yourself.
                </p>
              </div>
            </article>

          </div>

        </div>

      </section>


      {/* =====================================================
          LOOKBOOK
      ===================================================== */}

      <section className="home-lookbook-section">

        <div className="home-lookbook-inner">

          <div className="home-lookbook-heading">

            <div>
              <p className="home-section-eyebrow">
                OUR WORLD
              </p>

              <h2>
                Beauty.
                <span>Fashion.</span>
                Craftsmanship.
              </h2>
            </div>

            <p>
              A glimpse into the details, textures, and
              transformations that define WildFloral.
            </p>

          </div>

          <div className="home-lookbook-grid">

            <div className="home-lookbook-card home-lookbook-card--large">
              <span>BEAUTY</span>
            </div>

            <div className="home-lookbook-card home-lookbook-card--medium">
              <span>STYLE</span>
            </div>

            <div className="home-lookbook-card home-lookbook-card--small">
              <span>CRAFT</span>
            </div>

            <div className="home-lookbook-card home-lookbook-card--small">
              <span>DETAIL</span>
            </div>

          </div>

          <a
            href="/services"
            className="home-lookbook-link"
          >
            Explore Our Collection
            <span>→</span>
          </a>

        </div>

      </section>


      {/* =====================================================
          WHY WILDFLORAL
      ===================================================== */}

      <section className="home-why-section">

        <div className="home-why-inner">

          <div className="home-why-heading">

            <p className="home-section-eyebrow">
              WHY WILDFLORAL
            </p>

            <h2>
              The Details
              <span>Matter.</span>
            </h2>

          </div>

          <div className="home-why-grid">

            <article className="home-why-card">
              <span>01</span>

              <h3>
                Expert Craftsmanship
              </h3>

              <p>
                Skilled professionals who understand
                the importance of every detail.
              </p>
            </article>

            <article className="home-why-card">
              <span>02</span>

              <h3>
                Personalized Care
              </h3>

              <p>
                Every experience is shaped around
                your preferences and individuality.
              </p>
            </article>

            <article className="home-why-card">
              <span>03</span>

              <h3>
                Premium Quality
              </h3>

              <p>
                Carefully selected products, materials,
                and techniques for beautiful results.
              </p>
            </article>

            <article className="home-why-card">
              <span>04</span>

              <h3>
                Made for You
              </h3>

              <p>
                Beauty and fashion created to feel
                authentic to who you are.
              </p>
            </article>

          </div>

        </div>

      </section>


      {/* =====================================================
          CUSTOM FASHION
      ===================================================== */}

      <section className="home-fashion-section">

        <div className="home-fashion-inner">

          <div className="home-fashion-visual">
            <div className="home-fashion-visual-content">
              <span>
                WILDFLORAL
              </span>

              <strong>
                MADE
                <br />
                FOR
                <br />
                YOU
              </strong>
            </div>
          </div>

          <div className="home-fashion-content">

            <p className="home-section-eyebrow">
              CUSTOM FASHION
            </p>

            <h2>
              Designed
              <span>
                Specifically for You.
              </span>
            </h2>

            <p>
              Your measurements. Your personality.
              Your occasion. Your vision.
            </p>

            <p>
              From fabric selection to the final fitting,
              every element is carefully considered to
              create something that feels uniquely yours.
            </p>

            <a
              href="/services"
              className="home-fashion-link"
            >
              Discover Fashion Design
              <span>→</span>
            </a>

          </div>

        </div>

      </section>


      {/* =====================================================
          CLIENT STORIES
      ===================================================== */}

      <section className="home-client-section">

        <div className="home-client-inner">

          <p className="home-section-eyebrow">
            CLIENT STORIES
          </p>

          <blockquote>
            “I came looking for a beautiful look.
            I left feeling completely myself.”
          </blockquote>

          <span className="home-client-name">
            — A WildFloral Client
          </span>

          <div className="home-client-dots">
            <i className="active" />
            <i />
            <i />
          </div>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="home-final-section">

        <div className="home-final-inner">

          <p className="home-section-eyebrow">
            YOUR MOMENT
          </p>

          <h2>
            Your Style.
            <span>Your Moment.</span>
            Your WildFloral.
          </h2>

          <p>
            Begin your personalized beauty and fashion
            experience with us.
          </p>

          <div className="home-final-actions">

            <a
              href="/booking"
              className="home-final-primary"
            >
              Book Appointment
            </a>

            <a
              href="/services"
              className="home-final-secondary"
            >
              Explore Services
            </a>

          </div>

        </div>

      </section>


    </main>
  )
}

export default Home