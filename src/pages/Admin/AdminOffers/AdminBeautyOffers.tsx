import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { FormEvent } from 'react'

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './AdminBeautyOffers.css'

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string
  name: string
  is_active: boolean
}

type Service = {
  id: string
  name: string
  category_id: string | null
  is_active: boolean
}

type OfferTarget =
  | 'general'
  | 'category'
  | 'service'

type OfferStatus =
  | 'active'
  | 'scheduled'
  | 'expired'
  | 'inactive'

type Offer = {
  id: string
  title: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  promo_code: string | null
  starts_at: string
  ends_at: string | null
  is_active: boolean
  priority: number

  /*
   * IMPORTANT:
   * React uses "general".
   * Database uses "all".
   */
  scope_type: OfferTarget

  service_group: 'beauty' | 'fashion'
  applies_to_all: boolean
  created_at: string

  serviceIds: string[]
  categoryIds: string[]
}

type OfferForm = {
  title: string
  description: string

  target: OfferTarget

  categoryIds: string[]
  serviceIds: string[]

  discountType:
    | 'percentage'
    | 'fixed'

  discountValue: string

  promoCode: string

  startsAt: string
  endsAt: string

  priority: string

  isActive: boolean
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 6

const CATEGORY_PAGE_SIZE = 10

const SERVICE_PAGE_SIZE = 10

const EMPTY_FORM = (): OfferForm => ({
  title: '',
  description: '',

  target: 'general',

  categoryIds: [],
  serviceIds: [],

  discountType: 'percentage',

  discountValue: '',

  promoCode: '',

  startsAt: getLocalDateTime(),

  endsAt: '',

  priority: '0',

  isActive: true,
})

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDateTime() {
  const date = new Date()

  date.setMinutes(
    date.getMinutes() -
      date.getTimezoneOffset(),
  )

  return date
    .toISOString()
    .slice(0, 16)
}

function convertToLocalDateTime(
  value: string | null,
) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

  date.setMinutes(
    date.getMinutes() -
      date.getTimezoneOffset(),
  )

  return date
    .toISOString()
    .slice(0, 16)
}

/* =========================================================
   DATABASE → UI TARGET
========================================================= */

function databaseScopeToUiTarget(
  scopeType: string | null,
  appliesToAll: boolean,
): OfferTarget {
  if (
    scopeType === 'all' ||
    appliesToAll
  ) {
    return 'general'
  }

  if (
    scopeType === 'category'
  ) {
    return 'category'
  }

  return 'service'
}

/* =========================================================
   UI → DATABASE TARGET
========================================================= */

function uiTargetToDatabaseScope(
  target: OfferTarget,
) {
  if (target === 'general') {
    return 'all'
  }

  return target
}

/* =========================================================
   OFFER HELPERS
========================================================= */

function getOfferStatus(
  offer: Offer,
): OfferStatus {
  if (!offer.is_active) {
    return 'inactive'
  }

  const now = new Date()

  const startsAt =
    new Date(
      offer.starts_at,
    )

  const endsAt =
    offer.ends_at
      ? new Date(
          offer.ends_at,
        )
      : null

  if (
    startsAt > now
  ) {
    return 'scheduled'
  }

  if (
    endsAt &&
    endsAt <= now
  ) {
    return 'expired'
  }

  return 'active'
}

