import {
  useCallback,
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

import './AdminFashionOffers.css'

/* =========================================================
   TYPES
========================================================= */

type OfferTarget =
  | 'all'
  | 'category'
  | 'subcategory'
  | 'design'

type OfferStatus =
  | 'active'
  | 'scheduled'
  | 'expired'
  | 'inactive'

type SubcategoryDesignMode =
  | 'all'
  | 'specific'

type FashionCategory = {
  id: string
  name: string
  is_active: boolean
}

type FashionSubcategory = {
  id: string
  name: string
  category_id: string
  is_active: boolean
}

type FashionDesign = {
  id: string
  name: string
  slug: string
  subcategory_id: string
  is_active: boolean
}

type FashionOffer = {
  id: string
  title: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  promo_code: string | null
  starts_at: string
  ends_at: string | null
  is_active: boolean
  applies_to_all: boolean
  priority: number
  scope_type: OfferTarget
  created_at: string

  categoryIds: string[]
  subcategoryIds: string[]
  designIds: string[]
}

type OfferForm = {
  title: string
  description: string

  target: OfferTarget

  categoryIds: string[]
  subcategoryIds: string[]
  designIds: string[]

  subcategoryDesignMode:
    SubcategoryDesignMode

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

const OFFER_PAGE_SIZE = 6

const CATEGORY_PAGE_SIZE = 8

const SUBCATEGORY_PAGE_SIZE = 8

const DESIGN_PAGE_SIZE = 8

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

function toLocalDateTime(
  value: string | null,
) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
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
   EMPTY FORM
========================================================= */

function createEmptyForm(): OfferForm {
  return {
    title: '',
    description: '',

    target: 'all',

    categoryIds: [],
    subcategoryIds: [],
    designIds: [],

    subcategoryDesignMode: 'all',

    discountType: 'percentage',
    discountValue: '',

    promoCode: '',

    startsAt: getLocalDateTime(),
    endsAt: '',

    priority: '0',

    isActive: true,
  }
}

/* =========================================================
   STATUS
========================================================= */

function getOfferStatus(
  offer: FashionOffer,
): OfferStatus {
  if (!offer.is_active) {
    return 'inactive'
  }

  const now = new Date()

  const startsAt =
    new Date(offer.starts_at)

  const endsAt = offer.ends_at
    ? new Date(offer.ends_at)
    : null

  if (startsAt > now) {
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

/* =========================================================
   DISCOUNT
========================================================= */

function formatDiscount(
  offer: FashionOffer,
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

/* =========================================================
   DATE
========================================================= */

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
   TARGET LABEL
========================================================= */

function getTargetLabel(
  offer: FashionOffer,
) {
  switch (offer.scope_type) {
    case 'all':
      return 'All Fashion'

    case 'category':
      return 'Main Category'

    case 'subcategory':
      return 'Subcategory'

    case 'design':
      return 'Specific Design'

    default:
      return 'Unknown'
  }
}

/* =========================================================
   TARGET DESCRIPTION
========================================================= */

function getTargetDescription(
  offer: FashionOffer,
) {
  switch (offer.scope_type) {
    case 'all':
      return 'All main categories → all subcategories → all designs'

    case 'category':
      return `${offer.categoryIds.length} main categor${
        offer.categoryIds.length === 1
          ? 'y'
          : 'ies'
      } → all subcategories → all designs`

    case 'subcategory':
      if (
        offer.designIds.length > 0
      ) {
        return `${offer.subcategoryIds.length} subcategor${
          offer.subcategoryIds.length ===
          1
            ? 'y'
            : 'ies'
        } → selected designs`
      }

      return `${offer.subcategoryIds.length} subcategor${
        offer.subcategoryIds.length ===
        1
          ? 'y'
          : 'ies'
      } → all designs`

    case 'design':
      return `${offer.designIds.length} specific design${
        offer.designIds.length ===
        1
          ? ''
          : 's'
      }`

    default:
      return ''
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminFashionOffers() {
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
  ] = useState<FashionOffer[]>([])

  const [
    categories,
    setCategories,
  ] = useState<FashionCategory[]>([])

  const [
    subcategories,
    setSubcategories,
  ] = useState<
    FashionSubcategory[]
  >([])

  const [
    designs,
    setDesigns,
  ] = useState<FashionDesign[]>([])

  const [
    form,
    setForm,
  ] = useState<OfferForm>(
    createEmptyForm(),
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
    subcategoryPage,
    setSubcategoryPage,
  ] = useState(1)

  const [
    designPage,
    setDesignPage,
  ] = useState(1)

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData =
    useCallback(
      async () => {
        setLoading(true)
        setError('')

        try {
          const [
            offersResponse,
            categoriesResponse,
            subcategoriesResponse,
            designsResponse,
          ] =
            await Promise.all([
              supabase
                .from(
                  'fashion_offers',
                )
                .select(`
                  id,
                  title,
                  description,
                  discount_type,
                  discount_value,
                  promo_code,
                  starts_at,
                  ends_at,
                  is_active,
                  applies_to_all,
                  priority,
                  scope_type,
                  created_at
                `)
                .order(
                  'priority',
                  {
                    ascending:
                      false,
                  },
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  },
                ),

              supabase
                .from(
                  'fashion_categories',
                )
                .select(`
                  id,
                  name,
                  is_active
                `)
                .eq(
                  'is_active',
                  true,
                )
                .order(
                  'name',
                  {
                    ascending:
                      true,
                  },
                ),

              supabase
                .from(
                  'fashion_subcategories',
                )
                .select(`
                  id,
                  name,
                  category_id,
                  is_active
                `)
                .eq(
                  'is_active',
                  true,
                )
                .order(
                  'name',
                  {
                    ascending:
                      true,
                  },
                ),

              supabase
                .from(
                  'fashion_designs',
                )
                .select(`
                  id,
                  name,
                  slug,
                  subcategory_id,
                  is_active
                `)
                .eq(
                  'is_active',
                  true,
                )
                .order(
                  'name',
                  {
                    ascending:
                      true,
                  },
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
            subcategoriesResponse.error
          ) {
            throw new Error(
              subcategoriesResponse.error.message,
            )
          }

          if (
            designsResponse.error
          ) {
            throw new Error(
              designsResponse.error.message,
            )
          }

          setCategories(
            (categoriesResponse.data ??
              []) as FashionCategory[],
          )

          setSubcategories(
            (subcategoriesResponse.data ??
              []) as FashionSubcategory[],
          )

          setDesigns(
            (designsResponse.data ??
              []) as FashionDesign[],
          )

          const rawOffers =
            offersResponse.data ?? []

          /*
           * Load relationships for every
           * existing offer.
           */

          if (
            rawOffers.length ===
            0
          ) {
            setOffers([])
            return
          }

          const offerIds =
            rawOffers.map(
              (offer) =>
                offer.id,
            )

          const [
            categoryLinks,
            subcategoryLinks,
            designLinks,
          ] =
            await Promise.all([
              supabase
                .from(
                  'fashion_offer_categories',
                )
                .select(
                  'offer_id, category_id',
                )
                .in(
                  'offer_id',
                  offerIds,
                ),

              supabase
                .from(
                  'fashion_offer_subcategories',
                )
                .select(
                  'offer_id, subcategory_id',
                )
                .in(
                  'offer_id',
                  offerIds,
                ),

              supabase
                .from(
                  'fashion_offer_designs',
                )
                .select(
                  'offer_id, design_id',
                )
                .in(
                  'offer_id',
                  offerIds,
                ),
            ])

          if (
            categoryLinks.error
          ) {
            throw new Error(
              categoryLinks.error.message,
            )
          }

          if (
            subcategoryLinks.error
          ) {
            throw new Error(
              subcategoryLinks.error.message,
            )
          }

          if (
            designLinks.error
          ) {
            throw new Error(
              designLinks.error.message,
            )
          }

          const mappedOffers =
            rawOffers.map(
              (offer) => ({
                ...offer,

                scope_type:
                  (
                    offer.scope_type ??
                    (
                      offer.applies_to_all
                        ? 'all'
                        : 'design'
                    )
                  ) as OfferTarget,

                categoryIds:
                  (
                    categoryLinks.data ??
                    []
                  )
                    .filter(
                      (row) =>
                        row.offer_id ===
                        offer.id,
                    )
                    .map(
                      (row) =>
                        row.category_id,
                    ),

                subcategoryIds:
                  (
                    subcategoryLinks.data ??
                    []
                  )
                    .filter(
                      (row) =>
                        row.offer_id ===
                        offer.id,
                    )
                    .map(
                      (row) =>
                        row.subcategory_id,
                    ),

                designIds:
                  (
                    designLinks.data ??
                    []
                  )
                    .filter(
                      (row) =>
                        row.offer_id ===
                        offer.id,
                    )
                    .map(
                      (row) =>
                        row.design_id,
                    ),
              }),
            ) as FashionOffer[]

          setOffers(mappedOffers)

          /*
           * Load edit data.
           */

          if (isEdit && id) {
            const existing =
              mappedOffers.find(
                (offer) =>
                  offer.id === id,
              )

            if (!existing) {
              throw new Error(
                'Fashion offer not found.',
              )
            }

            let editTarget:
              OfferTarget =
              existing.scope_type

            if (
              editTarget ===
              'subcategory'
            ) {
              /*
               * If selected subcategory
               * has design mappings, use
               * specific mode.
               */
              const isSpecific =
                existing.designIds
                  .length > 0

              setForm({
                title:
                  existing.title,

                description:
                  existing.description,

                target:
                  editTarget,

                categoryIds:
                  existing.categoryIds,

                subcategoryIds:
                  existing.subcategoryIds,

                designIds:
                  existing.designIds,

                subcategoryDesignMode:
                  isSpecific
                    ? 'specific'
                    : 'all',

                discountType:
                  existing.discount_type,

                discountValue:
                  String(
                    existing.discount_value,
                  ),

                promoCode:
                  existing.promo_code ??
                  '',

                startsAt:
                  toLocalDateTime(
                    existing.starts_at,
                  ),

                endsAt:
                  toLocalDateTime(
                    existing.ends_at,
                  ),

                priority:
                  String(
                    existing.priority,
                  ),

                isActive:
                  existing.is_active,
              })
            } else {
              setForm({
                title:
                  existing.title,

                description:
                  existing.description,

                target:
                  editTarget,

                categoryIds:
                  existing.categoryIds,

                subcategoryIds:
                  existing.subcategoryIds,

                designIds:
                  existing.designIds,

                subcategoryDesignMode:
                  'all',

                discountType:
                  existing.discount_type,

                discountValue:
                  String(
                    existing.discount_value,
                  ),

                promoCode:
                  existing.promo_code ??
                  '',

                startsAt:
                  toLocalDateTime(
                    existing.starts_at,
                  ),

                endsAt:
                  toLocalDateTime(
                    existing.ends_at,
                  ),

                priority:
                  String(
                    existing.priority,
                  ),

                isActive:
                  existing.is_active,
              })
            }
          }
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Unable to load fashion offers.',
          )
        } finally {
          setLoading(false)
        }
      },
      [id, isEdit],
    )

  useEffect(() => {
    void loadData()
  }, [loadData])

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
              .includes(query) ||
            offer.description
              .toLowerCase()
              .includes(query) ||
            (
              offer.promo_code ??
              ''
            )
              .toLowerCase()
              .includes(query)

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
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOffers.length /
          OFFER_PAGE_SIZE,
      ),
    )

  const paginatedOffers =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        OFFER_PAGE_SIZE

      return filteredOffers.slice(
        start,
        start +
          OFFER_PAGE_SIZE,
      )
    }, [
      filteredOffers,
      currentPage,
    ])

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

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    targetFilter,
    statusFilter,
  ])

  /* =======================================================
     COUNTS
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
     FORM DATA
  ======================================================= */

  const availableSubcategories =
    useMemo(() => {
      if (
        form.target !==
          'subcategory' &&
        form.target !==
          'design'
      ) {
        return []
      }

      if (
        form.target ===
          'subcategory' &&
        form.categoryIds.length ===
          0
      ) {
        return []
      }

      if (
        form.categoryIds.length ===
        0
      ) {
        return subcategories
      }

      return subcategories.filter(
        (subcategory) =>
          form.categoryIds.includes(
            subcategory.category_id,
          ),
      )
    }, [
      form.target,
      form.categoryIds,
      subcategories,
    ])

  const availableDesigns =
    useMemo(() => {
      if (
        form.target ===
        'design'
      ) {
        return form.subcategoryIds
          .length
          ? designs.filter(
              (design) =>
                form.subcategoryIds.includes(
                  design.subcategory_id,
                ),
            )
          : designs
      }

      if (
        form.target ===
        'subcategory'
      ) {
        if (
          form.subcategoryIds
            .length === 0
        ) {
          return []
        }

        return designs.filter(
          (design) =>
            form.subcategoryIds.includes(
              design.subcategory_id,
            ),
        )
      }

      return []
    }, [
      designs,
      form.target,
      form.subcategoryIds,
    ])

  /* =======================================================
     PAGINATED CATEGORIES
  ======================================================= */

  const paginatedCategories =
    useMemo(() => {
      const start =
        (categoryPage - 1) *
        CATEGORY_PAGE_SIZE

      return categories.slice(
        start,
        start +
          CATEGORY_PAGE_SIZE,
      )
    }, [
      categories,
      categoryPage,
    ])

  const categoryPages =
    Math.max(
      1,
      Math.ceil(
        categories.length /
          CATEGORY_PAGE_SIZE,
      ),
    )

  /* =======================================================
     PAGINATED SUBCATEGORIES
  ======================================================= */

  const paginatedSubcategories =
    useMemo(() => {
      const start =
        (subcategoryPage - 1) *
        SUBCATEGORY_PAGE_SIZE

      return availableSubcategories.slice(
        start,
        start +
          SUBCATEGORY_PAGE_SIZE,
      )
    }, [
      availableSubcategories,
      subcategoryPage,
    ])

  const subcategoryPages =
    Math.max(
      1,
      Math.ceil(
        availableSubcategories.length /
          SUBCATEGORY_PAGE_SIZE,
      ),
    )

  /* =======================================================
     PAGINATED DESIGNS
  ======================================================= */

  const paginatedDesigns =
    useMemo(() => {
      const start =
        (designPage - 1) *
        DESIGN_PAGE_SIZE

      return availableDesigns.slice(
        start,
        start +
          DESIGN_PAGE_SIZE,
      )
    }, [
      availableDesigns,
      designPage,
    ])

  const designPages =
    Math.max(
      1,
      Math.ceil(
        availableDesigns.length /
          DESIGN_PAGE_SIZE,
      ),
    )

  /* =======================================================
     TARGET CHANGE
  ======================================================= */

  function changeTarget(
    target: OfferTarget,
  ) {
    setError('')

    setForm(
      (previous) => ({
        ...previous,

        target,

        categoryIds: [],
        subcategoryIds: [],
        designIds: [],

        subcategoryDesignMode:
          'all',
      }),
    )

    setCategoryPage(1)
    setSubcategoryPage(1)
    setDesignPage(1)
  }

  /* =======================================================
     CATEGORY TOGGLE
  ======================================================= */

  function toggleCategory(
    categoryId: string,
  ) {
    setForm(
      (previous) => {
        const exists =
          previous.categoryIds.includes(
            categoryId,
          )

        const categoryIds =
          exists
            ? previous.categoryIds.filter(
                (id) =>
                  id !==
                  categoryId,
              )
            : [
                ...previous.categoryIds,
                categoryId,
              ]

        /*
         * When categories change,
         * remove subcategories/designs
         * that are no longer inside
         * selected categories.
         */
        const validSubcategoryIds =
          new Set(
            subcategories
              .filter(
                (subcategory) =>
                  categoryIds.includes(
                    subcategory.category_id,
                  ),
              )
              .map(
                (subcategory) =>
                  subcategory.id,
              ),
          )

        const subcategoryIds =
          previous.subcategoryIds.filter(
            (id) =>
              validSubcategoryIds.has(
                id,
              ),
          )

        const validDesignIds =
          new Set(
            designs
              .filter(
                (design) =>
                  subcategoryIds.includes(
                    design.subcategory_id,
                  ),
              )
              .map(
                (design) =>
                  design.id,
              ),
          )

        const designIds =
          previous.designIds.filter(
            (id) =>
              validDesignIds.has(
                id,
              ),
          )

        return {
          ...previous,
          categoryIds,
          subcategoryIds,
          designIds,
        }
      },
    )
  }

  /* =======================================================
     SUBCATEGORY TOGGLE
  ======================================================= */

  function toggleSubcategory(
    subcategoryId: string,
  ) {
    setForm(
      (previous) => {
        const exists =
          previous.subcategoryIds.includes(
            subcategoryId,
          )

        const subcategoryIds =
          exists
            ? previous.subcategoryIds.filter(
                (id) =>
                  id !==
                  subcategoryId,
              )
            : [
                ...previous.subcategoryIds,
                subcategoryId,
              ]

        /*
         * Remove designs that no longer
         * belong to selected subcategories.
         */
        const validDesignIds =
          new Set(
            designs
              .filter(
                (design) =>
                  subcategoryIds.includes(
                    design.subcategory_id,
                  ),
              )
              .map(
                (design) =>
                  design.id,
              ),
          )

        const designIds =
          previous.designIds.filter(
            (id) =>
              validDesignIds.has(
                id,
              ),
          )

        return {
          ...previous,
          subcategoryIds,
          designIds,
        }
      },
    )
  }

  /* =======================================================
     DESIGN TOGGLE
  ======================================================= */

  function toggleDesign(
    designId: string,
  ) {
    setForm(
      (previous) => {
        const exists =
          previous.designIds.includes(
            designId,
          )

        return {
          ...previous,

          designIds:
            exists
              ? previous.designIds.filter(
                  (id) =>
                    id !==
                    designId,
                )
              : [
                  ...previous.designIds,
                  designId,
                ],
        }
      },
    )
  }

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  function validateForm() {
    if (
      !form.title.trim()
    ) {
      return 'Offer title is required.'
    }

    if (
      !form.description.trim()
    ) {
      return 'Offer description is required.'
    }

    const discount =
      Number(
        form.discountValue,
      )

    if (
      !Number.isFinite(
        discount,
      ) ||
      discount < 0
    ) {
      return 'Enter a valid discount value.'
    }

    if (
      form.discountType ===
        'percentage' &&
      discount > 100
    ) {
      return 'Percentage discount cannot exceed 100%.'
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
      return 'Priority must be a non-negative integer.'
    }

    if (
      !form.startsAt
    ) {
      return 'Start date is required.'
    }

    if (
      form.endsAt &&
      new Date(
        form.endsAt,
      ) <=
        new Date(
          form.startsAt,
        )
    ) {
      return 'End date must be after start date.'
    }

    if (
      form.target ===
        'category' &&
      form.categoryIds.length ===
        0
    ) {
      return 'Select at least one main category.'
    }

    if (
      form.target ===
        'subcategory' &&
      form.categoryIds.length ===
        0
    ) {
      return 'Select at least one main category.'
    }

    if (
      form.target ===
        'subcategory' &&
      form.subcategoryIds.length ===
        0
    ) {
      return 'Select at least one subcategory.'
    }

    if (
      form.target ===
        'subcategory' &&
      form.subcategoryDesignMode ===
        'specific' &&
      form.designIds.length ===
        0
    ) {
      return 'Select at least one fashion design.'
    }

    if (
      form.target ===
        'design' &&
      form.subcategoryIds.length ===
        0
    ) {
      return 'Select at least one subcategory.'
    }

    if (
      form.target ===
        'design' &&
      form.designIds.length ===
        0
    ) {
      return 'Select at least one fashion design.'
    }

    return ''
  }

  /* =======================================================
     SAVE RELATIONSHIPS
  ======================================================= */

  async function saveMappings(
    offerId: string,
  ) {
    /*
     * Always clear previous mappings.
     *
     * This makes edit operations safe.
     */
    const deleteResults =
      await Promise.all([
        supabase
          .from(
            'fashion_offer_categories',
          )
          .delete()
          .eq(
            'offer_id',
            offerId,
          ),

        supabase
          .from(
            'fashion_offer_subcategories',
          )
          .delete()
          .eq(
            'offer_id',
            offerId,
          ),

        supabase
          .from(
            'fashion_offer_designs',
          )
          .delete()
          .eq(
            'offer_id',
            offerId,
          ),
      ])

    const deleteError =
      deleteResults.find(
        (result) =>
          result.error,
      )

    if (
      deleteError?.error
    ) {
      throw new Error(
        deleteError.error.message,
      )
    }

    /*
     * ALL FASHION
     *
     * No relationship rows.
     */
    if (
      form.target ===
      'all'
    ) {
      return
    }

    /*
     * MAIN CATEGORY
     *
     * Category row means:
     *
     * category
     *   → all subcategories
     *   → all designs
     */
    if (
      form.target ===
      'category'
    ) {
      if (
        form.categoryIds.length
      ) {
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
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_offer_categories',
            )
            .insert(
              rows,
            )

        if (
          insertError
        ) {
          throw new Error(
            insertError.message,
          )
        }
      }

      return
    }

    /*
     * SUBCATEGORY
     *
     * category
     *   → selected subcategory
     *       → all designs
     *
     * OR
     *
     * category
     *   → selected subcategory
     *       → selected designs
     */
    if (
      form.target ===
      'subcategory'
    ) {
      if (
        form.categoryIds.length
      ) {
        const categoryRows =
          form.categoryIds.map(
            (categoryId) => ({
              offer_id:
                offerId,
              category_id:
                categoryId,
            }),
          )

        const {
          error: categoryError,
        } =
          await supabase
            .from(
              'fashion_offer_categories',
            )
            .insert(
              categoryRows,
            )

        if (
          categoryError
        ) {
          throw new Error(
            categoryError.message,
          )
        }
      }

      if (
        form.subcategoryIds.length
      ) {
        const rows =
          form.subcategoryIds.map(
            (subcategoryId) => ({
              offer_id:
                offerId,
              subcategory_id:
                subcategoryId,
            }),
          )

        const {
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_offer_subcategories',
            )
            .insert(
              rows,
            )

        if (
          insertError
        ) {
          throw new Error(
            insertError.message,
          )
        }
      }

      if (
        form.subcategoryDesignMode ===
          'specific' &&
        form.designIds.length
      ) {
        const rows =
          form.designIds.map(
            (designId) => ({
              offer_id:
                offerId,
              design_id:
                designId,
            }),
          )

        const {
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_offer_designs',
            )
            .insert(
              rows,
            )

        if (
          insertError
        ) {
          throw new Error(
            insertError.message,
          )
        }
      }

      return
    }

    /*
     * SPECIFIC DESIGN
     *
     * Save the parent subcategories
     * as well as selected designs.
     */
    if (
      form.target ===
      'design'
    ) {
      /*
       * Determine categories from
       * selected subcategories.
       */
      const categoryIds =
        Array.from(
          new Set(
            subcategories
              .filter(
                (subcategory) =>
                  form.subcategoryIds.includes(
                    subcategory.id,
                  ),
              )
              .map(
                (subcategory) =>
                  subcategory.category_id,
              ),
          ),
        )

      if (
        categoryIds.length
      ) {
        const categoryRows =
          categoryIds.map(
            (categoryId) => ({
              offer_id:
                offerId,
              category_id:
                categoryId,
            }),
          )

        const {
          error: categoryError,
        } =
          await supabase
            .from(
              'fashion_offer_categories',
            )
            .insert(
              categoryRows,
            )

        if (
          categoryError
        ) {
          throw new Error(
            categoryError.message,
          )
        }
      }

      if (
        form.subcategoryIds.length
      ) {
        const subcategoryRows =
          form.subcategoryIds.map(
            (subcategoryId) => ({
              offer_id:
                offerId,
              subcategory_id:
                subcategoryId,
            }),
          )

        const {
          error: subcategoryError,
        } =
          await supabase
            .from(
              'fashion_offer_subcategories',
            )
            .insert(
              subcategoryRows,
            )

        if (
          subcategoryError
        ) {
          throw new Error(
            subcategoryError.message,
          )
        }
      }

      if (
        form.designIds.length
      ) {
        const designRows =
          form.designIds.map(
            (designId) => ({
              offer_id:
                offerId,
              design_id:
                designId,
            }),
          )

        const {
          error: designError,
        } =
          await supabase
            .from(
              'fashion_offer_designs',
            )
            .insert(
              designRows,
            )

        if (
          designError
        ) {
          throw new Error(
            designError.message,
          )
        }
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

    const validationError =
      validateForm()

    if (
      validationError
    ) {
      setError(
        validationError,
      )

      return
    }

    setSaving(true)
    setError('')

    let offerId =
      id ?? null

    try {
      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        discount_type:
          form.discountType,

        discount_value:
          Number(
            form.discountValue,
          ),

        promo_code:
          form.promoCode.trim() ||
          null,

        starts_at:
          new Date(
            form.startsAt,
          ).toISOString(),

        ends_at:
          form.endsAt
            ? new Date(
                form.endsAt,
              ).toISOString()
            : null,

        is_active:
          form.isActive,

        applies_to_all:
          form.target ===
          'all',

        priority:
          Number(
            form.priority ||
              0,
          ),

        scope_type:
          form.target,
      }

      if (
        isEdit &&
        offerId
      ) {
        const {
          error: updateError,
        } =
          await supabase
            .from(
              'fashion_offers',
            )
            .update(
              payload,
            )
            .eq(
              'id',
              offerId,
            )

        if (
          updateError
        ) {
          throw new Error(
            updateError.message,
          )
        }
      } else {
        const {
          data,
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_offers',
            )
            .insert(
              payload,
            )
            .select(
              'id',
            )
            .single()

        if (
          insertError
        ) {
          throw new Error(
            insertError.message,
          )
        }

        offerId =
          data.id
      }

      if (
        !offerId
      ) {
        throw new Error(
          'Unable to determine offer ID.',
        )
      }

      await saveMappings(
        offerId,
      )

      navigate(
        '/admin/services/fashion/offers',
      )
    } catch (
      saveError
    ) {
      /*
       * If creation succeeded but
       * relationship creation failed,
       * remove incomplete offer.
       */
      if (
        !isEdit &&
        offerId
      ) {
        await supabase
          .from(
            'fashion_offers',
          )
          .delete()
          .eq(
            'id',
            offerId,
          )
      }

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : 'Unable to save fashion offer.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteOffer(
    offer: FashionOffer,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${offer.title}"? This action cannot be undone.`,
      )

    if (!confirmed) {
      return
    }

    setError('')

    try {
      const {
        error: deleteError,
      } =
        await supabase
          .from(
            'fashion_offers',
          )
          .delete()
          .eq(
            'id',
            offer.id,
          )

      if (
        deleteError
      ) {
        throw new Error(
          deleteError.message,
        )
      }

      setOffers(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              offer.id,
          ),
      )
    } catch (
      deleteException
    ) {
      setError(
        deleteException instanceof
          Error
          ? deleteException.message
          : 'Unable to delete fashion offer.',
      )
    }
  }

  /* =======================================================
     TOGGLE ACTIVE
  ======================================================= */

  async function toggleOffer(
    offer: FashionOffer,
  ) {
    setError('')

    try {
      const nextValue =
        !offer.is_active

      const {
        error: updateError,
      } =
        await supabase
          .from(
            'fashion_offers',
          )
          .update({
            is_active:
              nextValue,
          })
          .eq(
            'id',
            offer.id,
          )

      if (
        updateError
      ) {
        throw new Error(
          updateError.message,
        )
      }

      setOffers(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              offer.id
                ? {
                    ...item,
                    is_active:
                      nextValue,
                  }
                : item,
          ),
      )
    } catch (
      toggleException
    ) {
      setError(
        toggleException instanceof
          Error
          ? toggleException.message
          : 'Unable to update offer status.',
      )
    }
  }

  /* =======================================================
     PAGINATION
  ======================================================= */

  function renderPagination() {
    if (
      totalPages <= 1
    ) {
      return null
    }

    return (
      <div className="fashion-offers-pagination">
        <button
          type="button"
          disabled={
            currentPage === 1
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
          Previous
        </button>

        {Array.from(
          {
            length:
              totalPages,
          },
          (_, index) =>
            index + 1,
        ).map(
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
          Next
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
    setPage: (
      page: number,
    ) => void,
  ) {
    if (
      total <= 1
    ) {
      return null
    }

    return (
      <div className="fashion-selection-pagination">
        <button
          type="button"
          disabled={
            page === 1
          }
          onClick={() =>
            setPage(
              Math.max(
                1,
                page - 1,
              ),
            )
          }
        >
          Previous
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
              Math.min(
                total,
                page + 1,
              ),
            )
          }
        >
          Next
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
      <main className="fashion-offers-page">

        <div className="fashion-offer-form-shell">

          <header className="fashion-offer-form-header">

            <div className="fashion-offer-form-topline">

              <Link
                to="/admin/services/fashion/offers"
              >
                ← Back to Fashion Offers
              </Link>

              <Link
                to="/admin"
              >
                ← Back to Dashboard
              </Link>

            </div>

            <span>
              FASHION / PROMOTIONS
            </span>

            <h1>
              {isEdit
                ? 'Edit Fashion Offer'
                : 'Create Fashion Offer'}
            </h1>

            <p>
              Create promotions for all fashion,
              main categories, subcategories,
              or individual fashion designs.
            </p>

          </header>

          {error && (
            <div className="fashion-offer-error">
              {error}
            </div>
          )}

          {loading &&
          isEdit ? (
            <div className="fashion-offer-loading">
              Loading offer...
            </div>
          ) : (
            <form
              className="fashion-offer-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* =================================================
                  01 OFFER DETAILS
              ================================================= */}

              <section className="fashion-offer-section">

                <div className="fashion-offer-section-heading">

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

                <div className="fashion-offer-form-grid">

                  <label className="fashion-offer-field">
                    <span>
                      Offer Title*
                    </span>

                    <input
                      type="text"
                      value={
                        form.title
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            title:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="Example: Festive Fashion Offer"
                      maxLength={150}
                      required
                    />
                  </label>

                  <label className="fashion-offer-field">
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
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            promoCode:
                              event
                                .target
                                .value
                                .toUpperCase(),
                          }),
                        )
                      }
                      placeholder="Example: FASHION20"
                      maxLength={50}
                    />
                  </label>

                  <label className="fashion-offer-field full">
                    <span>
                      Description*
                    </span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            description:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="Describe what this promotion offers..."
                      rows={5}
                      maxLength={1000}
                      required
                    />
                  </label>

                </div>

              </section>

              {/* =================================================
                  02 APPLY OFFER
              ================================================= */}

              <section className="fashion-offer-section">

                <div className="fashion-offer-section-heading">

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

                <p className="fashion-offer-section-description">
                  Choose exactly where this promotion
                  applies in your fashion catalogue.
                </p>

                <div className="fashion-offer-target-options">

                  <button
                    type="button"
                    className={
                      form.target ===
                      'all'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      changeTarget(
                        'all',
                      )
                    }
                  >
                    <strong>
                      All Fashion
                    </strong>

                    <span>
                      Apply to every active
                      fashion design.
                    </span>

                    <small>
                      All categories → all
                      subcategories → all designs
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
                      changeTarget(
                        'category',
                      )
                    }
                  >
                    <strong>
                      Main Category
                    </strong>

                    <span>
                      Select one or more
                      main categories.
                    </span>

                    <small>
                      Category → all subcategories
                      → all designs
                    </small>
                  </button>

                  <button
                    type="button"
                    className={
                      form.target ===
                      'subcategory'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      changeTarget(
                        'subcategory',
                      )
                    }
                  >
                    <strong>
                      Subcategory
                    </strong>

                    <span>
                      Select category and
                      subcategory.
                    </span>

                    <small>
                      Subcategory → all or
                      selected designs
                    </small>
                  </button>

                  <button
                    type="button"
                    className={
                      form.target ===
                      'design'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      changeTarget(
                        'design',
                      )
                    }
                  >
                    <strong>
                      Specific Design
                    </strong>

                    <span>
                      Select individual
                      fashion designs.
                    </span>

                    <small>
                      Selected designs only
                    </small>
                  </button>

                </div>

                {/* =============================================
                    MAIN CATEGORY
                ============================================= */}

                {(
                  form.target ===
                    'category' ||
                  form.target ===
                    'subcategory' ||
                  form.target ===
                    'design'
                ) && (
                  <div className="fashion-selection-block">

                    <div className="fashion-selection-heading">

                      <div>
                        <strong>
                          1. Select Main Category
                        </strong>

                        <small>
                          Choose the parent fashion
                          category.
                        </small>
                      </div>

                      <span>
                        Selected:{' '}
                        {
                          form
                            .categoryIds
                            .length
                        }
                      </span>

                    </div>

                    <div className="fashion-selection-grid">

                      {paginatedCategories.map(
                        (
                          category,
                        ) => {
                          const selected =
                            form.categoryIds.includes(
                              category.id,
                            )

                          return (
                            <button
                              type="button"
                              key={
                                category.id
                              }
                              className={
                                selected
                                  ? 'selected'
                                  : ''
                              }
                              onClick={() =>
                                toggleCategory(
                                  category.id,
                                )
                              }
                            >
                              <span className="fashion-checkbox">
                                {selected
                                  ? '✓'
                                  : ''}
                              </span>

                              <strong>
                                {
                                  category.name
                                }
                              </strong>
                            </button>
                          )
                        },
                      )}

                    </div>

                    {renderSelectionPagination(
                      categoryPage,
                      categoryPages,
                      setCategoryPage,
                    )}

                  </div>
                )}

                {/* =============================================
                    SUBCATEGORY
                ============================================= */}

                {(
                  form.target ===
                    'subcategory' ||
                  form.target ===
                    'design'
                ) &&
                  form.categoryIds.length >
                    0 && (
                    <div className="fashion-selection-block">

                      <div className="fashion-selection-heading">

                        <div>
                          <strong>
                            2. Select Subcategory
                          </strong>

                          <small>
                            Select one or more
                            subcategories from
                            the chosen categories.
                          </small>
                        </div>

                        <span>
                          Selected:{' '}
                          {
                            form
                              .subcategoryIds
                              .length
                          }
                        </span>

                      </div>

                      <div className="fashion-selection-grid">

                        {paginatedSubcategories.map(
                          (
                            subcategory,
                          ) => {
                            const selected =
                              form.subcategoryIds.includes(
                                subcategory.id,
                              )

                            const parent =
                              categories.find(
                                (
                                  category,
                                ) =>
                                  category.id ===
                                  subcategory.category_id,
                              )

                            return (
                              <button
                                type="button"
                                key={
                                  subcategory.id
                                }
                                className={
                                  selected
                                    ? 'selected'
                                    : ''
                                }
                                onClick={() =>
                                  toggleSubcategory(
                                    subcategory.id,
                                  )
                                }
                              >
                                <span className="fashion-checkbox">
                                  {selected
                                    ? '✓'
                                    : ''}
                                </span>

                                <div>
                                  <strong>
                                    {
                                      subcategory.name
                                    }
                                  </strong>

                                  <small>
                                    {
                                      parent?.name
                                    }
                                  </small>
                                </div>
                              </button>
                            )
                          },
                        )}

                      </div>

                      {renderSelectionPagination(
                        subcategoryPage,
                        subcategoryPages,
                        setSubcategoryPage,
                      )}

                    </div>
                  )}

                {/* =============================================
                    SUBCATEGORY MODE
                ============================================= */}

                {form.target ===
                  'subcategory' &&
                  form.subcategoryIds
                    .length > 0 && (
                    <div className="fashion-selection-block">

                      <div className="fashion-selection-heading">
                        <div>
                          <strong>
                            3. Apply to Designs
                          </strong>

                          <small>
                            Decide whether every design
                            or only selected designs
                            receive this offer.
                          </small>
                        </div>
                      </div>

                      <div className="fashion-design-mode">

                        <button
                          type="button"
                          className={
                            form.subcategoryDesignMode ===
                            'all'
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            setForm(
                              (
                                previous,
                              ) => ({
                                ...previous,

                                subcategoryDesignMode:
                                  'all',

                                designIds:
                                  [],
                              }),
                            )
                          }
                        >
                          <strong>
                            All Designs
                          </strong>

                          <span>
                            Apply this offer to
                            every design inside
                            the selected subcategories.
                          </span>
                        </button>

                        <button
                          type="button"
                          className={
                            form.subcategoryDesignMode ===
                            'specific'
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            setForm(
                              (
                                previous,
                              ) => ({
                                ...previous,
                                subcategoryDesignMode:
                                  'specific',
                              }),
                            )
                          }
                        >
                          <strong>
                            Specific Designs
                          </strong>

                          <span>
                            Choose individual designs
                            inside the selected
                            subcategories.
                          </span>
                        </button>

                      </div>

                    </div>
                  )}

                {/* =============================================
                    SPECIFIC DESIGNS
                ============================================= */}

                {(
                  form.target ===
                    'design' ||
                  (
                    form.target ===
                      'subcategory' &&
                    form.subcategoryDesignMode ===
                      'specific'
                  )
                ) &&
                  form.subcategoryIds
                    .length > 0 && (
                    <div className="fashion-selection-block">

                      <div className="fashion-selection-heading">

                        <div>
                          <strong>
                            {form.target ===
                              'design'
                              ? '3. Select Specific Designs'
                              : '4. Select Specific Designs'}
                          </strong>

                          <small>
                            Only selected designs
                            will receive this offer.
                          </small>
                        </div>

                        <span>
                          Selected:{' '}
                          {
                            form
                              .designIds
                              .length
                          }
                        </span>

                      </div>

                      <div className="fashion-selection-grid">

                        {paginatedDesigns.map(
                          (
                            design,
                          ) => {
                            const selected =
                              form.designIds.includes(
                                design.id,
                              )

                            return (
                              <button
                                type="button"
                                key={
                                  design.id
                                }
                                className={
                                  selected
                                    ? 'selected'
                                    : ''
                                }
                                onClick={() =>
                                  toggleDesign(
                                    design.id,
                                  )
                                }
                              >
                                <span className="fashion-checkbox">
                                  {selected
                                    ? '✓'
                                    : ''}
                                </span>

                                <div>
                                  <strong>
                                    {
                                      design.name
                                    }
                                  </strong>

                                  <small>
                                    {
                                      design.slug
                                    }
                                  </small>
                                </div>
                              </button>
                            )
                          },
                        )}

                      </div>

                      {renderSelectionPagination(
                        designPage,
                        designPages,
                        setDesignPage,
                      )}

                    </div>
                  )}

              </section>

              {/* =================================================
                  03 DISCOUNT
              ================================================= */}

              <section className="fashion-offer-section">

                <div className="fashion-offer-section-heading">

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

                <div className="fashion-offer-form-grid">

                  <div className="fashion-offer-field">

                    <span>
                      Discount Type*
                    </span>

                    <div className="fashion-discount-toggle">

                      <button
                        type="button"
                        className={
                          form.discountType ===
                          'percentage'
                            ? 'selected'
                            : ''
                        }
                        onClick={() =>
                          setForm(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              discountType:
                                'percentage',
                            }),
                          )
                        }
                      >
                        Percentage
                      </button>

                      <button
                        type="button"
                        className={
                          form.discountType ===
                          'fixed'
                            ? 'selected'
                            : ''
                        }
                        onClick={() =>
                          setForm(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              discountType:
                                'fixed',
                            }),
                          )
                        }
                      >
                        Fixed Amount
                      </button>

                    </div>

                  </div>

                  <label className="fashion-offer-field">

                    <span>
                      Discount Value*
                    </span>

                    <div className="fashion-discount-input">

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
                          setForm(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              discountValue:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="0"
                        required
                      />

                      <span>
                        {form.discountType ===
                        'percentage'
                          ? '%'
                          : '₹'}
                      </span>

                    </div>

                  </label>

                  <label className="fashion-offer-field">

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
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            priority:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                    />

                    <small>
                      Higher priority wins when
                      multiple offers apply.
                    </small>

                  </label>

                </div>

              </section>

              {/* =================================================
                  04 SCHEDULE
              ================================================= */}

              <section className="fashion-offer-section">

                <div className="fashion-offer-section-heading">

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

                <div className="fashion-offer-form-grid">

                  <label className="fashion-offer-field">

                    <span>
                      Starts At*
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.startsAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            startsAt:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      required
                    />

                  </label>

                  <label className="fashion-offer-field">

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
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            endsAt:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                    />

                    <small>
                      Leave empty for no expiry date.
                    </small>

                  </label>

                </div>

                <div className="fashion-offer-active-row">

                  <div>
                    <strong>
                      Active Offer
                    </strong>

                    <span>
                      Customers can receive this
                      promotion according to its
                      dates and targeting.
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      form.isActive
                    }
                    className={
                      form.isActive
                        ? 'fashion-switch active'
                        : 'fashion-switch'
                    }
                    onClick={() =>
                      setForm(
                        (
                          previous,
                        ) => ({
                          ...previous,
                          isActive:
                            !previous.isActive,
                        }),
                      )
                    }
                  >
                    <span />
                  </button>

                </div>

              </section>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="fashion-offer-form-actions">

                <button
                  type="button"
                  className="secondary"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    navigate(
                      '/admin/services/fashion/offers',
                    )
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
                      ? 'Update Fashion Offer'
                      : 'Create Fashion Offer'}
                </button>

              </div>

            </form>
          )}

        </div>

      </main>
    )
  }

  /* =======================================================
     LIST PAGE
  ======================================================= */

  return (
    <main className="fashion-offers-page">

      <div className="fashion-offers-container">

        <Link
          to="/admin"
          className="fashion-offers-back"
        >
          ← Back to Dashboard
        </Link>

        <header className="fashion-offers-page-header">

          <div>
            <span>
              FASHION / PROMOTIONS
            </span>

            <h1>
              Fashion Offers
            </h1>

            <p>
              Manage promotions across fashion
              categories, subcategories, and designs.
            </p>
          </div>

          <Link
            to="/admin/services/fashion/offers/new"
            className="fashion-offers-primary-button"
          >
            + Create Fashion Offer
          </Link>

        </header>

        {error && (
          <div className="fashion-offers-error">
            {error}
          </div>
        )}

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="fashion-offers-stats">

          <article>
            <span>
              TOTAL OFFERS
            </span>

            <strong>
              {offers.length}
            </strong>
          </article>

          <article className="active">
            <span>
              ACTIVE
            </span>

            <strong>
              {activeCount}
            </strong>
          </article>

          <article className="scheduled">
            <span>
              SCHEDULED
            </span>

            <strong>
              {scheduledCount}
            </strong>
          </article>

          <article className="expired">
            <span>
              EXPIRED
            </span>

            <strong>
              {expiredCount}
            </strong>
          </article>

        </section>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="fashion-offers-toolbar">

          <div className="fashion-offers-search">

            <span>
              ⌕
            </span>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search fashion offers..."
            />

          </div>

          <select
            value={
              targetFilter
            }
            onChange={(
              event,
            ) =>
              setTargetFilter(
                event
                  .target
                  .value as
                  | 'all'
                  | OfferTarget,
              )
            }
          >
            <option value="all">
              All Targets
            </option>

            <option value="all">
              All Fashion
            </option>

            <option value="category">
              Main Category
            </option>

            <option value="subcategory">
              Subcategory
            </option>

            <option value="design">
              Specific Design
            </option>
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event
                  .target
                  .value as
                  | 'all'
                  | OfferStatus,
              )
            }
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

        {/* =====================================================
            OFFER LIST
        ===================================================== */}

        <section className="fashion-offers-list-card">

          {loading ? (
            <div className="fashion-offers-empty">
              <h2>
                Loading fashion offers...
              </h2>
            </div>
          ) : filteredOffers.length ===
            0 ? (
            <div className="fashion-offers-empty">

              <h2>
                No fashion offers found
              </h2>

              <p>
                Create your first fashion promotion
                to get started.
              </p>

              <Link
                to="/admin/services/fashion/offers/new"
              >
                + Create Fashion Offer
              </Link>

            </div>
          ) : (
            <>
              <div className="fashion-offers-table-wrapper">

                <table className="fashion-offers-table">

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
                              <div className="fashion-offer-name">

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
                                className={`fashion-offer-target ${offer.scope_type}`}
                              >
                                {
                                  getTargetLabel(
                                    offer,
                                  )
                                }
                              </span>
                            </td>

                            <td>
                              <div className="fashion-offer-applies">

                                <strong>
                                  {offer.scope_type ===
                                  'category'
                                    ? offer.categoryIds
                                        .map(
                                          (
                                            categoryId,
                                          ) =>
                                            categories.find(
                                              (
                                                category,
                                              ) =>
                                                category.id ===
                                                categoryId,
                                            )?.name,
                                        )
                                        .filter(
                                          Boolean,
                                        )
                                        .join(
                                          ', ',
                                        ) ||
                                      `${offer.categoryIds.length} Main Categor${
                                        offer.categoryIds.length ===
                                        1
                                          ? 'y'
                                          : 'ies'
                                      }`
                                    : offer.scope_type ===
                                        'subcategory'
                                      ? offer.subcategoryIds
                                          .map(
                                            (
                                              subcategoryId,
                                            ) =>
                                              subcategories.find(
                                                (
                                                  subcategory,
                                                ) =>
                                                  subcategory.id ===
                                                  subcategoryId,
                                              )?.name,
                                          )
                                          .filter(
                                            Boolean,
                                          )
                                          .join(
                                            ', ',
                                          ) ||
                                        `${offer.subcategoryIds.length} Subcategor${
                                          offer.subcategoryIds.length ===
                                          1
                                            ? 'y'
                                            : 'ies'
                                        }`
                                      : offer.scope_type ===
                                          'design'
                                        ? offer.designIds
                                            .map(
                                              (
                                                designId,
                                              ) =>
                                                designs.find(
                                                  (
                                                    design,
                                                  ) =>
                                                    design.id ===
                                                    designId,
                                                )?.name,
                                            )
                                            .filter(
                                              Boolean,
                                            )
                                            .join(
                                              ', ',
                                            ) ||
                                          `${offer.designIds.length} Design${
                                            offer.designIds.length ===
                                            1
                                              ? ''
                                              : 's'
                                          }`
                                        : 'All Fashion'}
                                </strong>

                                <small>
                                  {
                                    getTargetDescription(
                                      offer,
                                    )
                                  }
                                </small>

                              </div>
                            </td>

                            <td>
                              <strong className="fashion-offer-discount">
                                {
                                  formatDiscount(
                                    offer,
                                  )
                                }
                              </strong>
                            </td>

                            <td>
                              <strong className="fashion-offer-priority">
                                {
                                  offer.priority
                                }
                              </strong>
                            </td>

                            <td>
                              <span className="fashion-offer-date">
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
                                className={`fashion-offer-status ${status}`}
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
                              <div className="fashion-offer-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/admin/services/fashion/offers/${offer.id}/edit`,
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

              <footer className="fashion-offers-footer">

                <span>
                  Showing{' '}
                  <strong>
                    {
                      filteredOffers.length ===
                      0
                        ? 0
                        : (
                            currentPage -
                            1
                          ) *
                            OFFER_PAGE_SIZE +
                          1
                    }
                    -
                    {Math.min(
                      filteredOffers.length,
                      currentPage *
                        OFFER_PAGE_SIZE,
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
            </>
          )}

        </section>

      </div>

    </main>
  )
}

export default AdminFashionOffers