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

import './AdminbeautyEnquiries.css'

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

type Enquiry = {
  id: string
  customer_id: string
  preferred_date: string
  preferred_time: string
  contact_preference: string
  notes: string | null
  subtotal: number | string
  discount_amount: number | string
  total_amount: number | string
  status: EnquiryStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

type EnquiryPerson = {
  id: string
  enquiry_id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
}

type EnquiryItem = {
  id: string
  enquiry_id: string
  person_id: string
  service_id: string
  service_name: string
  duration_minutes: number
  original_price: number | string
  price: number | string
  discount_amount: number | string
  discount_label: string | null
  created_at: string
}

type ServiceRecord = {
  id: string
  name: string
  image_url: string | null
}

type EnquiryDetails = {
  enquiry: Enquiry
  people: EnquiryPerson[]
  items: EnquiryItem[]
  serviceImages: Record<string, string>
}

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS: EnquiryStatus[] = [
  'new',
  'contacted',
  'accepted',
  'rejected',
  'converted',
  'closed',
]

const PAGE_SIZE = 10

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  value: number | string,
): string {
  const amount = Number(value) || 0

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(
    `${value}T00:00:00`,
  )

  if (Number.isNaN(date.getTime())) {
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
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
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

function formatTime(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const parts = value.split(':')

  if (parts.length < 2) {
    return value
  }

  const hour = Number(parts[0])
  const minute = parts[1]

  if (
    !Number.isFinite(hour) ||
    !minute
  ) {
    return value
  }

  const period =
    hour >= 12
      ? 'PM'
      : 'AM'

  const displayHour =
    hour % 12 || 12

  return `${displayHour}:${minute} ${period}`
}

function formatStatus(
  status: EnquiryStatus,
): string {
  switch (status) {
    case 'new':
      return 'New'

    case 'contacted':
      return 'Contacted'

    case 'accepted':
      return 'Accepted'

    case 'rejected':
      return 'Rejected'

    case 'converted':
      return 'Converted'

    case 'closed':
      return 'Closed'

    default:
      return status
  }
}

function formatContactPreference(
  value: string,
): string {
  switch (value) {
    case 'whatsapp':
      return 'WhatsApp'

    case 'email':
      return 'Email'

    case 'call':
      return 'Phone Call'

    case 'message':
      return 'Message'

    case 'personal_home_enquiry':
      return 'Personal / Home'

    default:
      return value
  }
}

function getShortId(
  id: string,
): string {
  return id
    .replaceAll('-', '')
    .slice(0, 8)
    .toUpperCase()
}

function getStatusClass(
  status: EnquiryStatus,
): string {
  return `status-${status}`
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminbeautyEnquiries() {
  const navigate = useNavigate()
  const [
    enquiries,
    setEnquiries,
  ] = useState<Enquiry[]>([])

  const [
    selectedDetails,
    setSelectedDetails,
  ] =
    useState<EnquiryDetails | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

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
  ] =
    useState<
      'all' | EnquiryStatus
    >('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    editStatus,
    setEditStatus,
  ] =
    useState<EnquiryStatus>('new')

  const [
    adminNotes,
    setAdminNotes,
  ] = useState('')

  /* =======================================================
     LOAD ENQUIRIES
  ======================================================= */

  const loadEnquiries =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        try {
          const {
            data,
            error:
              enquiryError,
          } =
            await supabase
              .from('enquiries')
              .select(
                `
                  id,
                  customer_id,
                  preferred_date,
                  preferred_time,
                  contact_preference,
                  notes,
                  subtotal,
                  discount_amount,
                  total_amount,
                  status,
                  admin_notes,
                  created_at,
                  updated_at
                `,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (
            enquiryError
          ) {
            throw enquiryError
          }

          setEnquiries(
            (data ??
              []) as Enquiry[],
          )
        } catch (
          loadError
        ) {
          console.error(
            'Failed to load enquiries:',
            loadError,
          )

          setEnquiries([])

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Unable to load enquiries.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadEnquiries()
  }, [loadEnquiries])

  /* =======================================================
     OPEN ENQUIRY DETAILS
  ======================================================= */

  const openEnquiry =
    useCallback(
      async (
        enquiry: Enquiry,
      ) => {
        setDetailsLoading(true)
        setError('')

        setSelectedDetails(
          null,
        )

        setEditStatus(
          enquiry.status,
        )

        setAdminNotes(
          enquiry.admin_notes ??
            '',
        )

        try {
          const [
            peopleResponse,
            itemsResponse,
          ] = await Promise.all([
            supabase
              .from('enquiry_people')
              .select(
                `
                  id,
                  enquiry_id,
                  name,
                  phone,
                  email,
                  created_at
                `,
              )
              .eq(
                'enquiry_id',
                enquiry.id,
              )
              .order(
                'created_at',
                {
                  ascending: true,
                },
              ),
            supabase
              .from('enquiry_items')
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
                  discount_label,
                  created_at
                `,
              )
              .eq(
                'enquiry_id',
                enquiry.id,
              )
              .order(
                'created_at',
                {
                  ascending: true,
                },
              ),
          ])

          if (peopleResponse.error) {
            throw peopleResponse.error
          }

          if (itemsResponse.error) {
            throw itemsResponse.error
          }

          const people =
            (peopleResponse.data ??
              []) as EnquiryPerson[]

          const items =
            (itemsResponse.data ??
              []) as EnquiryItem[]

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

          const serviceImages:
            Record<
              string,
              string
            > = {}

          if (
            serviceIds.length >
            0
          ) {
            const {
              data:
                serviceData,
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
                    image_url
                  `,
                )
                .in(
                  'id',
                  serviceIds,
                )

            if (serviceError) {
              console.error(
                'Service image lookup failed:',
                serviceError,
              )
            } else {
              const services =
                (serviceData ??
                  []) as ServiceRecord[]

              services.forEach(
                (
                  service,
                ) => {
                  if (
                    service.image_url
                  ) {
                    serviceImages[
                      service.id
                    ] =
                      service.image_url
                  }
                },
              )
            }
          }

          setSelectedDetails(
            {
              enquiry,
              people,
              items,
              serviceImages,
            },
          )
        } catch (
          detailsError
        ) {
          console.error(
            'Failed to load enquiry details:',
            detailsError,
          )

          setError(
            detailsError instanceof
              Error
              ? detailsError.message
              : 'Unable to load enquiry details.',
          )
        } finally {
          setDetailsLoading(
            false,
          )
        }
      },
      [],
    )

  /* =======================================================
     CLOSE DETAILS
  ======================================================= */

  const closeDetails =
    useCallback(() => {
      if (saving) {
        return
      }

      setSelectedDetails(
        null,
      )

      setDetailsLoading(
        false,
      )
    }, [saving])

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!selectedDetails) {
      return
    }

    const originalOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        originalOverflow
    }
  }, [selectedDetails])

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!selectedDetails) {
      return
    }

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
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    selectedDetails,
    closeDetails,
  ])

  /* =======================================================
     UPDATE ENQUIRY
  ======================================================= */

  const updateEnquiry =
    async () => {
      if (
        !selectedDetails
      ) {
        return
      }

      setSaving(true)
      setError('')

      try {
        const {
          data,
          error:
            updateError,
        } =
          await supabase
            .from('enquiries')
            .update({
              status:
                editStatus,
              admin_notes:
                adminNotes.trim() ||
                null,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              selectedDetails
                .enquiry.id,
            )
            .select(
              `
                id,
                customer_id,
                preferred_date,
                preferred_time,
                contact_preference,
                notes,
                subtotal,
                discount_amount,
                total_amount,
                status,
                admin_notes,
                created_at,
                updated_at
              `,
            )
            .single()

        if (
          updateError
        ) {
          throw updateError
        }

        if (!data) {
          throw new Error(
            'Unable to update enquiry.',
          )
        }

const updatedEnquiry =
  data as Enquiry

/*
 * Update local table immediately.
 */
setEnquiries(
  (current) =>
    current.map(
      (item) =>
        item.id ===
        updatedEnquiry.id
          ? updatedEnquiry
          : item,
    ),
)

/*
 * Close the details drawer after
 * a successful save.
 */
setSelectedDetails(null)

/*
 * Reload the complete enquiry list.
 *
 * This refreshes:
 * - enquiry rows
 * - statistics
 * - status counts
 * - filtered results
 */
await loadEnquiries()
      } catch (
        updateError
      ) {
        console.error(
          'Failed to update enquiry:',
          updateError,
        )

        setError(
          updateError instanceof
            Error
            ? updateError.message
            : 'Unable to update enquiry.',
        )
      } finally {
        setSaving(false)
      }
    }

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
          const matchesStatus =
            statusFilter ===
              'all' ||
            enquiry.status ===
              statusFilter

          if (
            !matchesStatus
          ) {
            return false
          }

          if (!query) {
            return true
          }

          const searchable =
            [
              enquiry.id,
              enquiry.customer_id,
              enquiry.contact_preference,
              enquiry.status,
              enquiry.notes ??
                '',
              enquiry.admin_notes ??
                '',
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
     RESET PAGE
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    statusFilter,
  ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEnquiries.length /
          PAGE_SIZE,
      ),
    )

  const paginatedEnquiries =
    filteredEnquiries.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage *
        PAGE_SIZE,
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

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(
      () => ({
        total:
          enquiries.length,

        new:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'new',
          ).length,

        contacted:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'contacted',
          ).length,

        accepted:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'accepted',
          ).length,

        rejected:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'rejected',
          ).length,

        converted:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'converted',
          ).length,

        closed:
          enquiries.filter(
            (
              item,
            ) =>
              item.status ===
              'closed',
          ).length,
      }),
      [enquiries],
    )

  /* =======================================================
     GROUP ITEMS BY PERSON
  ======================================================= */

  const itemsByPerson =
    useMemo(() => {
      if (
        !selectedDetails
      ) {
        return new Map<
          string,
          EnquiryItem[]
        >()
      }

      const map =
        new Map<
          string,
          EnquiryItem[]
        >()

      selectedDetails.items.forEach(
        (
          item,
        ) => {
          const existing =
            map.get(
              item.person_id,
            ) ?? []

          existing.push(item)

          map.set(
            item.person_id,
            existing,
          )
        },
      )

      return map
    }, [selectedDetails])

  /* =======================================================
     CUSTOMER DISPLAY
  ======================================================= */

  const primaryPerson =
    selectedDetails
      ?.people[0] ?? null

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="admin-enquiries">
      