function formatDiscount(
  offer: Offer,
) {
  if (
    offer.discount_type ===
    'percentage'
  ) {
    return `${Number(
      offer.discount_value,
    )}% OFF`
  }

  return `₹${Number(
    offer.discount_value,
  ).toLocaleString(
    'en-IN',
  )} OFF`
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'No end date'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'No end date'
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

/* =========================================================
   ICONS
========================================================= */

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminBeautyOffers() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const { id } =
    useParams()

  const isCreate =
    location.pathname.endsWith(
      '/offers/new',
    )

  const isEdit =
    Boolean(id) &&
    location.pathname.includes(
      '/offers/',
    )

  const isFormPage =
    isCreate || isEdit

  /* =======================================================
     STATE
  ======================================================= */

  const [
    offers,
    setOffers,
  ] = useState<Offer[]>([])

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([])

  const [
    services,
    setServices,
  ] = useState<Service[]>([])

  const [
    form,
    setForm,
  ] = useState<OfferForm>(
    EMPTY_FORM(),
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

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
    targetFilter,
    setTargetFilter,
  ] = useState<
    'all' | OfferTarget
  >('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'all' | OfferStatus
  >('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    categoryPage,
    setCategoryPage,
  ] = useState(1)

  const [
    servicePage,
    setServicePage,
  ] = useState(1)

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (
      isEdit &&
      id
    ) {
      void loadOffer(id)
    }

    if (isCreate) {
      setForm(
        EMPTY_FORM(),
      )

      setError('')

      setCategoryPage(1)
      setServicePage(1)
    }
  }, [
    isCreate,
    isEdit,
    id,
  ])

  /* =======================================================
     LOAD LIST DATA
  ======================================================= */

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [
        offersResponse,
        categoriesResponse,
        servicesResponse,
        serviceLinksResponse,
        categoryLinksResponse,
      ] = await Promise.all([
        supabase
          .from('offers')
          .select(
            `
              id,
              title,
              description,
              discount_type,
              discount_value,
              promo_code,
              starts_at,
              ends_at,
              is_active,
              priority,
              scope_type,
              service_group,
              applies_to_all,
              service_id,
              category_id,
              created_at
            `,
          )
          .eq(
            'service_group',
            'beauty',
          )
          .order(
            'priority',
            {
              ascending: false,
            },
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          ),

        supabase
          .from(
            'service_categories',
          )
          .select(
            `
              id,
              name,
              is_active
            `,
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
          ),

        supabase
          .from('services')
          .select(
            `
              id,
              name,
              category_id,
              is_active
            `,
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
          ),

        supabase
          .from(
            'offer_services',
          )
          .select(
            `
              offer_id,
              service_id
            `,
          ),

        supabase
          .from(
            'offer_categories',
          )
          .select(
            `
              offer_id,
              category_id
            `,
          ),
      ])

      if (
        offersResponse.error
      ) {
        throw new Error(
          offersResponse.error.message,
        )
      }

      if (
        categoriesResponse.error
      ) {
        throw new Error(
          categoriesResponse.error.message,
        )
      }

      if (
        servicesResponse.error
      ) {
        throw new Error(
          servicesResponse.error.message,
        )
      }

      if (
        serviceLinksResponse.error
      ) {
        throw new Error(
          serviceLinksResponse.error.message,
        )
      }

      if (
        categoryLinksResponse.error
      ) {
        throw new Error(
          categoryLinksResponse.error.message,
        )
      }

      const serviceLinks =
        serviceLinksResponse.data ??
        []

      const categoryLinks =
        categoryLinksResponse.data ??
        []

      const rows =
        offersResponse.data ?? []

      const mappedOffers =
        rows.map(
          (row) => {
            const mappedServiceIds =
              serviceLinks
                .filter(
                  (link) =>
                    link.offer_id ===
                    row.id,
                )
                .map(
                  (link) =>
                    link.service_id,
                )

            const mappedCategoryIds =
              categoryLinks
                .filter(
                  (link) =>
                    link.offer_id ===
                    row.id,
                )
                .map(
                  (link) =>
                    link.category_id,
                )

            /*
             * Support old offers that still
             * have service_id/category_id
             * directly on offers.
             */
            const serviceIds =
              [...mappedServiceIds]

            const categoryIds =
              [...mappedCategoryIds]

            if (
              row.service_id &&
              !serviceIds.includes(
                row.service_id,
              )
            ) {
              serviceIds.push(
                row.service_id,
              )
            }

            if (
              row.category_id &&
              !categoryIds.includes(
                row.category_id,
              )
            ) {
              categoryIds.push(
                row.category_id,
              )
            }

            return {
              id: row.id,

              title:
                row.title,

              description:
                row.description ??
                '',

              discount_type:
                row.discount_type,

              discount_value:
                Number(
                  row.discount_value,
                ),

              promo_code:
                row.promo_code,

              starts_at:
                row.starts_at,

              ends_at:
                row.ends_at,

              is_active:
                row.is_active,

              priority:
                Number(
                  row.priority ?? 0,
                ),

              scope_type:
                databaseScopeToUiTarget(
                  row.scope_type,
                  row.applies_to_all,
                ),

              service_group:
                row.service_group,

              applies_to_all:
                row.applies_to_all,

              created_at:
                row.created_at,

              serviceIds,

              categoryIds,
            } as Offer
          },
        )

      setOffers(
        mappedOffers,
      )

      setCategories(
        (categoriesResponse.data ??
          []) as Category[],
      )

      setServices(
        (servicesResponse.data ??
          []) as Service[],
      )
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load beauty offers.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     LOAD SINGLE OFFER FOR EDIT
  ======================================================= */

  async function loadOffer(
    offerId: string,
  ) {
    setLoading(true)
    setError('')

    try {
      const [
        offerResponse,
        serviceLinksResponse,
        categoryLinksResponse,
      ] = await Promise.all([
        supabase
          .from('offers')
          .select(
            `
              id,
              title,
              description,
              discount_type,
              discount_value,
              promo_code,
              starts_at,
              ends_at,
              is_active,
              priority,
              scope_type,
              service_group,
              applies_to_all,
              service_id,
              category_id
            `,
          )
          .eq(
            'id',
            offerId,
          )
          .eq(
            'service_group',
            'beauty',
          )
          .maybeSingle(),

        supabase
          .from(
            'offer_services',
          )
          .select(
            `
              service_id
            `,
          )
          .eq(
            'offer_id',
            offerId,
          ),

        supabase
          .from(
            'offer_categories',
          )
          .select(
            `
              category_id
            `,
          )
          .eq(
            'offer_id',
            offerId,
          ),
      ])

      if (
        offerResponse.error
      ) {
        throw new Error(
          offerResponse.error.message,
        )
      }

      if (
        serviceLinksResponse.error
      ) {
        throw new Error(
          serviceLinksResponse.error.message,
        )
      }

      if (
        categoryLinksResponse.error
      ) {
        throw new Error(
          categoryLinksResponse.error.message,
        )
      }

      if (
        !offerResponse.data
      ) {
        throw new Error(
          'Beauty offer not found.',
        )
      }

      const offer =
        offerResponse.data

      /*
       * Get mapping-table selections.
       */
      const serviceIds =
        (
          serviceLinksResponse.data ??
          []
        ).map(
          (item) =>
            item.service_id,
        )

      const categoryIds =
        (
          categoryLinksResponse.data ??
          []
        ).map(
          (item) =>
            item.category_id,
        )

      /*
       * Backward compatibility.
       *
       * If an old offer uses the legacy
       * service_id/category_id columns,
       * include those IDs too.
       */
      if (
        offer.service_id &&
        !serviceIds.includes(
          offer.service_id,
        )
      ) {
        serviceIds.push(
          offer.service_id,
        )
      }

      if (
        offer.category_id &&
        !categoryIds.includes(
          offer.category_id,
        )
      ) {
        categoryIds.push(
          offer.category_id,
        )
      }

      /*
       * IMPORTANT:
       * Database "all" becomes
       * React "general".
       */
      const target =
        databaseScopeToUiTarget(
          offer.scope_type,
          offer.applies_to_all,
        )

      setForm({
        title:
          offer.title,

        description:
          offer.description ??
          '',

        target,

        categoryIds,

        serviceIds,

        discountType:
          offer.discount_type,

        discountValue:
          String(
            offer.discount_value,
          ),

        promoCode:
          offer.promo_code ??
          '',

        startsAt:
          convertToLocalDateTime(
            offer.starts_at,
          ),

        endsAt:
          convertToLocalDateTime(
            offer.ends_at,
          ),

        priority:
          String(
            offer.priority ?? 0,
          ),

        isActive:
          offer.is_active,
      })

      /*
       * Reset selection pagination so
       * the form always opens from page 1.
       */
      setCategoryPage(1)
      setServicePage(1)
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load offer.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  function updateForm(
    field: keyof OfferForm,
    value:
      | string
      | boolean
      | string[],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )

    setError('')
  }

  /* =======================================================
     TARGET
  ======================================================= */

  function selectTarget(
    target: OfferTarget,
  ) {
    setForm(
      (current) => ({
        ...current,

        target,

        categoryIds: [],

        serviceIds: [],
      }),
    )

    setCategoryPage(1)

    setServicePage(1)

    setError('')
  }

  /* =======================================================
     CATEGORY SELECTION
  ======================================================= */

  function toggleCategory(
    categoryId: string,
  ) {
    setForm(
      (current) => {
        const exists =
          current.categoryIds.includes(
            categoryId,
          )

        return {
          ...current,

          categoryIds:
            exists
              ? current.categoryIds.filter(
                  (existingId) =>
                    existingId !==
                    categoryId,
                )
              : [
                  ...current.categoryIds,
                  categoryId,
                ],
        }
      },
    )

    setError('')
  }

  function selectAllCategories() {
    setForm(
      (current) => {
        const allIds =
          categories.map(
            (category) =>
              category.id,
          )

        const allSelected =
          allIds.every(
            (categoryId) =>
              current.categoryIds.includes(
                categoryId,
              ),
          )

        return {
          ...current,

          categoryIds:
            allSelected
              ? []
              : allIds,
        }
      },
    )

    setError('')
  }

  /* =======================================================
     SERVICE SELECTION
  ======================================================= */

  function toggleService(
    serviceId: string,
  ) {
    setForm(
      (current) => {
        const exists =
          current.serviceIds.includes(
            serviceId,
          )

        return {
          ...current,

          serviceIds:
            exists
              ? current.serviceIds.filter(
                  (existingId) =>
                    existingId !==
                    serviceId,
                )
              : [
                  ...current.serviceIds,
                  serviceId,
                ],
        }
      },
    )

    setError('')
  }

  function selectAllServices() {
    setForm(
      (current) => {
        const allIds =
          services.map(
            (service) =>
              service.id,
          )

        const allSelected =
          allIds.every(
            (serviceId) =>
              current.serviceIds.includes(
                serviceId,
              ),
          )

        return {
          ...current,

          serviceIds:
            allSelected
              ? []
              : allIds,
        }
      },
    )

    setError('')
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm() {
    if (
      !form.title.trim()
    ) {
      setError(
        'Offer title is required.',
      )

      return false
    }

    if (
      !form.description.trim()
    ) {
      setError(
        'Offer description is required.',
      )

      return false
    }

    const discount =
      Number(
        form.discountValue,
      )

    if (
      !Number.isFinite(
        discount,
      ) ||
      discount <= 0
    ) {
      setError(
        'Enter a valid discount value.',
      )

      return false
    }

    if (
      form.discountType ===
        'percentage' &&
      discount > 100
    ) {
      setError(
        'Percentage discount cannot exceed 100%.',
      )

      return false
    }

    const priority =
      Number(
        form.priority,
      )

    if (
      !Number.isInteger(
        priority,
      ) ||
      priority < 0
    ) {
      setError(
        'Priority must be a whole number greater than or equal to 0.',
      )

      return false
    }

    if (
      !form.startsAt
    ) {
      setError(
        'Offer start date and time are required.',
      )

      return false
    }

    if (
      form.endsAt
    ) {
      const startsAt =
        new Date(
          form.startsAt,
        ).getTime()

      const endsAt =
        new Date(
          form.endsAt,
        ).getTime()

      if (
        Number.isNaN(
          startsAt,
        ) ||
        Number.isNaN(
          endsAt,
        ) ||
        endsAt <= startsAt
      ) {
        setError(
          'Offer end date must be later than the start date.',
        )

        return false
      }
    }

    if (
      form.target ===
        'category' &&
      form.categoryIds.length ===
        0
    ) {
      setError(
        'Select at least one beauty category.',
      )

      return false
    }

    if (
      form.target ===
        'service' &&
      form.serviceIds.length ===
        0
    ) {
      setError(
        'Select at least one beauty service.',
      )

      return false
    }

    return true
  }

  /* =======================================================
     SAVE MAPPINGS
  ======================================================= */

  async function saveMappings(
    offerId: string,
  ) {
    /*
     * GENERAL
     *
     * No mapping rows required.
     */
    if (
      form.target ===
      'general'
    ) {
      return
    }

    /*
     * CATEGORY
     */
    if (
      form.target ===
      'category'
    ) {
      if (
        form.categoryIds.length ===
        0
      ) {
        throw new Error(
          'No categories were selected.',
        )
      }

      const rows =
        form.categoryIds.map(
          (categoryId) => ({
            offer_id:
              offerId,

            category_id:
              categoryId,
          }),
        )

      const {
        error:
          categoryError,
      } =
        await supabase
          .from(
            'offer_categories',
          )
          .insert(rows)

      if (
        categoryError
      ) {
        throw new Error(
          categoryError.message,
        )
      }

      return
    }

    /*
     * SERVICE
     */
    if (
      form.target ===
      'service'
    ) {
      if (
        form.serviceIds.length ===
        0
      ) {
        throw new Error(
          'No services were selected.',
        )
      }

      const rows =
        form.serviceIds.map(
          (serviceId) => ({
            offer_id:
              offerId,

            service_id:
              serviceId,
          }),
        )

      const {
        error:
          serviceError,
      } =
        await supabase
          .from(
            'offer_services',
          )
          .insert(rows)

      if (
        serviceError
      ) {
        throw new Error(
          serviceError.message,
        )
      }
    }
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (
      !validateForm()
    ) {
      return
    }

    setSaving(true)

    try {
      const discount =
        Number(
          form.discountValue,
        )

      const priority =
        Number(
          form.priority,
        )

      const startsAt =
        new Date(
          form.startsAt,
        )

      const endsAt =
        form.endsAt
          ? new Date(
              form.endsAt,
            )
          : null

      if (
        Number.isNaN(
          startsAt.getTime(),
        )
      ) {
        throw new Error(
          'Invalid offer start date.',
        )
      }

      if (
        endsAt &&
        Number.isNaN(
          endsAt.getTime(),
        )
      ) {
        throw new Error(
          'Invalid offer end date.',
        )
      }

      /*
       * IMPORTANT:
       * React:
       * general
       *
       * Database:
       * all
       */
      const databaseScope =
        uiTargetToDatabaseScope(
          form.target,
        )

      const offerData = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        discount_type:
          form.discountType,

        discount_value:
          discount,

        promo_code:
          form.promoCode.trim() ||
          null,

        starts_at:
          startsAt.toISOString(),

        ends_at:
          endsAt
            ? endsAt.toISOString()
            : null,

        is_active:
          form.isActive,

        applies_to_all:
          form.target ===
          'general',

        priority,

        scope_type:
          databaseScope,

        service_group:
          'beauty' as const,

        /*
         * New system uses junction
         * tables for targeting.
         */
        service_id:
          null,

        category_id:
          null,
      }

      let offerId =
        id ?? ''

      /* ===================================================
         UPDATE EXISTING OFFER
      =================================================== */

      if (
        isEdit &&
        id
      ) {
        const {
          data:
            updatedOffer,
          error:
            updateError,
        } =
          await supabase
            .from('offers')
            .update(
              offerData,
            )
            .eq(
              'id',
              id,
            )
            .eq(
              'service_group',
              'beauty',
            )
            .select(
              'id',
            )
            .maybeSingle()

        if (
          updateError
        ) {
          throw new Error(
            updateError.message,
          )
        }

        if (
          !updatedOffer
        ) {
          throw new Error(
            'Beauty offer could not be updated. Check your Supabase permissions.',
          )
        }

        offerId =
          updatedOffer.id

        /*
         * Remove old mappings.
         *
         * This is required because the
         * administrator may have changed:
         *
         * Service A + Service B
         *
         * to:
         *
         * Service C
         */
        const [
          deleteServices,
          deleteCategories,
        ] = await Promise.all([
          supabase
            .from(
              'offer_services',
            )
            .delete()
            .eq(
              'offer_id',
              offerId,
            ),

          supabase
            .from(
              'offer_categories',
            )
            .delete()
            .eq(
              'offer_id',
              offerId,
            ),
        ])

        if (
          deleteServices.error
        ) {
          throw new Error(
            deleteServices.error.message,
          )
        }

        if (
          deleteCategories.error
        ) {
          throw new Error(
            deleteCategories.error.message,
          )
        }

        /*
         * Remove legacy direct targeting
         * from old offers as well.
         */
        const {
          error:
            clearLegacyError,
        } =
          await supabase
            .from('offers')
            .update({
              service_id:
                null,

              category_id:
                null,
            })
            .eq(
              'id',
              offerId,
            )
            .eq(
              'service_group',
              'beauty',
            )

        if (
          clearLegacyError
        ) {
          throw new Error(
            clearLegacyError.message,
          )
        }

        /*
         * Insert current mappings.
         */
        await saveMappings(
          offerId,
        )
      }

      /* ===================================================
         CREATE NEW OFFER
      =================================================== */

      else {
        const {
          data:
            createdOffer,
          error:
            insertError,
        } =
          await supabase
            .from('offers')
            .insert(
              offerData,
            )
            .select(
              'id',
            )
            .single()

        if (
          insertError ||
          !createdOffer
        ) {
          throw new Error(
            insertError?.message ??
              'Unable to create offer.',
          )
        }

        offerId =
          createdOffer.id

        try {
          await saveMappings(
            offerId,
          )
        } catch (
          mappingError
        ) {
          /*
           * Roll back the newly created
           * offer if mapping insertion fails.
           */
          await supabase
            .from('offers')
            .delete()
            .eq(
              'id',
              offerId,
            )

          throw mappingError
        }
      }

      /*
       * Go back to offer list.
       */
      navigate(
        '/admin/services/offers',
        {
          replace: true,
        },
      )

      /*
       * Refresh list.
       */
      await loadData()
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save beauty offer.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =======================================================
     TOGGLE ACTIVE
  ======================================================= */

  async function toggleOffer(
    offer: Offer,
  ) {
    setError('')

    const {
      data:
        updatedOffer,
      error:
        updateError,
    } =
      await supabase
        .from('offers')
        .update({
          is_active:
            !offer.is_active,
        })
        .eq(
          'id',
          offer.id,
        )
        .eq(
          'service_group',
          'beauty',
        )
        .select(
          'id',
        )
        .maybeSingle()

    if (
      updateError
    ) {
      setError(
        updateError.message,
      )

      return
    }

    if (
      !updatedOffer
    ) {
      setError(
        'Offer could not be updated. Check your Supabase permissions.',
      )

      return
    }

    await loadData()
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteOffer(
    offer: Offer,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${offer.title}" permanently?`,
      )

    if (!confirmed) {
      return
    }

    setError('')

    try {
      /*
       * Explicitly remove mapping rows first.
       *
       * Your database also has ON DELETE CASCADE,
       * but doing this explicitly gives the admin
       * UI a deterministic delete operation.
       */
      const [
        deleteServices,
        deleteCategories,
      ] = await Promise.all([
        supabase
          .from(
            'offer_services',
          )
          .delete()
          .eq(
            'offer_id',
            offer.id,
          ),

        supabase
          .from(
            'offer_categories',
          )
          .delete()
          .eq(
            'offer_id',
            offer.id,
          ),
      ])

      if (
        deleteServices.error
      ) {
        throw new Error(
          deleteServices.error.message,
        )
      }

      if (
        deleteCategories.error
      ) {
        throw new Error(
          deleteCategories.error.message,
        )
      }

      /*
       * Delete the actual offer.
       */
      const {
        data:
          deletedOffer,
        error:
          deleteError,
      } =
        await supabase
          .from('offers')
          .delete()
          .eq(
            'id',
            offer.id,
          )
          .eq(
            'service_group',
            'beauty',
          )
          .select(
            'id',
          )
          .maybeSingle()

      if (
        deleteError
      ) {
        throw new Error(
          deleteError.message,
        )
      }

      /*
       * If Supabase returned no deleted row,
       * the operation was not actually applied.
       */
      if (
        !deletedOffer
      ) {
        throw new Error(
          'Offer was not deleted. Check your Supabase DELETE policy for the offers table.',
        )
      }

      /*
       * Remove it immediately from local state.
       */
      setOffers(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              offer.id,
          ),
      )

      /*
       * Make sure pagination remains valid.
       */
      setCurrentPage(
        (page) =>
          Math.max(
            1,
            page,
          ),
      )
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete offer.',
      )
    }
  }

  /* =======================================================
     FILTERED OFFERS
  ======================================================= */

  const filteredOffers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return offers.filter(
        (offer) => {
          const status =
            getOfferStatus(
              offer,
            )

          const matchesSearch =
            !query ||
            offer.title
              .toLowerCase()
              .includes(
                query,
              ) ||
            offer.description
              .toLowerCase()
              .includes(
                query,
              ) ||
            (
              offer.promo_code ??
              ''
            )
              .toLowerCase()
              .includes(
                query,
              )

          const matchesTarget =
            targetFilter ===
              'all' ||
            offer.scope_type ===
              targetFilter

          const matchesStatus =
            statusFilter ===
              'all' ||
            status ===
              statusFilter

          return (
            matchesSearch &&
            matchesTarget &&
            matchesStatus
          )
        },
      )
    }, [
      offers,
      search,
      targetFilter,
      statusFilter,
    ])

  /* =======================================================
     OFFER PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOffers.length /
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

  const paginatedOffers =
    filteredOffers.slice(
      (currentPage - 1) *
        PAGE_SIZE,

      currentPage *
        PAGE_SIZE,
    )

  /* =======================================================
     CATEGORY PAGINATION
  ======================================================= */

  const totalCategoryPages =
    Math.max(
      1,
      Math.ceil(
        categories.length /
          CATEGORY_PAGE_SIZE,
      ),
    )

  const paginatedCategories =
    categories.slice(
      (categoryPage - 1) *
        CATEGORY_PAGE_SIZE,

      categoryPage *
        CATEGORY_PAGE_SIZE,
    )

  /* =======================================================
     SERVICE PAGINATION
  ======================================================= */

  const totalServicePages =
    Math.max(
      1,
      Math.ceil(
        services.length /
          SERVICE_PAGE_SIZE,
      ),
    )

  const paginatedServices =
    services.slice(
      (servicePage - 1) *
        SERVICE_PAGE_SIZE,

      servicePage *
        SERVICE_PAGE_SIZE,
    )

  /* =======================================================
     KEEP SELECTION PAGES VALID
  ======================================================= */

  useEffect(() => {
    if (
      categoryPage >
      totalCategoryPages
    ) {
      setCategoryPage(
        totalCategoryPages,
      )
    }
  }, [
    categoryPage,
    totalCategoryPages,
  ])

  useEffect(() => {
    if (
      servicePage >
      totalServicePages
    ) {
      setServicePage(
        totalServicePages,
      )
    }
  }, [
    servicePage,
    totalServicePages,
  ])

  /* =======================================================
     STATISTICS
  ======================================================= */

  const activeCount =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer,
        ) === 'active',
    ).length

  const scheduledCount =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer,
        ) === 'scheduled',
    ).length

  const expiredCount =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer,
        ) === 'expired',
    ).length

  /* =======================================================
     DISPLAY HELPERS
  ======================================================= */

  function getCategoryNames(
    ids: string[],
  ) {
    const names =
      ids
        .map(
          (categoryId) =>
            categories.find(
              (category) =>
                category.id ===
                categoryId,
            )?.name,
        )
        .filter(
          (
            name,
          ): name is string =>
            Boolean(name),
        )

    if (
      names.length ===
      0
    ) {
      return 'No categories'
    }

    if (
      names.length <=
      2
    ) {
      return names.join(
        ', ',
      )
    }

    return `${names
      .slice(0, 2)
      .join(', ')} +${
      names.length - 2
    } more`
  }

  function getServiceNames(
    ids: string[],
  ) {
    const names =
      ids
        .map(
          (serviceId) =>
            services.find(
              (service) =>
                service.id ===
                serviceId,
            )?.name,
        )
        .filter(
          (
            name,
          ): name is string =>
            Boolean(name),
        )

    if (
      names.length ===
      0
    ) {
      return 'No services'
    }

    if (
      names.length <=
      2
    ) {
      return names.join(
        ', ',
      )
    }

    return `${names
      .slice(0, 2)
      .join(', ')} +${
      names.length - 2
    } more`
  }

  function getAppliesTo(
    offer: Offer,
  ) {
    if (
      offer.scope_type ===
      'general'
    ) {
      return 'All Beauty Services'
    }

    if (
      offer.scope_type ===
      'category'
    ) {
      return getCategoryNames(
        offer.categoryIds,
      )
    }

    return getServiceNames(
      offer.serviceIds,
    )
  }

  /* =======================================================
     PAGINATION UI
  ======================================================= */

  function renderPagination() {
    if (
      totalPages <= 1
    ) {
      return null
    }

    const pages =
      Array.from(
        {
          length:
            totalPages,
        },
        (_, index) =>
          index + 1,
      )

    return (
      <div className="admin-beauty-offers-pagination">
        <button
          type="button"
          disabled={
            currentPage ===
            1
          }
          onClick={() =>
            setCurrentPage(
              (page) =>
                Math.max(
                  1,
                  page - 1,
                ),
            )
          }
        >
          ←
        </button>

        {pages.map(
          (page) => (
            <button
              key={page}
              type="button"
              className={
                page ===
                currentPage
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

        <button
          type="button"
          disabled={
            currentPage ===
            totalPages
          }
          onClick={() =>
            setCurrentPage(
              (page) =>
                Math.min(
                  totalPages,
                  page + 1,
                ),
            )
          }
        >
          →
        </button>
      </div>
    )
  }

  /* =======================================================
     SELECTION PAGINATION
  ======================================================= */

  function renderSelectionPagination(
    page: number,
    total: number,
    setPage: React.Dispatch<
      React.SetStateAction<number>
    >,
  ) {
    if (
      total <= 1
    ) {
      return null
    }

    return (
      <div className="admin-beauty-selection-pagination">
        <button
          type="button"
          disabled={
            page === 1
          }
          onClick={() =>
            setPage(
              (current) =>
                Math.max(
                  1,
                  current - 1,
                ),
            )
          }
        >
          ←
        </button>

        <span>
          Page {page} of {total}
        </span>

        <button
          type="button"
          disabled={
            page === total
          }
          onClick={() =>
            setPage(
              (current) =>
                Math.min(
                  total,
                  current + 1,
                ),
            )
          }
        >
          →
        </button>
      </div>
    )
  }

  /* =======================================================
     FORM PAGE
  ======================================================= */

  if (
    isFormPage
  ) {
    return (
      <main className="admin-beauty-offers-page">
        <div className="admin-beauty-offers-container">
          <div className="admin-beauty-offers-main-card">

            <div className="admin-beauty-offers-back-row">

              <Link
                to="/admin/services/offers"
              >
                ← Back to Beauty Offers
              </Link>

              <Link
                to="/admin"
              >
                ← Back to Dashboard
              </Link>

            </div>

            <header className="admin-beauty-offers-page-header">

              <div>

                <span className="admin-beauty-offers-eyebrow">
                  BEAUTY / PROMOTIONS
                </span>

                <h1>
                  {isEdit
                    ? 'Edit Beauty Offer'
                    : 'Create Beauty Offer'}
                </h1>

                <p>
                  Apply one promotion to all
                  beauty services, multiple
                  categories, or multiple
                  services.
                </p>

              </div>

            </header>

            {error && (
              <div className="admin-beauty-offers-error">
                {error}
              </div>
            )}

            {loading &&
            isEdit ? (
              <div className="admin-beauty-offers-loading">
                Loading offer...
              </div>
            ) : (
              <form
                className="admin-beauty-offers-form"
                onSubmit={
                  handleSubmit
                }
              >

                {/* =========================================
                    OFFER DETAILS
                ========================================= */}

                <section className="admin-beauty-offers-form-section">

                  <div className="admin-beauty-offers-section-heading">

                    <span>
                      01
                    </span>

                    <div>

                      <small>
                        OFFER DETAILS
                      </small>

                      <h2>
                        Promotion information
                      </h2>

                    </div>

                  </div>

                  <div className="admin-beauty-offers-form-grid">

                    <label className="admin-beauty-offers-field">

                      <span>
                        Offer Title
                        <b>*</b>
                      </span>

                      <input
                        type="text"
                        value={
                          form.title
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'title',
                            event.target
                              .value,
                          )
                        }
                        placeholder="Example: Bridal Summer Special"
                        maxLength={120}
                      />

                    </label>

                    <label className="admin-beauty-offers-field">

                      <span>
                        Promo Code
                      </span>

                      <input
                        type="text"
                        value={
                          form.promoCode
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'promoCode',
                            event.target
                              .value
                              .toUpperCase(),
                          )
                        }
                        placeholder="Example: BEAUTY20"
                        maxLength={50}
                      />

                    </label>

                    <label className="admin-beauty-offers-field full">

                      <span>
                        Description
                        <b>*</b>
                      </span>

                      <textarea
                        value={
                          form.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'description',
                            event.target
                              .value,
                          )
                        }
                        placeholder="Describe what this promotion offers."
                        rows={4}
                        maxLength={500}
                      />

                    </label>

                  </div>

                </section>

                {/* =========================================
                    TARGET
                ========================================= */}

                <section className="admin-beauty-offers-form-section">

                  <div className="admin-beauty-offers-section-heading">

                    <span>
                      02
                    </span>

                    <div>

                      <small>
                        APPLY OFFER
                      </small>

                      <h2>
                        Choose where it applies
                      </h2>

                    </div>

                  </div>

                  <div className="admin-beauty-offers-target-options">

                    <button
                      type="button"
                      className={
                        form.target ===
                        'general'
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        selectTarget(
                          'general',
                        )
                      }
                    >

                      <strong>
                        All Beauty Services
                      </strong>

                      <small>
                        Apply this offer to every
                        active beauty service.
                      </small>

                    </button>

                    <button
                      type="button"
                      className={
                        form.target ===
                        'category'
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        selectTarget(
                          'category',
                        )
                      }
                    >

                      <strong>
                        Multiple Categories
                      </strong>

                      <small>
                        Select beauty categories
                        for this offer.
                      </small>

                    </button>

                    <button
                      type="button"
                      className={
                        form.target ===
                        'service'
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        selectTarget(
                          'service',
                        )
                      }
                    >

                      <strong>
                        Multiple Services
                      </strong>

                      <small>
                        Select individual beauty
                        services for this offer.
                      </small>

                    </button>

                  </div>

                  {/* =======================================
                      CATEGORIES
                  ======================================= */}

                  {form.target ===
                    'category' && (
                    <div className="admin-beauty-offers-selection">

                      <div className="admin-beauty-offers-selection-header">

                        <div>

                          <strong>
                            Beauty Categories
                          </strong>

                          <small>
                            {
                              form.categoryIds
                                .length
                            }{' '}
                            selected
                          </small>

                        </div>

                        <button
                          type="button"
                          onClick={
                            selectAllCategories
                          }
                        >
                          {categories.length >
                            0 &&
                          categories.every(
                            (category) =>
                              form.categoryIds.includes(
                                category.id,
                              ),
                          )
                            ? 'Clear all'
                            : 'Select all'}
                        </button>

                      </div>

                      <div className="admin-beauty-offers-selection-grid">

                        {paginatedCategories.map(
                          (
                            category,
                          ) => {
                            const checked =
                              form.categoryIds.includes(
                                category.id,
                              )

                            return (
                              <label
                                key={
                                  category.id
                                }
                                className={
                                  checked
                                    ? 'selected'
                                    : ''
                                }
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleCategory(
                                      category.id,
                                    )
                                  }
                                />

                                <span className="admin-beauty-offers-checkbox">
                                  {checked
                                    ? '✓'
                                    : ''}
                                </span>

                                <span>
                                  {
                                    category.name
                                  }
                                </span>

                              </label>
                            )
                          },
                        )}

                      </div>

                      {renderSelectionPagination(
                        categoryPage,
                        totalCategoryPages,
                        setCategoryPage,
                      )}

                    </div>
                  )}

                  {/* =======================================
                      SERVICES
                  ======================================= */}

                  {form.target ===
                    'service' && (
                    <div className="admin-beauty-offers-selection">

                      <div className="admin-beauty-offers-selection-header">

                        <div>

                          <strong>
                            Beauty Services
                          </strong>

                          <small>
                            {
                              form.serviceIds
                                .length
                            }{' '}
                            selected
                          </small>

                        </div>

                        <button
                          type="button"
                          onClick={
                            selectAllServices
                          }
                        >
                          {services.length >
                            0 &&
                          services.every(
                            (service) =>
                              form.serviceIds.includes(
                                service.id,
                              ),
                          )
                            ? 'Clear all'
                            : 'Select all'}
                        </button>

                      </div>

                      <div className="admin-beauty-offers-selection-grid">

                        {paginatedServices.map(
                          (
                            service,
                          ) => {
                            const checked =
                              form.serviceIds.includes(
                                service.id,
                              )

                            return (
                              <label
                                key={
                                  service.id
                                }
                                className={
                                  checked
                                    ? 'selected'
                                    : ''
                                }
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleService(
                                      service.id,
                                    )
                                  }
                                />

                                <span className="admin-beauty-offers-checkbox">
                                  {checked
                                    ? '✓'
                                    : ''}
                                </span>

                                <span>
                                  {
                                    service.name
                                  }
                                </span>

                              </label>
                            )
                          },
                        )}

                      </div>

                      {renderSelectionPagination(
                        servicePage,
                        totalServicePages,
                        setServicePage,
                      )}

                    </div>
                  )}

                </section>

                {/* =========================================
                    DISCOUNT
                ========================================= */}

                <section className="admin-beauty-offers-form-section">

                  <div className="admin-beauty-offers-section-heading">

                    <span>
                      03
                    </span>

                    <div>

                      <small>
                        DISCOUNT
                      </small>

                      <h2>
                        Promotion value
                      </h2>

                    </div>

                  </div>

                  <div className="admin-beauty-offers-form-grid">

                    <label className="admin-beauty-offers-field">

                      <span>
                        Discount Type
                        <b>*</b>
                      </span>

                      <select
                        value={
                          form.discountType
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'discountType',
                            event.target
                              .value as
                              | 'percentage'
                              | 'fixed',
                          )
                        }
                      >

                        <option value="percentage">
                          Percentage
                        </option>

                        <option value="fixed">
                          Fixed Amount
                        </option>

                      </select>

                    </label>

                    <label className="admin-beauty-offers-field">

                      <span>
                        Discount Value
                        <b>*</b>
                      </span>

                      <div className="admin-beauty-offers-input-suffix">

                        <input
                          type="number"
                          min="0"
                          max={
                            form.discountType ===
                            'percentage'
                              ? 100
                              : undefined
                          }
                          step="0.01"
                          value={
                            form.discountValue
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'discountValue',
                              event.target
                                .value,
                            )
                          }
                          placeholder="20"
                        />

                        <span>
                          {form.discountType ===
                          'percentage'
                            ? '%'
                            : '₹'}
                        </span>

                      </div>

                    </label>

                    <label className="admin-beauty-offers-field">

                      <span>
                        Priority
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.priority
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'priority',
                            event.target
                              .value,
                          )
                        }
                      />

                      <small className="admin-beauty-offers-field-help">
                        Higher priority wins when
                        multiple offers apply.
                      </small>

                    </label>

                  </div>

                </section>

                {/* =========================================
                    SCHEDULE
                ========================================= */}

                <section className="admin-beauty-offers-form-section">

                  <div className="admin-beauty-offers-section-heading">

                    <span>
                      04
                    </span>

                    <div>

                      <small>
                        SCHEDULE
                      </small>

                      <h2>
                        Offer timing
                      </h2>

                    </div>

                  </div>

                  <div className="admin-beauty-offers-form-grid">

                    <label className="admin-beauty-offers-field">

                      <span>
                        Starts At
                        <b>*</b>
                      </span>

                      <input
                        type="datetime-local"
                        value={
                          form.startsAt
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'startsAt',
                            event.target
                              .value,
                          )
                        }
                      />

                    </label>

                    <label className="admin-beauty-offers-field">

                      <span>
                        Ends At
                      </span>

                      <input
                        type="datetime-local"
                        value={
                          form.endsAt
                        }
                        min={
                          form.startsAt
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'endsAt',
                            event.target
                              .value,
                          )
                        }
                      />

                      <small className="admin-beauty-offers-field-help">
                        Leave empty for an offer
                        with no expiry date.
                      </small>

                    </label>

                  </div>

                </section>

                {/* =========================================
                    ACTIVE
                ========================================= */}

                <section className="admin-beauty-offers-form-section last">

                  <label className="admin-beauty-offers-active-toggle">

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
                          event.target
                            .checked,
                        )
                      }
                    />

                    <span className="admin-beauty-offers-checkbox">
                      {form.isActive
                        ? '✓'
                        : ''}
                    </span>

                    <div>

                      <strong>
                        Publish offer
                      </strong>

                      <small>
                        The offer will be active according
                        to its scheduled start and end date.
                      </small>

                    </div>

                  </label>

                </section>

                {/* =========================================
                    ACTIONS
                ========================================= */}

                <footer className="admin-beauty-offers-form-actions">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        '/admin/services/offers',
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
                    className="primary"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : isEdit
                        ? 'Update Offer'
                        : 'Create Offer'}
                  </button>

                </footer>

              </form>
            )}

          </div>
        </div>
      </main>
    )
  }

  /* =======================================================
     LIST PAGE
  ======================================================= */

  return (
    <main className="admin-beauty-offers-page">

      <div className="admin-beauty-offers-container">

        <div className="admin-beauty-offers-main-card">

          <div className="admin-beauty-offers-back-row">

            <Link
              to="/admin"
            >
              ← Back to Dashboard
            </Link>

          </div>

          <header className="admin-beauty-offers-page-header">

            <div>

              <span className="admin-beauty-offers-eyebrow">
                BEAUTY / PROMOTIONS
              </span>

              <h1>
                Beauty Offers
              </h1>

              <p>
                Manage promotions exclusively
                for your beauty services.
              </p>

            </div>

            <Link
              to="/admin/services/offers/new"
              className="admin-beauty-offers-new-button"
            >
              <PlusIcon />
              New Offer
            </Link>

          </header>

          {error && (
            <div className="admin-beauty-offers-error">
              {error}
            </div>
          )}

          {/* ===============================================
              STATS
          =============================================== */}

          <section className="admin-beauty-offers-stats">

            <article>
              <span>
                TOTAL OFFERS
              </span>

              <strong>
                {offers.length}
              </strong>
            </article>

            <article>
              <span>
                ACTIVE
              </span>

              <strong>
                {activeCount}
              </strong>
            </article>

            <article>
              <span>
                SCHEDULED
              </span>

              <strong>
                {scheduledCount}
              </strong>
            </article>

            <article>
              <span>
                EXPIRED
              </span>

              <strong>
                {expiredCount}
              </strong>
            </article>

          </section>

          {/* ===============================================
              FILTERS
          =============================================== */}

          <section className="admin-beauty-offers-toolbar">

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target
                    .value,
                )

                setCurrentPage(
                  1,
                )
              }}
              placeholder="Search offers..."
            />

            <select
              value={
                targetFilter
              }
              onChange={(
                event,
              ) => {
                setTargetFilter(
                  event.target
                    .value as
                    | 'all'
                    | OfferTarget,
                )

                setCurrentPage(
                  1,
                )
              }}
            >

              <option value="all">
                All Targets
              </option>

              <option value="general">
                General
              </option>

              <option value="category">
                Categories
              </option>

              <option value="service">
                Services
              </option>

            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) => {
                setStatusFilter(
                  event.target
                    .value as
                    | 'all'
                    | OfferStatus,
                )

                setCurrentPage(
                  1,
                )
              }}
            >

              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="expired">
                Expired
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>

          </section>

          {/* ===============================================
              TABLE
          =============================================== */}

          <section className="admin-beauty-offers-table-section">

            {loading ? (
              <div className="admin-beauty-offers-loading">
                Loading beauty offers...
              </div>
            ) : paginatedOffers.length ===
              0 ? (
              <div className="admin-beauty-offers-empty">

                <strong>
                  No beauty offers found.
                </strong>

                <span>
                  Create your first beauty
                  promotion to get started.
                </span>

                <Link
                  to="/admin/services/offers/new"
                >
                  Create Offer
                </Link>

              </div>
            ) : (
              <div className="admin-beauty-offers-table-wrap">

                <table className="admin-beauty-offers-table">

                  <thead>

                    <tr>

                      <th>
                        OFFER
                      </th>

                      <th>
                        TARGET
                      </th>

                      <th>
                        APPLIES TO
                      </th>

                      <th>
                        DISCOUNT
                      </th>

                      <th>
                        PRIORITY
                      </th>

                      <th>
                        ENDS
                      </th>

                      <th>
                        STATUS
                      </th>

                      <th>
                        ACTIONS
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {paginatedOffers.map(
                      (offer) => {
                        const status =
                          getOfferStatus(
                            offer,
                          )

                        return (
                          <tr
                            key={
                              offer.id
                            }
                          >

                            <td>

                              <div className="admin-beauty-offer-name">

                                <strong>
                                  {
                                    offer.title
                                  }
                                </strong>

                                <small>
                                  {
                                    offer.description
                                  }
                                </small>

                                {offer.promo_code && (
                                  <span>
                                    {
                                      offer.promo_code
                                    }
                                  </span>
                                )}

                              </div>

                            </td>

                            <td>

                              <span
                                className={`admin-beauty-offer-target ${offer.scope_type}`}
                              >
                                {offer.scope_type ===
                                'general'
                                  ? 'General'
                                  : offer.scope_type ===
                                      'category'
                                    ? 'Categories'
                                    : 'Services'}
                              </span>

                            </td>

                            <td>

                              <div className="admin-beauty-offer-applies">

                                <strong>
                                  {
                                    getAppliesTo(
                                      offer,
                                    )
                                  }
                                </strong>

                                <small>
                                  {offer.scope_type ===
                                  'general'
                                    ? 'All beauty services'
                                    : offer.scope_type ===
                                        'category'
                                      ? `${offer.categoryIds.length} categor${
                                          offer.categoryIds.length ===
                                          1
                                            ? 'y'
                                            : 'ies'
                                        } selected`
                                      : `${offer.serviceIds.length} service${
                                          offer.serviceIds.length ===
                                          1
                                            ? ''
                                            : 's'
                                        } selected`}
                                </small>

                              </div>

                            </td>

                            <td>

                              <strong className="admin-beauty-offer-discount">
                                {
                                  formatDiscount(
                                    offer,
                                  )
                                }
                              </strong>

                            </td>

                            <td>

                              <strong className="admin-beauty-offer-priority">
                                {
                                  offer.priority
                                }
                              </strong>

                            </td>

                            <td>

                              <span className="admin-beauty-offer-date">
                                {
                                  formatDate(
                                    offer.ends_at,
                                  )
                                }
                              </span>

                            </td>

                            <td>

                              <button
                                type="button"
                                className={`admin-beauty-offer-status ${status}`}
                                onClick={() =>
                                  void toggleOffer(
                                    offer,
                                  )
                                }
                              >
                                <i />

                                {status ===
                                'active'
                                  ? 'Active'
                                  : status ===
                                      'scheduled'
                                    ? 'Scheduled'
                                    : status ===
                                        'expired'
                                      ? 'Expired'
                                      : 'Inactive'}
                              </button>

                            </td>

                            <td>

                              <div className="admin-beauty-offer-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/admin/services/offers/${offer.id}/edit`,
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete"
                                  onClick={() =>
                                    void deleteOffer(
                                      offer,
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>
                        )
                      },
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

          {/* ===============================================
              FOOTER
          =============================================== */}

          {!loading &&
            filteredOffers.length >
              0 && (
            <footer className="admin-beauty-offers-footer">

              <span>
                Showing{' '}
                <strong>
                  {(currentPage -
                    1) *
                    PAGE_SIZE +
                    1}
                  -
                  {Math.min(
                    filteredOffers.length,
                    currentPage *
                      PAGE_SIZE,
                  )}
                </strong>{' '}
                of{' '}
                <strong>
                  {
                    filteredOffers.length
                  }
                </strong>{' '}
                offers
              </span>

              {renderPagination()}

            </footer>
          )}

        </div>

      </div>

    </main>
  )
}

export default AdminBeautyOffers