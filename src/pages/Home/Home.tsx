import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  ArrowRight,
  Clock3,
  Heart,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Home.css'

type Service = {
  id: string
  name: string
  description: string | null
  price: number | string | null
  duration_minutes: number | null
  image_url: string | null
  category: string | null
}

type SelectedService = {
  id: string
  name: string
  price: number
  duration_minutes: number
}

const FALLBACK_IMAGE =
  '/src/assets/wildfloral/hero.png'

const categories = [
  {
    name: 'All Services',
    value: 'all',
  },
  {
    name: 'Hair',
    value: 'hair',
  },
  {
    name: 'Makeup',
    value: 'makeup',
  },
  {
    name: 'Bridal',
    value: 'bridal',
  },
  {
    name: 'Skin',
    value: 'skin',
  },
  {
    name: 'Fashion',
    value: 'fashion',
  },
]

function Home() {
  const navigate = useNavigate()

  const [services, setServices] =
    useState<Service[]>([])

  const [selectedCategory, setSelectedCategory] =
    useState('all')

  const [sortBy, setSortBy] =
    useState('recommended')

  const [selectedServices, setSelectedServices] =
    useState<SelectedService[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [isLoggedIn, setIsLoggedIn] =
    useState(false)

  const [favourites, setFavourites] =
    useState<string[]>([])

  useEffect(() => {
    async function loadServices() {
      setLoading(true)
      setError('')

      const {
        data,
        error: servicesError,
      } = await supabase
        .from('services')
        .select(
          'id,name,description,price,duration_minutes,image_url,category',
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

      if (servicesError) {
        console.error(
          'Services loading error:',
          servicesError,
        )

        setError(
          'Unable to load services.',
        )

        setServices([])
        setLoading(false)

        return
      }

      setServices(
        (data || []) as Service[],
      )

      setLoading(false)
    }

    void loadServices()
  }, [])

  useEffect(() => {
    async function loadSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      setIsLoggedIn(
        Boolean(session),
      )
    }

    void loadSession()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setIsLoggedIn(
            Boolean(session),
          )
        },
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        'wildfloral_selected_services',
      )

    if (!stored) return

    try {
      const parsed =
        JSON.parse(stored)

      if (Array.isArray(parsed)) {
        setSelectedServices(parsed)
      }
    } catch {
      sessionStorage.removeItem(
        'wildfloral_selected_services',
      )
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(
      'wildfloral_selected_services',
      JSON.stringify(
        selectedServices,
      ),
    )
  }, [selectedServices])

  const filteredServices =
    useMemo(() => {
      let result = [...services]

      if (
        selectedCategory !== 'all'
      ) {
        result =
          result.filter(
            (service) =>
              service.category
                ?.toLowerCase()
                .trim() ===
              selectedCategory,
          )
      }

      if (
        sortBy === 'price-low'
      ) {
        result.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0),
        )
      }

      if (
        sortBy === 'price-high'
      ) {
        result.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0),
        )
      }

      if (
        sortBy === 'name-az'
      ) {
        result.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
            ),
        )
      }

      if (
        sortBy === 'name-za'
      ) {
        result.sort(
          (a, b) =>
            b.name.localeCompare(
              a.name,
            ),
        )
      }

      return result
    }, [
      services,
      selectedCategory,
      sortBy,
    ])

  const selectedIds =
    useMemo(
      () =>
        new Set(
          selectedServices.map(
            (service) =>
              service.id,
          ),
        ),
      [selectedServices],
    )

  const selectedTotal =
    useMemo(
      () =>
        selectedServices.reduce(
          (
            total,
            service,
          ) =>
            total +
            service.price,
          0,
        ),
      [selectedServices],
    )

  function getPrice(
    service: Service,
  ) {
    return Number(
      service.price || 0,
    )
  }

  function getImage(
    service: Service,
  ) {
    return (
      service.image_url ||
      FALLBACK_IMAGE
    )
  }

  function getCategory(
    service: Service,
  ) {
    return (
      service.category ||
      'Beauty'
    )
  }

  function toggleService(
    service: Service,
  ) {
    const alreadySelected =
      selectedIds.has(
        service.id,
      )

    if (alreadySelected) {
      setSelectedServices(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              service.id,
          ),
      )

      return
    }

    setSelectedServices(
      (current) => [
        ...current,
        {
          id: service.id,
          name: service.name,
          price: getPrice(
            service,
          ),
          duration_minutes:
            service.duration_minutes ||
            0,
        },
      ],
    )
  }

  function toggleFavourite(
    serviceId: string,
  ) {
    setFavourites(
      (current) =>
        current.includes(
          serviceId,
        )
          ? current.filter(
              (id) =>
                id !==
                serviceId,
            )
          : [
              ...current,
              serviceId,
            ],
    )
  }

  function continueBooking() {
    if (
      selectedServices.length ===
      0
    ) {
      return
    }

    if (!isLoggedIn) {
      navigate(
        '/login?redirect=/booking',
      )

      return
    }

    navigate('/booking')
  }

  return (
    <main className="home-page">

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="home-hero">
        <div className="home-container home-hero-grid">

          <div className="home-hero-content">

            <span className="home-eyebrow">
              BEAUTY · FASHION · YOU
            </span>

            <h1>
              Beauty that feels
              <em>
                uniquely yours.
              </em>
            </h1>

            <p>
              Premium beauty care,
              styling, and fashion
              experiences designed
              around you.
            </p>

            <div className="home-hero-actions">

              <Link
                to="/booking"
                className="home-primary-button"
              >
                Book Appointment
                <ArrowRight
                  size={15}
                />
              </Link>

              <Link
                to="/services"
                className="home-secondary-button"
              >
                Explore Services
              </Link>

            </div>

            <div className="home-hero-meta">

              <span>
                <Sparkles
                  size={13}
                />
                Personalised Care
              </span>

              <span>
                <Star
                  size={13}
                />
                Premium Services
              </span>

              <span>
                <Clock3
                  size={13}
                />
                Easy Booking
              </span>

            </div>

          </div>

          <div className="home-hero-visual">

            <div className="home-hero-image-wrap">

              <img
                src={FALLBACK_IMAGE}
                alt="WildFloral beauty experience"
              />

              <div className="home-hero-floating-card">
                <span>
                  WILDFLORAL
                </span>

                <strong>
                  Beauty,
                  <br />
                  made personal.
                </strong>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================================================
          BENEFITS
      ================================================== */}

      <section className="home-benefits">

        <div className="home-container home-benefits-grid">

          <div className="home-benefit">
            <div className="home-benefit-icon">
              <Sparkles size={17} />
            </div>

            <div>
              <strong>
                Expert Professionals
              </strong>

              <span>
                Skilled beauty specialists
              </span>
            </div>
          </div>

          <div className="home-benefit">
            <div className="home-benefit-icon">
              <Clock3 size={17} />
            </div>

            <div>
              <strong>
                Easy Appointments
              </strong>

              <span>
                Choose your preferred time
              </span>
            </div>
          </div>

          <div className="home-benefit">
            <div className="home-benefit-icon">
              <Star size={17} />
            </div>

            <div>
              <strong>
                Premium Quality
              </strong>

              <span>
                Carefully selected services
              </span>
            </div>
          </div>

          <div className="home-benefit">
            <div className="home-benefit-icon">
              <UserRound size={17} />
            </div>

            <div>
              <strong>
                Personalised Care
              </strong>

              <span>
                Designed around your style
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* ==================================================
          SERVICES
      ================================================== */}

      <section
        className="home-services"
        id="services"
      >

        <div className="home-container">

          <div className="home-section-heading">

            <span className="home-eyebrow">
              OUR SERVICES
            </span>

            <h2>
              Choose your
              <em>
                perfect experience.
              </em>
            </h2>

            <p>
              Discover services crafted
              for your beauty, style,
              and special moments.
            </p>

          </div>

          {/* CATEGORY SCROLLER */}

          <div className="service-category-scroller">

            {categories.map(
              (
                category,
              ) => (
                <button
                  type="button"
                  key={
                    category.value
                  }
                  className={[
                    'service-category',
                    selectedCategory ===
                    category.value
                      ? 'active'
                      : '',
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(' ')}
                  onClick={() =>
                    setSelectedCategory(
                      category.value,
                    )
                  }
                >
                  <span className="service-category-circle">

                    {category.value ===
                    'all' ? (
                      <Sparkles
                        size={18}
                      />
                    ) : (
                      <span>
                        {category.name
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </span>
                    )}

                  </span>

                  <strong>
                    {category.name}
                  </strong>

                  <small>
                    Explore →
                  </small>
                </button>
              ),
            )}

          </div>

          {/* SERVICE HEADER */}

          <div className="services-toolbar">

            <div>
              <span className="home-eyebrow">
                SIGNATURE SERVICES
              </span>

              <h3>
                Our signature services
              </h3>
            </div>

            <div className="services-sort">

              <label htmlFor="service-sort">
                Sort by
              </label>

              <select
                id="service-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
              >
                <option value="recommended">
                  Recommended
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="name-az">
                  Name: A to Z
                </option>

                <option value="name-za">
                  Name: Z to A
                </option>
              </select>

            </div>

          </div>

          {/* SERVICES */}

          {loading ? (
            <div className="services-loading">

              <div />
              <div />
              <div />

            </div>
          ) : error ? (
            <div className="services-empty">
              <Sparkles size={24} />

              <h3>
                Services unavailable
              </h3>

              <p>
                Please try again shortly.
              </p>
            </div>
          ) : filteredServices.length ===
            0 ? (
            <div className="services-empty">

              <Sparkles size={24} />

              <h3>
                No services found
              </h3>

              <p>
                Try another category.
              </p>

              <button
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    'all',
                  )
                }
              >
                View All Services
              </button>

            </div>
          ) : (
            <div className="services-grid">

              {filteredServices.map(
                (
                  service,
                ) => {
                  const selected =
                    selectedIds.has(
                      service.id,
                    )

                  const favourite =
                    favourites.includes(
                      service.id,
                    )

                  return (
                    <article
                      className={[
                        'service-card',
                        selected
                          ? 'service-card-selected'
                          : '',
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(' ')}
                      key={
                        service.id
                      }
                    >

                      {/* IMAGE */}

                      <div className="service-card-image">

                        <img
                          src={getImage(
                            service,
                          )}
                          alt={
                            service.name
                          }
                        />

                        <span className="service-card-badge">
                          {getCategory(
                            service,
                          )}
                        </span>

                        <button
                          type="button"
                          className={[
                            'service-favourite',
                            favourite
                              ? 'active'
                              : '',
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              ' ',
                            )}
                          onClick={() =>
                            toggleFavourite(
                              service.id,
                            )
                          }
                          aria-label={
                            favourite
                              ? 'Remove from favourites'
                              : 'Add to favourites'
                          }
                        >
                          <Heart
                            size={17}
                            fill={
                              favourite
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>

                      </div>

                      {/* CONTENT */}

                      <div className="service-card-content">

                        <span className="service-card-category">
                          {getCategory(
                            service,
                          )}
                        </span>

                        <h4>
                          {service.name}
                        </h4>

                        <p>
                          {service.description ||
                            'A personalised WildFloral experience created with care.'}
                        </p>

                        <div className="service-card-info">

                          <strong>
                            ₹
                            {getPrice(
                              service,
                            ).toLocaleString(
                              'en-IN',
                            )}
                          </strong>

                          <span>
                            <Clock3
                              size={12}
                            />

                            {service.duration_minutes ||
                              0}{' '}
                            min
                          </span>

                        </div>

                        <button
                          type="button"
                          className={[
                            'service-add-button',
                            selected
                              ? 'selected'
                              : '',
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              ' ',
                            )}
                          onClick={() =>
                            toggleService(
                              service,
                            )
                          }
                        >
                          {selected
                            ? 'Added to Selection'
                            : 'Add to Selection'}

                          <ArrowRight
                            size={14}
                          />
                        </button>

                      </div>

                    </article>
                  )
                },
              )}

            </div>
          )}

          <div className="services-view-all">
            <Link
              to="/services"
              className="home-outline-button"
            >
              View All Services
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>

      </section>

      {/* ==================================================
          PROMOTIONS
      ================================================== */}

      <section className="home-promotions">

        <div className="home-container">

          <div className="promotion-grid">

            <article className="promotion-card promotion-card-primary">

              <div className="promotion-content">

                <span>
                  EXCLUSIVE OFFER
                </span>

                <h3>
                  A little something
                  <em>
                    special.
                  </em>
                </h3>

                <strong>
                  15% OFF
                </strong>

                <p>
                  Enjoy a special
                  experience on your
                  next appointment.
                </p>

                <Link
                  to="/booking"
                  className="promotion-button"
                >
                  Book Now
                  <ArrowRight size={14} />
                </Link>

              </div>

              <div className="promotion-shape">
                W
              </div>

            </article>

            <article className="promotion-card promotion-card-secondary">

              <div className="promotion-content">

                <span>
                  LIMITED TIME
                </span>

                <h3>
                  Your beauty
                  <em>
                    moment awaits.
                  </em>
                </h3>

                <p>
                  Reserve your
                  preferred service
                  before your ideal slot
                  is taken.
                </p>

                <Link
                  to="/services"
                  className="promotion-button"
                >
                  Explore
                  <ArrowRight size={14} />
                </Link>

              </div>

              <div className="promotion-visual">
                <img
                  src={FALLBACK_IMAGE}
                  alt=""
                />
              </div>

            </article>

          </div>

        </div>

      </section>

      {/* ==================================================
          SELECTION BAR
      ================================================== */}

      {selectedServices.length >
        0 && (
        <div className="selection-bar">

          <div className="selection-bar-inner">

            <div className="selection-summary">

              <span className="selection-count">
                {selectedServices.length}
              </span>

              <div>
                <strong>
                  Services selected
                </strong>

                <span>
                  ₹
                  {selectedTotal.toLocaleString(
                    'en-IN',
                  )}
                </span>
              </div>

            </div>

            <button
              type="button"
              className="selection-button"
              onClick={
                continueBooking
              }
            >
              {isLoggedIn
                ? 'Continue to Booking'
                : 'Sign In to Continue'}

              <ArrowRight size={16} />
            </button>

          </div>

        </div>
      )}

      {/* ==================================================
          CTA
      ================================================== */}

      <section className="home-final-cta">

        <div className="home-container">

          <span className="home-eyebrow">
            WILDFLORAL BEAUTY
          </span>

          <h2>
            Your best look
            <em>
              starts here.
            </em>
          </h2>

          <p>
            Choose your experience
            and let us take care of
            the rest.
          </p>

          <Link
            to="/booking"
            className="home-primary-button"
          >
            Book Appointment
            <ArrowRight size={15} />
          </Link>

        </div>

      </section>

    </main>
  )
}

export default Home