<div className="admin-enquiries-back-row">
  <button
    type="button"
    className="admin-enquiries-back-button"
    onClick={() =>
      navigate('/admin')
    }
    aria-label="Back to Dashboard"
  >
    <span aria-hidden="true">←</span>
    <span>Back to Dashboard</span>
  </button>
</div>


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="admin-enquiries-header">
        

        <div>

          <span className="admin-enquiries-eyebrow">
            CUSTOMER MANAGEMENT
          </span>

          <h1>
            Beauty Enquiries
          </h1>

          <p>
            Review customer enquiries,
            selected services, pricing,
            customer details, and
            follow-up status.
          </p>

        </div>

        <button
          type="button"
          className="admin-enquiries-refresh"
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


      {/* ===================================================
          STATISTICS
      =================================================== */}

      <section className="admin-enquiry-statistics">

        <div className="admin-enquiry-stat">

          <span>
            TOTAL
          </span>

          <strong>
            {statistics.total}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            NEW
          </span>

          <strong>
            {statistics.new}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            CONTACTED
          </span>

          <strong>
            {statistics.contacted}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            ACCEPTED
          </span>

          <strong>
            {statistics.accepted}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            REJECTED
          </span>

          <strong>
            {statistics.rejected}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            CONVERTED
          </span>

          <strong>
            {statistics.converted}
          </strong>

        </div>

        <div className="admin-enquiry-stat">

          <span>
            CLOSED
          </span>

          <strong>
            {statistics.closed}
          </strong>

        </div>

      </section>


      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <section className="admin-enquiries-toolbar">

        <div className="admin-enquiries-search">

          <span>
            Search
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search enquiry ID, customer ID, notes..."
            aria-label="Search enquiries"
          />

        </div>


        <div className="admin-enquiries-filter">

          <label htmlFor="enquiry-status-filter">
            Status
          </label>

          <select
            id="enquiry-status-filter"
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

            {STATUS_OPTIONS.map(
              (
                status,
              ) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatStatus(
                    status,
                  )}
                </option>
              ),
            )}

          </select>

        </div>

      </section>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="admin-enquiries-error">

          <strong>
            Unable to complete request
          </strong>

          <p>
            {error}
          </p>

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


      {/* ===================================================
          ENQUIRY CARD
      =================================================== */}

      <section className="admin-enquiries-card">

        <div className="admin-enquiries-card-heading">

          <div>

            <span>
              ENQUIRY LIST
            </span>

            <h2>
              Customer Enquiries
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


        {/* ===============================================
            LOADING
        =============================================== */}

        {loading ? (
          <div className="admin-enquiries-state">

            <div className="admin-enquiries-spinner" />

            <p>
              Loading enquiries...
            </p>

          </div>

        ) : filteredEnquiries.length ===
          0 ? (

          /* =============================================
             EMPTY
          ============================================= */

          <div className="admin-enquiries-state admin-enquiries-empty">

            <div className="admin-enquiries-empty-icon">
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

          /* =============================================
             TABLE
          ============================================= */

          <>

            <div className="admin-enquiries-table-wrap">

              <table className="admin-enquiries-table">

                <thead>

                  <tr>

                    <th>
                      Enquiry
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Preferred Date
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Total
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

                      return (
                        <tr
                          key={
                            enquiry.id
                          }
                        >

                          <td>

                            <div className="admin-enquiry-table-id">

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

                            <div className="admin-enquiry-table-customer">

                              <strong>
                                Customer
                              </strong>

                              <span>
                                {enquiry.customer_id}
                              </span>

                            </div>

                          </td>


                          <td>

                            <div className="admin-enquiry-table-date">

                              <strong>
                                {formatDate(
                                  enquiry.preferred_date,
                                )}
                              </strong>

                              <span>
                                {formatTime(
                                  enquiry.preferred_time,
                                )}
                              </span>

                            </div>

                          </td>


                          <td>

                            <span>
                              {formatContactPreference(
                                enquiry.contact_preference,
                              )}
                            </span>

                          </td>


                          <td>

                            <strong className="admin-enquiry-table-total">
                              {formatCurrency(
                                enquiry.total_amount,
                              )}
                            </strong>

                          </td>


                          <td>

                            <span
                              className={`admin-enquiry-status ${getStatusClass(
                                enquiry.status,
                              )}`}
                            >

                              <i />

                              {formatStatus(
                                enquiry.status,
                              )}

                            </span>

                          </td>


                          <td>

                            <button
                              type="button"
                              className="admin-enquiry-view-button"
                              onClick={() =>
                                void openEnquiry(
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


            {/* =========================================
                PAGINATION
            ========================================== */}

            {totalPages >
              1 && (
              <div className="admin-enquiries-pagination">

                <button
                  type="button"
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
                  disabled={
                    currentPage ===
                    1
                  }
                  aria-label="Previous page"
                >
                  Previous
                </button>


                <div>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (
                      _,
                      index,
                    ) => {
                      const page =
                        index +
                        1

                      return (
                        <button
                          key={page}
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
                      )
                    },
                  )}

                </div>


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
                  aria-label="Next page"
                >
                  Next
                </button>

              </div>
            )}

          </>
        )}

      </section>


      {/* ===================================================
          DETAILS DRAWER
      =================================================== */}

      {selectedDetails && (
        <div
          className="admin-enquiry-overlay"
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
            className="admin-enquiry-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-enquiry-details-title"
          >

            {/* =============================================
                DRAWER HEADER
            ============================================== */}

            <div className="admin-enquiry-drawer-header">

              <div>

                <span>
                  ENQUIRY DETAILS
                </span>

                <h2 id="admin-enquiry-details-title">
                  #
                  {getShortId(
                    selectedDetails
                      .enquiry.id,
                  )}
                </h2>

              </div>

              <button
                type="button"
                className="admin-enquiry-close"
                onClick={
                  closeDetails
                }
                disabled={saving}
                aria-label="Close enquiry details"
              >
                ×
              </button>

            </div>


            {detailsLoading ? (

              <div className="admin-enquiries-state">

                <div className="admin-enquiries-spinner" />

                <p>
                  Loading enquiry
                  details...
                </p>

              </div>

            ) : (

              <div className="admin-enquiry-drawer-body">

                {/* =========================================
                    STATUS
                ========================================== */}

                <section className="admin-enquiry-detail-section">

                  <div className="admin-enquiry-section-title">

                    <span>
                      CURRENT STATUS
                    </span>

                    <h3>
                      Enquiry Progress
                    </h3>

                  </div>

                  <div className="admin-enquiry-status-large">

                    <span
                      className={`admin-enquiry-status ${getStatusClass(
                        selectedDetails
                          .enquiry
                          .status,
                      )}`}
                    >

                      <i />

                      {formatStatus(
                        selectedDetails
                          .enquiry
                          .status,
                      )}

                    </span>

                  </div>

                </section>


                {/* =========================================
                    CUSTOMER
                ========================================== */}

                <section className="admin-enquiry-detail-section">

                  <div className="admin-enquiry-section-title">

                    <span>
                      CUSTOMER
                    </span>

                    <h3>
                      Customer Information
                    </h3>

                  </div>


                  <div className="admin-enquiry-info-grid">

                    <div>

                      <span>
                        Name
                      </span>

                      <strong>
                        {primaryPerson?.name ??
                          '—'}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Phone
                      </span>

                      <strong>
                        {primaryPerson?.phone ??
                          '—'}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Email
                      </span>

                      <strong>
                        {primaryPerson?.email ??
                          '—'}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Customer ID
                      </span>

                      <strong>
                        {
                          selectedDetails
                            .enquiry
                            .customer_id
                        }
                      </strong>

                    </div>

                  </div>

                </section>


                {/* =========================================
                    PREFERENCES
                ========================================== */}

                <section className="admin-enquiry-detail-section">

                  <div className="admin-enquiry-section-title">

                    <span>
                      PREFERENCES
                    </span>

                    <h3>
                      Enquiry Details
                    </h3>

                  </div>


                  <div className="admin-enquiry-info-grid">

                    <div>

                      <span>
                        Preferred Date
                      </span>

                      <strong>
                        {formatDate(
                          selectedDetails
                            .enquiry
                            .preferred_date,
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Preferred Time
                      </span>

                      <strong>
                        {formatTime(
                          selectedDetails
                            .enquiry
                            .preferred_time,
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Contact Preference
                      </span>

                      <strong>
                        {formatContactPreference(
                          selectedDetails
                            .enquiry
                            .contact_preference,
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Submitted
                      </span>

                      <strong>
                        {formatDateTime(
                          selectedDetails
                            .enquiry
                            .created_at,
                        )}
                      </strong>

                    </div>

                  </div>

                </section>


                {/* =========================================
                    PEOPLE & SERVICES
                ========================================== */}

                <section className="admin-enquiry-detail-section">

                  <div className="admin-enquiry-section-title">

                    <span>
                      REQUEST
                    </span>

                    <h3>
                      People & Selected Services
                    </h3>

                  </div>


                  <div className="admin-enquiry-people-list">

                    {selectedDetails
                      .people
                      .length ===
                    0 ? (

                      <div className="admin-enquiry-no-services">
                        No people details found.
                      </div>

                    ) : (

                      selectedDetails.people.map(
                        (
                          person,
                          personIndex,
                        ) => {

                          const personItems =
                            itemsByPerson.get(
                              person.id,
                            ) ?? []

                          const personTotal =
                            personItems.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                Number(
                                  item.price ||
                                    0,
                                ),
                              0,
                            )

                          return (
                            <article
                              key={
                                person.id
                              }
                              className="admin-enquiry-person-card"
                            >

                              <div className="admin-enquiry-person-header">

                                <div className="admin-enquiry-person-number">
                                  {String(
                                    personIndex +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </div>


                                <div className="admin-enquiry-person-details">

                                  <span>
                                    PERSON
                                  </span>

                                  <h4>
                                    {
                                      person.name
                                    }
                                  </h4>

                                  <div className="admin-enquiry-person-contact">

                                    {person.phone && (
                                      <p>
                                        {
                                          person.phone
                                        }
                                      </p>
                                    )}

                                    {person.email && (
                                      <p>
                                        {
                                          person.email
                                        }
                                      </p>
                                    )}

                                  </div>

                                </div>


                                <strong className="admin-enquiry-person-total">
                                  {formatCurrency(
                                    personTotal,
                                  )}
                                </strong>

                              </div>


                              <div className="admin-enquiry-person-services">

                                {personItems.length ===
                                0 ? (

                                  <div className="admin-enquiry-no-services">
                                    No services found.
                                  </div>

                                ) : (

                                  <div className="admin-enquiry-service-grid">

                                    {personItems.map(
                                      (
                                        item,
                                      ) => {

                                        const image =
                                          selectedDetails
                                            .serviceImages[
                                            item
                                              .service_id
                                          ]

                                        return (
                                          <article
                                            key={
                                              item.id
                                            }
                                            className="admin-enquiry-service-card"
                                          >

                                            <div className="admin-enquiry-service-image">

                                              {image ? (

                                                <img
                                                  src={
                                                    image
                                                  }
                                                  alt={
                                                    item.service_name
                                                  }
                                                  decoding="async"
                                                />

                                              ) : (

                                                <div className="admin-enquiry-service-placeholder">
                                                  {item.service_name
                                                    .charAt(
                                                      0,
                                                    )
                                                    .toUpperCase()}
                                                </div>

                                              )}

                                            </div>


                                            <div className="admin-enquiry-service-content">

                                              <div className="admin-enquiry-service-title-row">

                                                <h5>
                                                  {
                                                    item.service_name
                                                  }
                                                </h5>

                                                {item.discount_label && (
                                                  <span className="admin-enquiry-service-discount-label">
                                                    {
                                                      item.discount_label
                                                    }
                                                  </span>
                                                )}

                                              </div>


                                              <div className="admin-enquiry-service-duration">

                                                <span>
                                                  {
                                                    item.duration_minutes
                                                  }{' '}
                                                  min
                                                </span>

                                              </div>


                                              <div className="admin-enquiry-service-pricing">

                                                <div>

                                                  <span>
                                                    Original
                                                  </span>

                                                  <strong className="admin-enquiry-original-price">
                                                    {formatCurrency(
                                                      item.original_price,
                                                    )}
                                                  </strong>

                                                </div>


                                                {Number(
                                                  item.discount_amount,
                                                ) >
                                                  0 && (
                                                  <div>

                                                    <span>
                                                      Discount
                                                    </span>

                                                    <strong className="admin-enquiry-discount-price">
                                                      −
                                                      {formatCurrency(
                                                        item.discount_amount,
                                                      )}
                                                    </strong>

                                                  </div>
                                                )}


                                                <div className="admin-enquiry-final-price-row">

                                                  <span>
                                                    Price
                                                  </span>

                                                  <strong>
                                                    {formatCurrency(
                                                      item.price,
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
                                )}

                              </div>

                            </article>
                          )
                        },
                      )
                    )}

                  </div>

                </section>


                {/* =========================================
                    BILLING
                ========================================== */}

                <section className="admin-enquiry-detail-section">

                  <div className="admin-enquiry-section-title">

                    <span>
                      BILLING
                    </span>

                    <h3>
                      Pricing Summary
                    </h3>

                  </div>


                  <div className="admin-enquiry-pricing">

                    <div>

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          selectedDetails
                            .enquiry
                            .subtotal,
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Discount
                      </span>

                      <strong className="admin-enquiry-pricing-discount">
                        −
                        {formatCurrency(
                          selectedDetails
                            .enquiry
                            .discount_amount,
                        )}
                      </strong>

                    </div>


                    <div className="admin-enquiry-pricing-total">

                      <span>
                        Total
                      </span>

                      <strong>
                        {formatCurrency(
                          selectedDetails
                            .enquiry
                            .total_amount,
                        )}
                      </strong>

                    </div>

                  </div>

                </section>


                {/* =========================================
                    CUSTOMER MESSAGE
                ========================================== */}

                {selectedDetails
                  .enquiry
                  .notes && (

                  <section className="admin-enquiry-detail-section">

                    <div className="admin-enquiry-section-title">

                      <span>
                        CUSTOMER MESSAGE
                      </span>

                      <h3>
                        Customer Notes
                      </h3>

                    </div>

                    <div className="admin-enquiry-note">
                      {
                        selectedDetails
                          .enquiry
                          .notes
                      }
                    </div>

                  </section>
                )}


                {/* =========================================
                    ADMIN MANAGEMENT
                ========================================== */}

                <section className="admin-enquiry-detail-section admin-enquiry-management">

                  <div className="admin-enquiry-section-title">

                    <span>
                      ADMIN
                    </span>

                    <h3>
                      Manage Enquiry
                    </h3>

                  </div>


                  <div className="admin-enquiry-field">

                    <label htmlFor="admin-enquiry-status">
                      Status
                    </label>

                    <select
                      id="admin-enquiry-status"
                      value={
                        editStatus
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditStatus(
                          event.target
                            .value as EnquiryStatus,
                        )
                      }
                      disabled={
                        saving
                      }
                    >

                      {STATUS_OPTIONS.map(
                        (
                          status,
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {formatStatus(
                              status,
                            )}
                          </option>
                        ),
                      )}

                    </select>

                  </div>


                  <div className="admin-enquiry-field">

                    <label htmlFor="admin-enquiry-notes">
                      Admin Notes
                    </label>

                    <textarea
                      id="admin-enquiry-notes"
                      value={
                        adminNotes
                      }
                      onChange={(
                        event,
                      ) =>
                        setAdminNotes(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Add internal notes about this enquiry..."
                      rows={5}
                      disabled={
                        saving
                      }
                    />

                  </div>


                  <button
                    type="button"
                    className="admin-enquiry-save-button"
                    onClick={() =>
                      void updateEnquiry()
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                </section>

              </div>
            )}

          </aside>

        </div>
      )}

    </main>
  )
}

export default AdminbeautyEnquiries