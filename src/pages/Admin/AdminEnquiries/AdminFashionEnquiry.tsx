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

import './AdminFashionEnquiry.css'

/* =========================================================
   TYPES
========================================================= */

type EnquiryStatus =
  | 'new'
  | 'accepted'
  | 'rejected'

type CustomDesignEnquiry = {
  id: string
  name: string
  phone: string
  email: string | null
  design_type: string
  requirements: Record<string, string> | null
  preferred_date: string | null
  reference_image_url: string | null
  additional_notes: string | null
  status: string
  created_at: string
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10

const STATUS_OPTIONS: {
  value: EnquiryStatus
  label: string
}[] = [
  {
    value: 'new',
    label: 'New',
  },
  {
    value: 'accepted',
    label: 'Contacted / Accepted',
  },
  {
    value: 'rejected',
    label: 'Contacted / Rejected',
  },
]

const HIDDEN_REQUIREMENT_KEYS = [
  'subtype',
  'additional_requirements',
]

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(
  status: string,
): EnquiryStatus {
  if (
    status === 'accepted' ||
    status === 'contacted'
  ) {
    return 'accepted'
  }

  if (
    status === 'rejected' ||
    status === 'closed'
  ) {
    return 'rejected'
  }

  return 'new'
}

function getStatusLabel(
  status: EnquiryStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (item) =>
        item.value === status,
    )?.label ?? status
  )
}

