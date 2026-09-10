import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './BeautyEnquiries.css'

/* =========================================================
   TYPES
========================================================= */

type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'rejected'
  | 'converted'
  | 'closed'
  | 'completed'

type EnquiryFilter =
  | 'all'
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'rejected'
  | 'converted'
  | 'completed'

type Enquiry = {
  id: string
  preferred_date: string
  preferred_time: string
  contact_preference: string
  notes: string | null
  subtotal: number
  discount_amount: number
  total_amount: number
  status: EnquiryStatus
  created_at: string
}

type EnquiryPerson = {
  id: string
  enquiry_id: string
  name: string
  phone: string | null
  email: string | null
}

type EnquiryItem = {
  id: string
  enquiry_id: string
  person_id: string
  service_id: string
  service_name: string
  duration_minutes: number
  original_price: number
  price: number
  discount_amount: number
  discount_label: string | null
}

type ServiceRecord = {
  id: string
  name: string
  image_url: string | null
}

type EnquiryWithDetails =
  Enquiry & {
    people: EnquiryPerson[]
    items: EnquiryItem[]
  }

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  date: string,
) {
  if (!date) {
    return '—'
  }

  const parsedDate =
    new Date(
      `${date}T00:00:00`,
    )

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(parsedDate)
}

function formatSubmittedDate(
  value: string,
) {
  return formatDate(
    value.slice(0, 10),
  )
}

function formatDateTime(
  value: string,
) {
  if (!value) {
    return '—'
  }

  const parsedDate =
    new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(parsedDate)
}

function formatTime(
  time: string,
) {
  if (!time) {
    return '—'
  }

  const [
    hours,
    minutes,
  ] =
    time
      .split(':')
      .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time
  }

  const date =
    new Date()

  date.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(date)
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value) || 0,
  )
}

function formatContactPreference(
  value: string,
) {
  switch (value) {
    case 'email':
      return 'Email'

    case 'whatsapp':
      return 'WhatsApp'

    case 'call':
      return 'Phone Call'

    case 'message':
      return 'Message'

    case 'personal_home_enquiry':
      return 'Personal Home Enquiry'

    default:
      return value || '—'
  }
}

/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(
  status: EnquiryStatus,
): EnquiryStatus {
  if (
    status === 'completed'
  ) {
    return 'closed'
  }

  return status
}

function formatStatus(
  status: EnquiryStatus,
) {
  switch (
    normalizeStatus(status)
  ) {
    case 'new':
      return 'Enquiry Processing'

    case 'contacted':
      return 'Contacted'

    case 'accepted':
      return 'Accepted'

    case 'rejected':
      return 'Rejected'

    case 'converted':
      return 'Booking Created'

    case 'closed':
      return 'Closed'

    default:
      return status
  }
}

function getStatusMessage(
  status: EnquiryStatus,
) {
  switch (
    normalizeStatus(status)
  ) {
    case 'new':
      return 'Your enquiry is being reviewed by our team.'

    case 'contacted':
      return 'Our team has contacted you regarding this enquiry.'

    case 'accepted':
      return 'Your enquiry has been accepted. You can now select your service and book your appointment.'

    case 'rejected':
      return 'This enquiry was not accepted by our team.'

    case 'converted':
      return 'Your enquiry has been converted into a booking.'

    case 'closed':
      return 'This enquiry has been closed.'

    default:
      return ''
  }
}

function getReference(
  id: string,
) {
  return id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()
}

function getServiceDuration(
  minutes: number,
) {
  const value =
    Number(minutes) || 0

  if (value < 60) {
    return `${value} min`
  }

  const hours =
    Math.floor(
      value / 60,
    )

  const remaining =
    value % 60

  if (
    remaining === 0
  ) {
    return `${hours} hr`
  }

  return `${hours} hr ${remaining} min`
}

/* =========================================================
   STATUS HELPERS
========================================================= */

/* =========================================================
   COMPONENT
========================================================= */

