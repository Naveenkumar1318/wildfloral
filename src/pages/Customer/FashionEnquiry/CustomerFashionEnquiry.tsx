import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './CustomerFashionEnquiry.css'

/* =========================================================
   TYPES
========================================================= */

type CustomerStatus =
  | 'new'
  | 'contacted-accepted'
  | 'contacted-rejected'

type FilterStatus =
  | 'all'
  | CustomerStatus

type FashionEnquiry = {
  id: string
  customer_id: string | null
  name: string
  phone: string
  email: string | null
  design_type: string
  requirements: Record<string, unknown> | null
  preferred_date: string | null
  reference_image_url: string | null
  additional_notes: string | null
  status: string
  created_at: string
  updated_at: string
}

/* =========================================================
   HELPERS
========================================================= */

function getCustomerStatus(
  status: string,
): CustomerStatus {
  const normalized =
    status
      ?.toLowerCase()
      .trim()

  if (
    normalized === 'rejected' ||
    normalized === 'closed'
  ) {
    return 'contacted-rejected'
  }

  if (
    normalized === 'contacted' ||
    normalized === 'in_progress' ||
    normalized === 'accepted'
  ) {
    return 'contacted-accepted'
  }

  return 'new'
}

function getStatusLabel(
  status: CustomerStatus,
) {
  switch (status) {
    case 'contacted-accepted':
      return 'Contacted / Accepted'

    case 'contacted-rejected':
      return 'Contacted / Rejected'

    case 'new':
    default:
      return 'Enquiry Processing'
  }
}