function formatLabel(
  value: string,
): string {
  return value
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Not specified'
  }

  const date = new Date(
    value.includes('T')
      ? value
      : `${value}T00:00:00`,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(
    value,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function getShortId(
  id: string,
): string {
  return id
    .replaceAll('-', '')
    .slice(0, 8)
    .toUpperCase()
}

function getPageNumbers(
  current: number,
  total: number,
): (number | '…')[] {
  if (total <= 7) {
    return Array.from(
      { length: total },
      (_, index) => index + 1,
    )
  }

  const pages: (
    | number
    | '…'
  )[] = [1]

  const start = Math.max(
    2,
    current - 1,
  )
  const end = Math.min(
    total - 1,
    current + 1,
  )

  if (start > 2) {
    pages.push('…')
  }

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page)
  }

  if (end < total - 1) {
    pages.push('…')
  }

  pages.push(total)

  return pages
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminFashionEnquiry() {
  const navigate =
    useNavigate()

  const [
    enquiries,
    setEnquiries,
  ] = useState<
    CustomDesignEnquiry[]
  >([])

  const [
    selectedEnquiry,
    setSelectedEnquiry,
  ] =
    useState<CustomDesignEnquiry | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    savingId,
    setSavingId,
  ] = useState<
    string | null
  >(null)

  const [
    error,
    setError,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'all' | EnquiryStatus
  >('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  /* =======================================================
     LOAD ENQUIRIES
  ======================================================= */

  const loadEnquiries =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        const {
          data,
          error:
            loadError,
        } =
          await supabase
            .from(
              'custom_design_enquiries',
            )
            .select(
              `
                id,
                name,
                phone,
                email,
                design_type,
                requirements,
                preferred_date,
                reference_image_url,
                additional_notes,
                status,
                created_at
              `,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )

        if (loadError) {
          console.error(
            'Unable to load fashion enquiries:',
            loadError,
          )

          setEnquiries([])
          setError(
            loadError.message ||
              'Unable to load fashion enquiries.',
          )
        } else {
          setEnquiries(
            (data ??
              []) as CustomDesignEnquiry[],
          )
        }

        setLoading(false)
      },
      [],
    )

  useEffect(() => {
    void loadEnquiries()
  }, [loadEnquiries])

  /* =======================================================
     CHANGE STATUS
  ======================================================= */

  async function handleStatusChange(
    enquiry: CustomDesignEnquiry,
    nextStatus: EnquiryStatus,
  ) {
    if (
      normalizeStatus(
        enquiry.status,
      ) === nextStatus
    ) {
      return
    }

    const previousStatus =
      enquiry.status

    setSavingId(
      enquiry.id,
    )
    setError('')

    setEnquiries(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            enquiry.id
              ? {
                  ...item,
                  status:
                    nextStatus,
                }
              : item,
        ),
    )

    setSelectedEnquiry(
      (current) =>
        current &&
        current.id ===
          enquiry.id
          ? {
              ...current,
              status:
                nextStatus,
            }
          : current,
    )

    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          'custom_design_enquiries',
        )
        .update({
          status:
            nextStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          enquiry.id,
        )

    if (
      updateError
    ) {
      console.error(
        'Failed to update status:',
        updateError,
      )

      setEnquiries(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              enquiry.id
                ? {
                    ...item,
                    status:
                      previousStatus,
                  }
                : item,
          ),
      )

      setSelectedEnquiry(
        (current) =>
          current &&
          current.id ===
            enquiry.id
            ? {
                ...current,
                status:
                  previousStatus,
              }
            : current,
      )

      setError(
        updateError.message ||
          'Unable to update the status.',
      )
    }

    setSavingId(null)
  }

  /* =======================================================
     DETAILS DRAWER
  ======================================================= */

  const closeDetails =
    useCallback(() => {
      setSelectedEnquiry(
        null,
      )
    }, [])

  useEffect(() => {
    if (
      !selectedEnquiry
    ) {
      return
    }

    const originalOverflow =
      document.body
        .style.overflow

    document.body.style.overflow =
      'hidden'

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        closeDetails()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        originalOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    selectedEnquiry,
    closeDetails,
  ])

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(() => {
      const counts: Record<
        | EnquiryStatus
        | 'total',
        number
      > = {
        total:
          enquiries.length,
        new: 0,
        accepted: 0,
        rejected: 0,
      }

      enquiries.forEach(
        (item) => {
          counts[
            normalizeStatus(
              item.status,
            )
          ] += 1
        },
      )

      return counts
    }, [enquiries])

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredEnquiries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return enquiries.filter(
        (
          enquiry,
        ) => {
          if (
            statusFilter !==
              'all' &&
            normalizeStatus(
              enquiry.status,
            ) !==
              statusFilter
          ) {
            return false
          }

          if (!query) {
            return true
          }

          const searchable =
            [
              enquiry.id,
              getShortId(
                enquiry.id,
              ),
              enquiry.name,
              enquiry.phone,
              enquiry.email ??
                '',
              enquiry.design_type,
            ]
              .join(' ')
              .toLowerCase()

          return searchable.includes(
            query,
          )
        },
      )
    }, [
      enquiries,
      search,
      statusFilter,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    statusFilter,
  ])

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEnquiries.length /
          PAGE_SIZE,
      ),
    )

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  const startIndex =
    (currentPage - 1) *
    PAGE_SIZE

  const paginatedEnquiries =
    filteredEnquiries.slice(
      startIndex,
      startIndex +
        PAGE_SIZE,
    )

  const showingFrom =
    filteredEnquiries.length ===
    0
      ? 0
      : startIndex + 1

  const showingTo =
    Math.min(
      startIndex +
        PAGE_SIZE,
      filteredEnquiries.length,
    )

  /* =======================================================
     STATUS CARD
  ======================================================= */

  function renderStatusCard(
    status: EnquiryStatus,
  ) {
    const active =
      statusFilter ===
      status

    return (
      <button
        key={status}
        type="button"
        className={`afe-stat stat-${status} ${active ? 'active' : ''}`}
        aria-pressed={
          active
        }
        onClick={() =>
          setStatusFilter(
            active
              ? 'all'
              : status,
          )
        }
      >
        <span>
          {getStatusLabel(
            status,
          )}
        </span>

        <strong>
          {statistics[status]}
        </strong>
      </button>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  const selectedRequirements =
    Object.entries(
      selectedEnquiry?.requirements ??
        {},
    ).filter(
      ([key]) =>
        !HIDDEN_REQUIREMENT_KEYS.includes(
          key,
        ),
    )

  return (
    <main className="afe-page">

      {/* BACK TO DASHBOARD */}
      <div className="afe-back-row">
        <button
          type="button"
          className="afe-back-button"
          onClick={() =>
            navigate('/admin')
          }
          aria-label="Back to Dashboard"
        >
          <span aria-hidden="true">
            ←
          </span>
          <span>
            Back to Dashboard
          </span>
        </button>
      </div>

      {/* HEADER */}
      <div className="afe-header">

        <div>
          <span className="afe-eyebrow">
            FASHION MANAGEMENT
          </span>

          <h1>
            Fashion Enquiries
          </h1>

          <p>
            Review custom design
            requests, style
            preferences, reference
            images, and update
            follow-up status.
          </p>
        </div>

        <button
          type="button"
          className="afe-refresh"
          onClick={() =>
            void loadEnquiries()
          }
          disabled={loading}
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </div>

      {/* STATUS CARDS */}
      <section className="afe-statistics">

        <button
          type="button"
          className={`afe-stat stat-all ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() =>
            setStatusFilter(
              'all',
            )
          }
        >
          <span>
            TOTAL
          </span>

          <strong>
            {statistics.total}
          </strong>
        </button>

        {STATUS_OPTIONS.map(
          (option) =>
            renderStatusCard(
              option.value,
            ),
        )}

      </section>

      {/* TOOLBAR */}
      <section className="afe-toolbar">

        <div className="afe-search-wrap">
          <span>
            Search
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search by ID, name, phone, email, or design type..."
            aria-label="Search enquiries"
          />
        </div>

        <div className="afe-filter-wrap">
          <span>
            Status Filter
          </span>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | 'all'
                  | EnquiryStatus,
              )
            }
          >
            <option value="all">
              All Enquiries
            </option>

            <option value="new">
              New
            </option>

            <option value="accepted">
              Contacted / Accepted
            </option>

            <option value="rejected">
              Contacted / Rejected
            </option>
          </select>
        </div>

      </section>

      {/* ERROR */}
      {error && (
        <div
          className="afe-error"
          role="alert"
        >
          <div>
            <strong>
              Unable to complete request
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN LIST CARD */}
      <section className="afe-card">

        <div className="afe-card-heading">

          <div>
            <span>
              ENQUIRY LIST
            </span>

            <h2>
              Custom Design Requests
            </h2>
          </div>

          <p>
            {filteredEnquiries.length}{' '}
            {filteredEnquiries.length ===
            1
              ? 'enquiry'
              : 'enquiries'}
          </p>

        </div>

        {loading ? (
          <div className="afe-state">
            <div className="afe-spinner" />
            <p>
              Loading enquiries...
            </p>
          </div>
        ) : filteredEnquiries.length ===
          0 ? (
          <div className="afe-state afe-empty">
            <div className="afe-empty-icon">
              —
            </div>

            <h3>
              No enquiries found
            </h3>

            <p>
              Try changing the search
              or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="afe-table-wrap">

              <table className="afe-table">

                <thead>
                  <tr>
                    <th>
                      Enquiry
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Design Type
                    </th>

                    <th>
                      Submitted
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEnquiries.map(
                    (
                      enquiry,
                    ) => {
                      const status =
                        normalizeStatus(
                          enquiry.status,
                        )

                      return (
                        <tr
                          key={
                            enquiry.id
                          }
                        >

                          <td>
                            <div className="afe-cell">
                              <strong>
                                #
                                {getShortId(
                                  enquiry.id,
                                )}
                              </strong>

                              <span>
                                {formatDateTime(
                                  enquiry.created_at,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="afe-cell">
                              <strong>
                                {
                                  enquiry.name
                                }
                              </strong>

                              <span>
                                {
                                  enquiry.phone
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="afe-cell">
                              <strong className="afe-design-type-title">
                                {
                                  enquiry.design_type
                                }
                              </strong>

                              <span>
                                Pref:{' '}
                                {formatDate(
                                  enquiry.preferred_date,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="afe-date-text">
                              {formatDateTime(
                                enquiry.created_at,
                              )}
                            </span>
                          </td>

                          <td>
                            <select
                              className={`afe-status-select status-${status}`}
                              value={
                                status
                              }
                              onChange={(
                                event,
                              ) =>
                                void handleStatusChange(
                                  enquiry,
                                  event
                                    .target
                                    .value as EnquiryStatus,
                                )
                              }
                              disabled={
                                savingId ===
                                enquiry.id
                              }
                              aria-label={`Status for enquiry ${getShortId(
                                enquiry.id,
                              )}`}
                            >
                              {STATUS_OPTIONS.map(
                                (
                                  option,
                                ) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="afe-view-button"
                              onClick={() =>
                                setSelectedEnquiry(
                                  enquiry,
                                )
                              }
                            >
                              View
                            </button>
                          </td>

                        </tr>
                      )
                    },
                  )}
                </tbody>

              </table>

            </div>

            {/* PAGINATION */}
            <div className="afe-pagination">

              <p className="afe-pagination-info">
                Showing{' '}
                {showingFrom}–
                {showingTo} of{' '}
                {
                  filteredEnquiries.length
                }
              </p>

              {totalPages >
                1 && (
                <nav
                  className="afe-pagination-controls"
                  aria-label="Enquiry pages"
                >

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          Math.max(
                            1,
                            page -
                              1,
                          ),
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                  >
                    Previous
                  </button>

                  {getPageNumbers(
                    currentPage,
                    totalPages,
                  ).map(
                    (
                      page,
                      index,
                    ) =>
                      page ===
                      '…' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="afe-pagination-gap"
                        >
                          …
                        </span>
                      ) : (
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
                          aria-current={
                            currentPage ===
                            page
                              ? 'page'
                              : undefined
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

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          Math.min(
                            totalPages,
                            page +
                              1,
                          ),
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                  >
                    Next
                  </button>

                </nav>
              )}

            </div>
          </>
        )}

      </section>

      {/* DETAILS DRAWER */}
      {selectedEnquiry && (
        <div
          className="afe-overlay"
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

          <aside
            className="afe-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="afe-details-title"
          >

            <div className="afe-drawer-header">

              <div>
                <span>
                  CUSTOM DESIGN ENQUIRY
                </span>

                <h2 id="afe-details-title">
                  #
                  {getShortId(
                    selectedEnquiry.id,
                  )}{' '}
                  —{' '}
                  {
                    selectedEnquiry.name
                  }
                </h2>
              </div>

              <button
                type="button"
                className="afe-close"
                onClick={
                  closeDetails
                }
                aria-label="Close enquiry details"
              >
                ×
              </button>

            </div>

            <div className="afe-drawer-body">

              {/* STATUS UPDATE */}
              <section className="afe-detail-section">
                <div className="afe-section-title">
                  <span>
                    CURRENT STATUS
                  </span>

                  <h3>
                    Enquiry Progress
                  </h3>
                </div>

                <select
                  className={`afe-status-select status-${normalizeStatus(
                    selectedEnquiry.status,
                  )}`}
                  value={normalizeStatus(
                    selectedEnquiry.status,
                  )}
                  onChange={(
                    event,
                  ) =>
                    void handleStatusChange(
                      selectedEnquiry,
                      event.target
                        .value as EnquiryStatus,
                    )
                  }
                  disabled={
                    savingId ===
                    selectedEnquiry.id
                  }
                  aria-label="Enquiry status"
                >
                  {STATUS_OPTIONS.map(
                    (
                      option,
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </section>

              {/* CUSTOMER */}
              <section className="afe-detail-section">
                <div className="afe-section-title">
                  <span>
                    CUSTOMER
                  </span>

                  <h3>
                    Contact Information
                  </h3>
                </div>

                <div className="afe-info-grid">

                  <div>
                    <span>
                      Name
                    </span>

                    <strong>
                      {
                        selectedEnquiry.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                    >
                      {
                        selectedEnquiry.phone
                      }
                    </a>
                  </div>

                  <div>
                    <span>
                      Email
                    </span>

                    {selectedEnquiry.email ? (
                      <a
                        href={`mailto:${selectedEnquiry.email}`}
                      >
                        {
                          selectedEnquiry.email
                        }
                      </a>
                    ) : (
                      <strong>
                        —
                      </strong>
                    )}
                  </div>

                  <div>
                    <span>
                      Submitted
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedEnquiry.created_at,
                      )}
                    </strong>
                  </div>

                </div>
              </section>

              {/* DESIGN REQUIREMENTS */}
              <section className="afe-detail-section">
                <div className="afe-section-title">
                  <span>
                    SPECIFICATIONS
                  </span>

                  <h3>
                    Design Requirements
                  </h3>
                </div>

                <div className="afe-info-grid">

                  <div>
                    <span>
                      Design Type
                    </span>

                    <strong className="afe-highlight-text">
                      {
                        selectedEnquiry.design_type
                      }
                    </strong>
                  </div>

                  {selectedEnquiry.preferred_date && (
                    <div>
                      <span>
                        Preferred Date
                      </span>

                      <strong>
                        {formatDate(
                          selectedEnquiry.preferred_date,
                        )}
                      </strong>
                    </div>
                  )}

                  {selectedRequirements.map(
                    ([
                      key,
                      value,
                    ]) => (
                      <div
                        key={
                          key
                        }
                      >
                        <span>
                          {formatLabel(
                            key,
                          )}
                        </span>

                        <strong>
                          {value ||
                            'Not specified'}
                        </strong>
                      </div>
                    ),
                  )}

                </div>
              </section>

              {/* REFERENCE IMAGE */}
              {selectedEnquiry.reference_image_url && (
                <section className="afe-detail-section">
                  <div className="afe-section-title">
                    <span>
                      ATTACHMENT
                    </span>

                    <h3>
                      Reference Design Image
                    </h3>
                  </div>

                  <div className="afe-reference-box">
                    <img
                      src={
                        selectedEnquiry.reference_image_url
                      }
                      alt="Reference design"
                      className="afe-reference-image-preview"
                    />

                    <div className="afe-reference-meta">
                      <span>
                        ATTACHED CLIENT REFERENCE
                      </span>

                      <a
                        href={
                          selectedEnquiry.reference_image_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="afe-reference-link"
                      >
                        Open Full Resolution ↗
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* ADDITIONAL NOTES */}
              {selectedEnquiry.additional_notes &&
                selectedEnquiry.additional_notes !==
                  'No additional requirements' &&
                selectedEnquiry.additional_notes !==
                  'None' && (
                  <section className="afe-detail-section">
                    <div className="afe-section-title">
                      <span>
                        CLIENT NOTES
                      </span>

                      <h3>
                        Additional Requirements
                      </h3>
                    </div>

                    <div className="afe-note">
                      {
                        selectedEnquiry.additional_notes
                      }
                    </div>
                  </section>
                )}

            </div>

          </aside>

        </div>
      )}

    </main>
  )
}

export default AdminFashionEnquiry