function BeautyEnquiries() {
  const navigate =
    useNavigate()

  const [
    enquiries,
    setEnquiries,
  ] =
    useState<
      EnquiryWithDetails[]
    >([])

  const [
    serviceImages,
    setServiceImages,
  ] =
    useState<
      Record<string, string>
    >({})

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const [
    selectedEnquiryId,
    setSelectedEnquiryId,
  ] =
    useState<
      string | null
    >(null)

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<EnquiryFilter>(
      'all',
    )

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1)

  const pageSize = 3

  /* =======================================================
     LOAD ENQUIRIES
  ======================================================= */

  useEffect(() => {
    let mounted = true

    async function loadEnquiries() {
      try {
        setLoading(true)
        setError(null)

        /* -----------------------------------------------
           CURRENT USER
        ------------------------------------------------ */

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          throw new Error(
            'Unable to identify your account.',
          )
        }

        /* -----------------------------------------------
           ENQUIRIES
        ------------------------------------------------ */

        const {
          data:
            enquiryRows,
          error:
            enquiryError,
        } =
          await supabase
            .from(
              'enquiries',
            )
            .select(
              `
                id,
                preferred_date,
                preferred_time,
                contact_preference,
                notes,
                subtotal,
                discount_amount,
                total_amount,
                status,
                created_at
              `,
            )
            .eq(
              'customer_id',
              user.id,
            )
            .order(
              'created_at',
              {
                ascending: false,
              },
            )

        if (
          enquiryError
        ) {
          throw enquiryError
        }

        if (
          !enquiryRows ||
          enquiryRows.length === 0
        ) {
          if (mounted) {
            setEnquiries([])
            setServiceImages({})
          }

          return
        }

        const enquiryIds =
          enquiryRows.map(
            (
              enquiry,
            ) =>
              enquiry.id,
          )

        /* -----------------------------------------------
           PEOPLE + ITEMS
        ------------------------------------------------ */

        const [
          peopleResult,
          itemsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'enquiry_people',
              )
              .select(
                `
                  id,
                  enquiry_id,
                  name,
                  phone,
                  email
                `,
              )
              .in(
                'enquiry_id',
                enquiryIds,
              ),

            supabase
              .from(
                'enquiry_items',
              )
              .select(
                `
                  id,
                  enquiry_id,
                  person_id,
                  service_id,
                  service_name,
                  duration_minutes,
                  original_price,
                  price,
                  discount_amount,
                  discount_label
                `,
              )
              .in(
                'enquiry_id',
                enquiryIds,
              )
              .order(
                'created_at',
                {
                  ascending: true,
                },
              ),
          ])

        if (
          peopleResult.error
        ) {
          throw peopleResult.error
        }

        if (
          itemsResult.error
        ) {
          throw itemsResult.error
        }

        const people =
          (
            peopleResult.data ??
            []
          ) as EnquiryPerson[]

        const items =
          (
            itemsResult.data ??
            []
          ) as EnquiryItem[]

        /* -----------------------------------------------
           SERVICE IMAGES
        ------------------------------------------------ */

        const serviceIds =
          Array.from(
            new Set(
              items
                .map(
                  (
                    item,
                  ) =>
                    item.service_id,
                )
                .filter(Boolean),
            ),
          )

        const imageMap:
          Record<string, string> =
          {}

        if (
          serviceIds.length > 0
        ) {
          const {
            data:
              serviceRows,
            error:
              serviceError,
          } =
            await supabase
              .from(
                'services',
              )
              .select(
                `
                  id,
                  name,
                  image_url
                `,
              )
              .in(
                'id',
                serviceIds,
              )

          if (
            serviceError
          ) {
            console.error(
              'Service image lookup failed:',
              serviceError,
            )
          } else {
            const records =
              (
                serviceRows ??
                []
              ) as ServiceRecord[]

            records.forEach(
              (
                service,
              ) => {
                if (
                  service.image_url
                ) {
                  imageMap[
                    service.id
                  ] =
                    service.image_url
                }
              },
            )
          }
        }

        /* -----------------------------------------------
           BUILD COMPLETE DATA
        ------------------------------------------------ */

        const combined =
          enquiryRows.map(
            (
              enquiry,
            ) => ({
              ...enquiry,

              people:
                people.filter(
                  (
                    person,
                  ) =>
                    person.enquiry_id ===
                    enquiry.id,
                ),

              items:
                items.filter(
                  (
                    item,
                  ) =>
                    item.enquiry_id ===
                    enquiry.id,
                ),
            }),
          ) as EnquiryWithDetails[]

        if (mounted) {
          setEnquiries(
            combined,
          )

          setServiceImages(
            imageMap,
          )
        }
      } catch (
        loadError
      ) {
        console.error(
          'Failed to load enquiries:',
          loadError,
        )

        if (mounted) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Unable to load your enquiries.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadEnquiries()

    return () => {
      mounted = false
    }
  }, [])

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredEnquiries =
    useMemo(() => {
      if (activeFilter === 'all') {
        return enquiries
      }

      if (activeFilter === 'completed') {
        return enquiries.filter(
          (enquiry) =>
            normalizeStatus(
              enquiry.status,
            ) === 'closed',
        )
      }

      return enquiries.filter(
        (enquiry) =>
          normalizeStatus(
            enquiry.status,
          ) === activeFilter,
      )
    }, [
      enquiries,
      activeFilter,
    ])

  /* =======================================================
     COUNTS
  ======================================================= */

  const allCount =
    enquiries.length

  const newCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'new',
    ).length

  const contactedCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'contacted',
    ).length

  const acceptedCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'accepted',
    ).length

  const rejectedCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'rejected',
    ).length

  const convertedCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'converted',
    ).length

  const completedCount =
    enquiries.filter(
      (enquiry) =>
        normalizeStatus(
          enquiry.status,
        ) === 'closed',
    ).length

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.ceil(
      filteredEnquiries.length /
        pageSize,
    )

  const paginatedEnquiries =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        pageSize

      return filteredEnquiries.slice(
        start,
        start + pageSize,
      )
    }, [
      filteredEnquiries,
      currentPage,
    ])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeFilter,
  ])

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages,
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  /* =======================================================
     SELECTED ENQUIRY
  ======================================================= */

  const selectedEnquiry =
    enquiries.find(
      (
        enquiry,
      ) =>
        enquiry.id ===
        selectedEnquiryId,
    ) ?? null

  const selectedPeople =
    selectedEnquiry?.people ??
    []

  function getPersonServices(
    personId: string,
  ) {
    return (
      selectedEnquiry?.items.filter(
        (
          item,
        ) =>
          item.person_id ===
          personId,
      ) ?? []
    )
  }

  function getPersonTotal(
    personId: string,
  ) {
    return getPersonServices(
      personId,
    ).reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.price || 0,
        ),
      0,
    )
  }

  /* =======================================================
     ACCEPTED → SERVICES
  ======================================================= */

  function handleBookAppointment() {
    if (
      !selectedEnquiry
    ) {
      return
    }

    /*
     * The enquiry has already been accepted.
     *
     * We intentionally do NOT automatically book
     * anything here.
     *
     * Customer goes to the normal Services page,
     * selects the required service(s), and then
     * continues through the existing booking flow.
     */

    setSelectedEnquiryId(
      null,
    )

    navigate(
      '/services',
    )
  }

  /* =======================================================
     FILTER HANDLER
  ======================================================= */

  function handleFilterChange(
    filter: EnquiryFilter,
  ) {
    setActiveFilter(
      filter,
    )

    setCurrentPage(1)

    setSelectedEnquiryId(
      null,
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="beauty-enquiries">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="beauty-enquiries-header">

        <button
          type="button"
          className="beauty-enquiries-back-button"
          onClick={() =>
            navigate('/account')
          }
          aria-label="Back to account"
        >
          <span aria-hidden="true">
            ←
          </span>
          Back
        </button>

        <div className="beauty-enquiries-heading">

          <span className="beauty-enquiries-eyebrow">
            WILDFLORAL
          </span>

          <h1>
            My Beauty
            <span>
              {' '}
              Enquiries
            </span>
          </h1>

          <p>
            View your beauty service
            enquiries, preferred
            appointments, selected
            services, people details,
            pricing, and enquiry status.
          </p>

        </div>

        <div className="beauty-enquiries-count">

          <span>
            TOTAL ENQUIRIES
          </span>

          <strong>
            {allCount
              .toString()
              .padStart(
                2,
                '0',
              )}
          </strong>

        </div>

      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section
        className="beauty-enquiries-filters"
        role="tablist"
        aria-label="Enquiry status filters"
      >

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'all'
          }
          className={
            activeFilter === 'all'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange(
              'all',
            )
          }
        >
          <span>ALL</span>

          <strong>
            {allCount}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'new'
          }
          className={
            activeFilter === 'new'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('new')
          }
        >
          <span>NEW</span>

          <strong>
            {newCount}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'contacted'
          }
          className={
            activeFilter === 'contacted'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('contacted')
          }
        >
          <span>CONTACTED</span>

          <strong>
            {contactedCount}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'accepted'
          }
          className={
            activeFilter === 'accepted'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('accepted')
          }
        >
          <span>ACCEPTED</span>
          <strong>{acceptedCount}</strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'rejected'
          }
          className={
            activeFilter === 'rejected'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('rejected')
          }
        >
          <span>REJECTED</span>
          <strong>{rejectedCount}</strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'converted'
          }
          className={
            activeFilter === 'converted'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('converted')
          }
        >
          <span>CONVERTED</span>
          <strong>{convertedCount}</strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeFilter === 'completed'
          }
          className={
            activeFilter === 'completed'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('completed')
          }
        >
          <span>COMPLETED</span>
          <strong>{completedCount}</strong>
        </button>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <section className="beauty-enquiries-state beauty-enquiries-error">

          <span>
            !
          </span>

          <div>
            <strong>
              Unable to load enquiries
            </strong>

            <p>
              {error}
            </p>
          </div>

        </section>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading &&
        !error && (
          <section className="beauty-enquiries-state">

            <span className="beauty-enquiries-spinner" />

            <p>
              Loading your enquiries...
            </p>

          </section>
        )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading &&
        !error &&
        filteredEnquiries.length ===
          0 && (
          <section className="beauty-enquiries-empty">

            <span className="beauty-enquiries-empty-number">
              01
            </span>

            <h2>

              {activeFilter === 'all'
                ? 'No beauty enquiries yet.'
                : `No ${activeFilter} enquiries yet.`}

            </h2>

            <p>

              {activeFilter === 'all'
                ? 'Your submitted beauty service enquiries will appear here.'
                : 'Enquiries matching this status will appear here.'}

            </p>

          </section>
        )}

      {/* =====================================================
          ENQUIRY LIST
      ===================================================== */}

      {!loading &&
        !error &&
        filteredEnquiries.length >
          0 && (
          <section className="beauty-enquiries-list">

            {paginatedEnquiries.map(
              (
                enquiry,
                index,
              ) => {

                const number =
                  (currentPage - 1) *
                    pageSize +
                  index +
                  1

                const normalizedStatus =
                  normalizeStatus(
                    enquiry.status,
                  )

                return (
                  <article
                    key={
                      enquiry.id
                    }
                    className="beauty-enquiry-card"
                  >

                    {/* CARD HEADER */}

                    <div className="beauty-enquiry-card-header">

                      <div>

                        <span>
                          ENQUIRY
                        </span>

                        <strong>
                          #
                          {getReference(
                            enquiry.id,
                          )}
                        </strong>

                      </div>

                      <span
                        className={`beauty-enquiry-status status-${normalizedStatus}`}
                      >
                        <i />

                        {formatStatus(
                          enquiry.status,
                        )}
                      </span>

                    </div>

                    {/* CARD BODY */}

                    <div className="beauty-enquiry-card-body">

                      <div className="beauty-enquiry-main">

                        <span className="beauty-enquiry-index">
                          {number
                            .toString()
                            .padStart(
                              2,
                              '0',
                            )}
                        </span>

                        <div>

                          <h2>
                            Beauty Service
                            Enquiry
                          </h2>

                          <p>
                            Submitted on{' '}
                            {formatSubmittedDate(
                              enquiry.created_at,
                            )}
                          </p>

                        </div>

                      </div>

                      {/* STATUS MESSAGE */}

                      <div
                        className={`beauty-enquiry-status-message status-message-${normalizedStatus}`}
                      >
                        <strong>
                          {formatStatus(
                            enquiry.status,
                          )}
                        </strong>

                        <p>
                          {getStatusMessage(
                            enquiry.status,
                          )}
                        </p>
                      </div>

                      {/* APPOINTMENT INFO */}

                      <div className="beauty-enquiry-info-card">

                        <div>

                          <span>
                            DATE
                          </span>

                          <strong>
                            {formatDate(
                              enquiry.preferred_date,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            TIME
                          </span>

                          <strong>
                            {formatTime(
                              enquiry.preferred_time,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            PEOPLE
                          </span>

                          <strong>
                            {enquiry.people.length}{' '}
                            {enquiry.people.length ===
                            1
                              ? 'Person'
                              : 'People'}
                          </strong>

                        </div>

                        <div>

                          <span>
                            TOTAL
                          </span>

                          <strong className="beauty-enquiry-total-value">
                            {formatCurrency(
                              Number(
                                enquiry.total_amount,
                              ),
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* CARD FOOTER */}

                    <div className="beauty-enquiry-card-footer">

                      <div className="beauty-enquiry-summary">

                        <span>
                          {enquiry.people.length}{' '}
                          {enquiry.people.length ===
                          1
                            ? 'Person'
                            : 'People'}
                        </span>

                        <span>
                          {enquiry.items.length}{' '}
                          {enquiry.items.length ===
                          1
                            ? 'Service'
                            : 'Services'}
                        </span>

                      </div>

                      <div className="beauty-enquiry-card-actions">

                        {normalizedStatus ===
                          'accepted' && (
                          <button
                            type="button"
                            className="beauty-enquiry-book-button"
                            onClick={() => {
                              setSelectedEnquiryId(
                                enquiry.id,
                              )
                            }}
                          >
                            Select Service &amp;
                            Book Appointment
                          </button>
                        )}

                        <button
                          type="button"
                          className="beauty-enquiry-view-button"
                          onClick={() =>
                            setSelectedEnquiryId(
                              enquiry.id,
                            )
                          }
                        >
                          View Details

                          <span>
                            →
                          </span>

                        </button>

                      </div>

                    </div>

                  </article>
                )
              },
            )}

          </section>
        )}

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {!loading &&
        !error &&
        filteredEnquiries.length >
          0 &&
        totalPages > 1 && (
          <nav
            className="beauty-enquiry-pagination"
            aria-label="Enquiry pagination"
          >

            <button
              type="button"
              className="beauty-enquiry-pagination-button"
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                setCurrentPage(
                  (
                    page,
                  ) =>
                    Math.max(
                      1,
                      page - 1,
                    ),
                )
              }
              aria-label="Previous page"
            >
              ←
            </button>

            <div className="beauty-enquiry-pagination-pages">

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (
                  _,
                  index,
                ) =>
                  index + 1,
              ).map(
                (
                  page,
                ) => (
                  <button
                    key={
                      page
                    }
                    type="button"
                    className={
                      currentPage ===
                      page
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setCurrentPage(
                        page,
                      )
                    }
                  >
                    {page}
                  </button>
                ),
              )}

            </div>

            <button
              type="button"
              className="beauty-enquiry-pagination-button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (
                    page,
                  ) =>
                    Math.min(
                      totalPages,
                      page + 1,
                    ),
                )
              }
              aria-label="Next page"
            >
              →
            </button>

          </nav>
        )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedEnquiry && (
        <div
          className="beauty-enquiry-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedEnquiryId(
                null,
              )
            }
          }}
        >

          <section
            className="beauty-enquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Beauty enquiry details"
          >

            {/* MODAL HEADER */}

            <div className="beauty-enquiry-modal-header">

              <div>

                <span>
                  ENQUIRY DETAILS
                </span>

                <h2>
                  #
                  {getReference(
                    selectedEnquiry.id,
                  )}
                </h2>

              </div>

              <div className="beauty-enquiry-modal-header-right">

                <span
                  className={`beauty-enquiry-status status-${normalizeStatus(
                    selectedEnquiry.status,
                  )}`}
                >
                  <i />

                  {formatStatus(
                    selectedEnquiry.status,
                  )}
                </span>

                <button
                  type="button"
                  className="beauty-enquiry-modal-close"
                  onClick={() =>
                    setSelectedEnquiryId(
                      null,
                    )
                  }
                  aria-label="Close enquiry details"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="beauty-enquiry-modal-content">

              {/* STATUS */}

              <section
                className={`beauty-enquiry-detail-status status-message-${normalizeStatus(
                  selectedEnquiry.status,
                )}`}
              >

                <span>
                  CURRENT STATUS
                </span>

                <strong>
                  {formatStatus(
                    selectedEnquiry.status,
                  )}
                </strong>

                <p>
                  {getStatusMessage(
                    selectedEnquiry.status,
                  )}
                </p>

              </section>

              {/* TOP INFORMATION */}

              <div className="beauty-enquiry-modal-top-grid">

                <div>

                  <span>
                    APPOINTMENT DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedEnquiry.preferred_date,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    APPOINTMENT TIME
                  </span>

                  <strong>
                    {formatTime(
                      selectedEnquiry.preferred_time,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    CONTACT PREFERENCE
                  </span>

                  <strong>
                    {formatContactPreference(
                      selectedEnquiry.contact_preference,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    SUBMITTED
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedEnquiry.created_at,
                    )}
                  </strong>

                </div>

              </div>

              {/* PEOPLE */}

              <section className="beauty-enquiry-people-section">

                <div className="beauty-enquiry-section-heading">

                  <div>

                    <span>
                      PEOPLE &amp; SELECTED SERVICES
                    </span>

                    <h3>
                      {selectedPeople.length}{' '}
                      {selectedPeople.length ===
                      1
                        ? 'Person'
                        : 'People'}
                    </h3>

                  </div>

                </div>

                <div className="beauty-enquiry-people-list">

                  {selectedPeople.map(
                    (
                      person,
                      personIndex,
                    ) => {

                      const personServices =
                        getPersonServices(
                          person.id,
                        )

                      const personTotal =
                        getPersonTotal(
                          person.id,
                        )

                      return (
                        <article
                          key={
                            person.id
                          }
                          className="beauty-enquiry-person-card"
                        >

                          {/* PERSON HEADER */}

                          <div className="beauty-enquiry-person-header">

                            <div className="beauty-enquiry-person-number">

                              {(
                                personIndex +
                                1
                              )
                                .toString()
                                .padStart(
                                  2,
                                  '0',
                                )}

                            </div>

                            <div className="beauty-enquiry-person-details">

                              <span>
                                PERSON
                              </span>

                              <h4>
                                {person.name ||
                                  'Unnamed person'}
                              </h4>

                              <div className="beauty-enquiry-person-contact">

                                {person.email && (
                                  <p>
                                    Email:{' '}
                                    {
                                      person.email
                                    }
                                  </p>
                                )}

                                {person.phone && (
                                  <p>
                                    Phone:{' '}
                                    {
                                      person.phone
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                            <strong className="beauty-enquiry-person-total">
                              {formatCurrency(
                                personTotal,
                              )}
                            </strong>

                          </div>

                          {/* SERVICES */}

                          <div className="beauty-enquiry-person-services">

                            <div className="beauty-enquiry-person-services-heading">

                              <span>
                                SELECTED SERVICES
                              </span>

                              <strong>
                                {
                                  personServices.length
                                }{' '}
                                {personServices.length ===
                                1
                                  ? 'SERVICE'
                                  : 'SERVICES'}
                              </strong>

                            </div>

                            {personServices.length >
                            0 ? (
                              <div className="beauty-enquiry-service-grid">

                                {personServices.map(
                                  (
                                    item,
                                    serviceIndex,
                                  ) => {

                                    const image =
                                      serviceImages[
                                        item.service_id
                                      ]

                                    const originalPrice =
                                      Number(
                                        item.original_price,
                                      ) || 0

                                    const discountAmount =
                                      Number(
                                        item.discount_amount,
                                      ) || 0

                                    const finalPrice =
                                      Number(
                                        item.price,
                                      ) || 0

                                    const hasDiscount =
                                      discountAmount >
                                      0

                                    return (
                                      <article
                                        key={
                                          item.id
                                        }
                                        className="beauty-enquiry-service-card"
                                      >

                                        {/* IMAGE */}

                                        <div className="beauty-enquiry-service-image">

                                          {image ? (
                                            <img
                                              src={
                                                image
                                              }
                                              alt={
                                                item.service_name
                                              }
                                              loading="lazy"
                                            />
                                          ) : (
                                            <div className="beauty-enquiry-service-placeholder">
                                              WF
                                            </div>
                                          )}

                                          <span>
                                            {(
                                              serviceIndex +
                                              1
                                            )
                                              .toString()
                                              .padStart(
                                                2,
                                                '0',
                                              )}
                                          </span>

                                        </div>

                                        {/* CONTENT */}

                                        <div className="beauty-enquiry-service-content">

                                          <div className="beauty-enquiry-service-title-row">

                                            <h5>
                                              {
                                                item.service_name
                                              }
                                            </h5>

                                            {item.discount_label && (
                                              <span className="beauty-enquiry-service-discount-label">
                                                {
                                                  item.discount_label
                                                }
                                              </span>
                                            )}

                                          </div>

                                          <div className="beauty-enquiry-service-duration">

                                            <span>
                                              {getServiceDuration(
                                                item.duration_minutes,
                                              )}
                                            </span>

                                          </div>

                                          <div className="beauty-enquiry-service-pricing">

                                            {hasDiscount && (
                                              <div>

                                                <span>
                                                  Original
                                                </span>

                                                <strong className="beauty-enquiry-original-price">
                                                  {formatCurrency(
                                                    originalPrice,
                                                  )}
                                                </strong>

                                              </div>
                                            )}

                                            {hasDiscount && (
                                              <div>

                                                <span>
                                                  Discount
                                                </span>

                                                <strong className="beauty-enquiry-discount-price">
                                                  -
                                                  {formatCurrency(
                                                    discountAmount,
                                                  )}
                                                </strong>

                                              </div>
                                            )}

                                            <div className="beauty-enquiry-final-price-row">

                                              <span>
                                                Final price
                                              </span>

                                              <strong>
                                                {formatCurrency(
                                                  finalPrice,
                                                )}
                                              </strong>

                                            </div>

                                          </div>

                                        </div>

                                      </article>
                                    )
                                  },
                                )}

                              </div>
                            ) : (
                              <div className="beauty-enquiry-no-services">
                                No services selected.
                              </div>
                            )}

                          </div>

                        </article>
                      )
                    },
                  )}

                </div>

              </section>

              {/* TOTALS */}

              <section className="beauty-enquiry-totals">

                <div>

                  <span>
                    SUBTOTAL
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedEnquiry.subtotal,
                      ),
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    DISCOUNT
                  </span>

                  <strong className="beauty-enquiry-discount-total">
                    -
                    {formatCurrency(
                      Number(
                        selectedEnquiry.discount_amount,
                      ),
                    )}
                  </strong>

                </div>

                <div className="grand-total">

                  <span>
                    TOTAL
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedEnquiry.total_amount,
                      ),
                    )}
                  </strong>

                </div>

              </section>

              {/* NOTES */}

              {selectedEnquiry.notes && (
                <section className="beauty-enquiry-notes">

                  <span>
                    YOUR NOTES
                  </span>

                  <p>
                    {selectedEnquiry.notes}
                  </p>

                </section>
              )}

            </div>

            {/* MODAL FOOTER */}

            <footer className="beauty-enquiry-modal-footer">

              {normalizeStatus(
                selectedEnquiry.status,
              ) ===
                'accepted' && (
                <button
                  type="button"
                  className="beauty-enquiry-modal-book-button"
                  onClick={
                    handleBookAppointment
                  }
                >
                  Select Service &amp;
                  Book Appointment
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiryId(
                    null,
                  )
                }
              >
                Close
              </button>

            </footer>

          </section>

        </div>
      )}

    </main>
  )
}

export default BeautyEnquiries