function getStatusMessage(
  status: CustomerStatus,
) {
  switch (status) {
    case 'contacted-accepted':
      return 'Your enquiry has been accepted and our fashion design team will contact you regarding the next steps.'

    case 'contacted-rejected':
      return 'Your enquiry has been reviewed and could not be accepted at this time.'

    case 'new':
    default:
      return 'Your enquiry is being reviewed by our fashion design team.'
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

function formatDate(
  date: string | null,
) {
  if (!date) {
    return '—'
  }

  const parsed =
    new Date(date.includes('T') ? date : `${date}T00:00:00`)

  if (
    Number.isNaN(
      parsed.getTime(),
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
  ).format(parsed)
}

function formatRequirementLabel(
  key: string,
) {
  return key
    .replace(
      /([A-Z])/g,
      ' $1',
    )
    .replace(
      /[_-]/g,
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
    .replace(
      /^./,
      (letter) =>
        letter.toUpperCase(),
    )
}

function getRequirementEntries(
  requirements:
    Record<string, unknown> | null,
) {
  if (
    !requirements ||
    typeof requirements !== 'object'
  ) {
    return []
  }

  return Object.entries(
    requirements,
  ).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  )
}

/* =========================================================
   COMPONENT
========================================================= */

function CustomerFashionEnquiry() {
  const navigate =
    useNavigate()

  const [
    enquiries,
    setEnquiries,
  ] = useState<
    FashionEnquiry[]
  >([])

  const [
    selectedEnquiry,
    setSelectedEnquiry,
  ] = useState<
    FashionEnquiry | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    filter,
    setFilter,
  ] = useState<FilterStatus>(
    'all',
  )

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const ITEMS_PER_PAGE = 3

  /* =======================================================
     LOAD ENQUIRIES
  ======================================================= */

  const loadEnquiries =
    useCallback(
      async () => {
        try {
          setError('')

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser()

          if (userError) {
            throw new Error(
              userError.message ||
                'Unable to verify your account.',
            )
          }

          if (!user) {
            setEnquiries([])

            throw new Error(
              'Please login to view your fashion enquiries.',
            )
          }

          const {
            data,
            error:
              enquiryError,
          } =
            await supabase
              .from(
                'custom_design_enquiries',
              )
              .select(`
                id,
                customer_id,
                name,
                phone,
                email,
                design_type,
                requirements,
                preferred_date,
                reference_image_url,
                additional_notes,
                status,
                created_at,
                updated_at
              `)
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

          if (enquiryError) {
            throw new Error(
              enquiryError.message ||
                'Unable to load your fashion enquiries.',
            )
          }

          setEnquiries(
            (data ?? []) as FashionEnquiry[],
          )

          setCurrentPage(1)

        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load fashion enquiries.',
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadEnquiries()
  }, [loadEnquiries])

  /* =======================================================
     FILTERED & PAGINATED
  ======================================================= */

  const filteredEnquiries =
    useMemo(() => {
      if (filter === 'all') {
        return enquiries
      }

      return enquiries.filter(
        (enquiry) =>
          getCustomerStatus(
            enquiry.status,
          ) === filter,
      )
    }, [
      enquiries,
      filter,
    ])

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEnquiries.length /
          ITEMS_PER_PAGE,
      ),
    )

  const paginatedEnquiries =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE

      return filteredEnquiries.slice(
        start,
        start + ITEMS_PER_PAGE,
      )
    }, [
      filteredEnquiries,
      currentPage,
    ])

  const handleFilterChange = (
    nextFilter: FilterStatus,
  ) => {
    setFilter(nextFilter)
    setCurrentPage(1)
  }

  const handleRefresh =
    async () => {
      setRefreshing(true)
      await loadEnquiries()
    }

  const handleNewEnquiry =
    () => {
      navigate(
        '/fashion?fashion_enquiry=1',
      )
    }

  const closeDetails =
    () => {
      setSelectedEnquiry(null)
    }

  useEffect(() => {
    if (!selectedEnquiry) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape'
      ) {
        setSelectedEnquiry(null)
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    selectedEnquiry,
  ])

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    const result = {
      all: enquiries.length,
      new: 0,
      accepted: 0,
      rejected: 0,
    }

    enquiries.forEach(
      (enquiry) => {
        const status =
          getCustomerStatus(
            enquiry.status,
          )

        if (status === 'new') {
          result.new += 1
        }

        if (
          status ===
          'contacted-accepted'
        ) {
          result.accepted += 1
        }

        if (
          status ===
          'contacted-rejected'
        ) {
          result.rejected += 1
        }
      },
    )

    return result
  }, [
    enquiries,
  ])

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="customer-fashion-enquiry">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="customer-fashion-enquiry-header">

        <button
          type="button"
          className="customer-fashion-enquiry-back-button"
          onClick={() => navigate('/account')}
          aria-label="Back to account"
        >
          <span aria-hidden="true">
            ←
          </span>
          Back
        </button>

        <div className="customer-fashion-enquiry-heading">

          <span className="customer-fashion-enquiry-eyebrow">
            WILDFLORAL FASHION
          </span>

          <h1>
            My Fashion
            <span>
              {' '}
              Enquiries
            </span>
          </h1>

          <p>
            View and track your custom fashion design enquiries, preferred
            timelines, design specifications, reference styles, and enquiry status.
          </p>

        </div>

        <div className="customer-fashion-enquiry-header-side">

          <div className="customer-fashion-enquiry-count">

            <span>
              TOTAL ENQUIRIES
            </span>

            <strong>
              {counts.all
                .toString()
                .padStart(
                  2,
                  '0',
                )}
            </strong>

          </div>

          <div className="customer-fashion-enquiry-header-actions">

            <button
              type="button"
              className="customer-fashion-enquiry-new-btn"
              onClick={handleNewEnquiry}
            >
              + New Enquiry
            </button>

            <button
              type="button"
              className="customer-fashion-enquiry-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh enquiries"
            >
              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section
        className="customer-fashion-enquiry-filters"
        role="tablist"
        aria-label="Enquiry status filters"
      >

        <button
          type="button"
          role="tab"
          aria-selected={
            filter === 'all'
          }
          className={
            filter === 'all'
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
            {counts.all}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            filter === 'new'
          }
          className={
            filter === 'new'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('new')
          }
        >
          <span>NEW</span>

          <strong>
            {counts.new}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            filter === 'contacted-accepted'
          }
          className={
            filter === 'contacted-accepted'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('contacted-accepted')
          }
        >
          <span>CONTACTED / ACCEPTED</span>
          <strong>{counts.accepted}</strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            filter === 'contacted-rejected'
          }
          className={
            filter === 'contacted-rejected'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleFilterChange('contacted-rejected')
          }
        >
          <span>CONTACTED / REJECTED</span>
          <strong>{counts.rejected}</strong>
        </button>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <section className="customer-fashion-enquiry-state customer-fashion-enquiry-error">

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

          <button
            type="button"
            className="customer-fashion-enquiry-retry-btn"
            onClick={handleRefresh}
          >
            Try Again
          </button>

        </section>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading &&
        !error && (
          <section className="customer-fashion-enquiry-state">

            <span className="customer-fashion-enquiry-spinner" />

            <p>
              Loading your fashion enquiries...
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
          <section className="customer-fashion-enquiry-empty">

            <span className="customer-fashion-enquiry-empty-number">
              01
            </span>

            <h2>
              {filter === 'all'
                ? 'No fashion enquiries yet.'
                : 'No enquiries matching this filter.'}
            </h2>

            <p>
              {filter === 'all'
                ? "You haven't submitted a custom fashion enquiry yet. Start the Fashion Design Assistant to create one."
                : 'Enquiries matching this status will appear here.'}
            </p>

            {filter === 'all' && (
              <button
                type="button"
                onClick={handleNewEnquiry}
                className="customer-fashion-enquiry-start-btn"
              >
                Start Fashion Enquiry
                <span>
                  →
                </span>
              </button>
            )}

          </section>
        )}

      {/* =====================================================
          ENQUIRY LIST
      ===================================================== */}

      {!loading &&
        !error &&
        filteredEnquiries.length >
          0 && (
          <section className="customer-fashion-enquiry-list">

            {paginatedEnquiries.map(
              (
                enquiry,
                index,
              ) => {

                const status =
                  getCustomerStatus(
                    enquiry.status,
                  )

                const number =
                  (currentPage - 1) *
                    ITEMS_PER_PAGE +
                  index +
                  1

                const requirements =
                  enquiry.requirements

                const subtype =
                  requirements?.subtype ||
                  requirements?.design_subtype ||
                  requirements?.dress_type ||
                  requirements?.saree_type ||
                  requirements?.lehenga_type ||
                  requirements?.blouse_type ||
                  ''

                const mainType =
                  requirements?.main_type ||
                  ''

                const occasion =
                  requirements?.occasion ||
                  ''

                const colour =
                  requirements?.colour ||
                  requirements?.color ||
                  ''

                return (
                  <article
                    key={enquiry.id}
                    className="customer-fashion-enquiry-card"
                  >

                    {/* CARD HEADER */}

                    <div className="customer-fashion-enquiry-card-header">

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
                        className={`customer-fashion-enquiry-status status-${status}`}
                      >
                        <i />

                        {getStatusLabel(
                          status,
                        )}
                      </span>

                    </div>

                    {/* CARD BODY */}

                    <div className="customer-fashion-enquiry-card-body">

                      <div className="customer-fashion-enquiry-main">

                        <span className="customer-fashion-enquiry-index">
                          {number
                            .toString()
                            .padStart(
                              2,
                              '0',
                            )}
                        </span>

                        <div>

                          <h2>
                            {enquiry.design_type ||
                              'Custom Fashion Design'}
                          </h2>

                          <p>
                            Submitted on{' '}
                            {formatDate(
                              enquiry.created_at,
                            )}
                          </p>

                        </div>

                      </div>

                      {/* STATUS MESSAGE */}

                      <div
                        className={`customer-fashion-enquiry-status-message status-message-${status}`}
                      >
                        <strong>
                          {getStatusLabel(
                            status,
                          )}
                        </strong>

                        <p>
                          {getStatusMessage(
                            status,
                          )}
                        </p>
                      </div>

                      {/* APPOINTMENT / SPEC INFO */}

                      <div className="customer-fashion-enquiry-info-card">

                        <div>

                          <span>
                            DESIGN TYPE
                          </span>

                          <strong>
                            {enquiry.design_type ||
                              'Custom'}
                          </strong>

                        </div>

                        <div>

                          <span>
                            SUBMITTED
                          </span>

                          <strong>
                            {formatDate(
                              enquiry.created_at,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            PREFERRED DATE
                          </span>

                          <strong>
                            {formatDate(
                              enquiry.preferred_date,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            OCCASION / STYLE
                          </span>

                          <strong className="customer-fashion-enquiry-accent-value">
                            {occasion ? String(occasion) : (mainType ? String(mainType) : (subtype ? String(subtype) : 'Custom Design'))}
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* CARD FOOTER */}

                    <div className="customer-fashion-enquiry-card-footer">

                      <div className="customer-fashion-enquiry-summary">

                        {mainType && (
                          <span>
                            {String(mainType)}
                          </span>
                        )}

                        {subtype && (
                          <span>
                            {String(subtype)}
                          </span>
                        )}

                        {occasion && (
                          <span>
                            {String(occasion)}
                          </span>
                        )}

                        {colour && (
                          <span>
                            {String(colour)}
                          </span>
                        )}

                        {enquiry.reference_image_url && (
                          <span>
                            Image Attached
                          </span>
                        )}

                      </div>

                      <div className="customer-fashion-enquiry-card-actions">

                        <button
                          type="button"
                          className="customer-fashion-enquiry-view-button"
                          onClick={() =>
                            setSelectedEnquiry(
                              enquiry,
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
            className="customer-fashion-enquiry-pagination"
            aria-label="Enquiry pagination"
          >

            <button
              type="button"
              className="customer-fashion-enquiry-pagination-button"
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

            <div className="customer-fashion-enquiry-pagination-pages">

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
              className="customer-fashion-enquiry-pagination-button"
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
          className="customer-fashion-enquiry-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails()
            }
          }}
        >

          <section
            className="customer-fashion-enquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Fashion enquiry details"
          >

            {/* MODAL HEADER */}

            <div className="customer-fashion-enquiry-modal-header">

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

              <div className="customer-fashion-enquiry-modal-header-right">

                <span
                  className={`customer-fashion-enquiry-status status-${getCustomerStatus(
                    selectedEnquiry.status,
                  )}`}
                >
                  <i />

                  {getStatusLabel(
                    getCustomerStatus(
                      selectedEnquiry.status,
                    ),
                  )}
                </span>

                <button
                  type="button"
                  className="customer-fashion-enquiry-modal-close"
                  onClick={closeDetails}
                  aria-label="Close details"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="customer-fashion-enquiry-modal-content">

              {/* CURRENT STATUS */}

              <section
                className={`customer-fashion-enquiry-detail-status status-message-${getCustomerStatus(
                  selectedEnquiry.status,
                )}`}
              >

                <span>
                  CURRENT STATUS
                </span>

                <strong>
                  {getStatusLabel(
                    getCustomerStatus(
                      selectedEnquiry.status,
                    ),
                  )}
                </strong>

                <p>
                  {getStatusMessage(
                    getCustomerStatus(
                      selectedEnquiry.status,
                    ),
                  )}
                </p>

              </section>

              {/* TOP GRID */}

              <div className="customer-fashion-enquiry-modal-top-grid">

                <div>

                  <span>
                    DESIGN TYPE
                  </span>

                  <strong>
                    {selectedEnquiry.design_type}
                  </strong>

                </div>

                <div>

                  <span>
                    SUBMITTED DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedEnquiry.created_at,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    PREFERRED DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedEnquiry.preferred_date,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    REFERENCE IMAGE
                  </span>

                  <strong>
                    {selectedEnquiry.reference_image_url
                      ? 'Image Attached'
                      : 'None'}
                  </strong>

                </div>

              </div>

              {/* DESIGN SPECIFICATIONS SECTION */}

              <section className="customer-fashion-enquiry-detail-section">

                <div className="customer-fashion-enquiry-section-heading">

                  <div>

                    <span>
                      01
                    </span>

                    <h3>
                      Design Specifications
                    </h3>

                  </div>

                </div>

                <div className="customer-fashion-enquiry-specs-grid">

                  <div className="customer-fashion-enquiry-spec-card">

                    <span>
                      DESIGN TYPE
                    </span>

                    <strong>
                      {selectedEnquiry.design_type}
                    </strong>

                  </div>

                  {getRequirementEntries(
                    selectedEnquiry.requirements,
                  ).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="customer-fashion-enquiry-spec-card"
                      >

                        <span>
                          {formatRequirementLabel(
                            key,
                          )}
                        </span>

                        <strong>
                          {String(value)}
                        </strong>

                      </div>
                    ),
                  )}

                </div>

              </section>

              {/* REFERENCE IMAGE SECTION */}

              {selectedEnquiry.reference_image_url && (
                <section className="customer-fashion-enquiry-detail-section">

                  <div className="customer-fashion-enquiry-section-heading">

                    <div>

                      <span>
                        02
                      </span>

                      <h3>
                        Reference Design
                      </h3>

                    </div>

                  </div>

                  <div className="customer-fashion-enquiry-reference-card">

                    <img
                      src={selectedEnquiry.reference_image_url}
                      alt="Reference Design"
                      className="customer-fashion-enquiry-reference-img"
                    />

                    <div className="customer-fashion-enquiry-reference-info">

                      <span>
                        ATTACHED REFERENCE IMAGE
                      </span>

                      <a
                        href={selectedEnquiry.reference_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Full Image ↗
                      </a>

                    </div>

                  </div>

                </section>
              )}

              {/* ADDITIONAL NOTES */}

              {selectedEnquiry.additional_notes &&
                selectedEnquiry.additional_notes !== 'None' && (
                  <section className="customer-fashion-enquiry-notes">

                    <span>
                      YOUR NOTES &amp; ADDITIONAL REQUIREMENTS
                    </span>

                    <p>
                      {selectedEnquiry.additional_notes}
                    </p>

                  </section>
                )}

            </div>

            {/* MODAL FOOTER */}

            <footer className="customer-fashion-enquiry-modal-footer">

              <button
                type="button"
                onClick={closeDetails}
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

export default CustomerFashionEnquiry