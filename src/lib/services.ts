import { supabase } from './supabase'

/* =========================================================
   TYPES
========================================================= */

export type Service = {
  id: string
  categoryId: string | null
  category: string | null
  name: string
  description: string | null
  durationMinutes: number

  // Original/base service price
  price: number

  // Active offer information
  originalPrice: number
  offerPrice: number
  discountAmount: number
  discountLabel: string | null

  imageUrl: string | null
}

type ServiceRow = {
  id: string
  name: string
  category_id: string | null
  category: string | null
  description: string | null
  price: number | string | null
  duration_minutes: number | string | null
  image_url: string | null
}

type OfferRow = {
  id: string
  title: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number | string
  starts_at: string
  ends_at: string | null
  is_active: boolean
  priority: number | string | null
  applies_to_all: boolean
  scope_type: string | null
  service_id: string | null
  category_id: string | null
}

type OfferServiceRow = {
  offer_id: string
  service_id: string
}

type OfferCategoryRow = {
  offer_id: string
  category_id: string
}

/* =========================================================
   APPLY ACTIVE OFFER
========================================================= */

function applyOffer(
  service: ServiceRow,
  offers: OfferRow[],
  serviceLinks: OfferServiceRow[],
  categoryLinks: OfferCategoryRow[],
): {
  originalPrice: number
  offerPrice: number
  discountAmount: number
  discountLabel: string | null
} {
  const originalPrice =
    Math.max(
      Number(service.price) || 0,
      0,
    )

  const now =
    Date.now()

  const applicableOffers =
    offers
      .filter(
        (offer) => {
          if (!offer.is_active) {
            return false
          }

          const startsAt =
            new Date(
              offer.starts_at,
            ).getTime()

          const endsAt =
            offer.ends_at
              ? new Date(
                  offer.ends_at,
                ).getTime()
              : null

          if (
            !Number.isFinite(
              startsAt,
            ) ||
            startsAt > now
          ) {
            return false
          }

          if (
            endsAt !== null &&
            Number.isFinite(
              endsAt,
            ) &&
            endsAt < now
          ) {
            return false
          }

          const serviceMatch =
            serviceLinks.some(
              (link) =>
                link.offer_id ===
                  offer.id &&
                link.service_id ===
                  service.id,
            )

          const categoryMatch =
            Boolean(
              service.category_id &&
                categoryLinks.some(
                  (link) =>
                    link.offer_id ===
                      offer.id &&
                    link.category_id ===
                      service.category_id,
                ),
            )

          const generalMatch =
            offer.applies_to_all ||
            offer.scope_type ===
              'all'

          return (
            generalMatch ||
            categoryMatch ||
            serviceMatch
          )
        },
      )
      .sort(
        (
          a,
          b,
        ) =>
          Number(
            b.priority ?? 0,
          ) -
          Number(
            a.priority ?? 0,
          ),
      )

  const offer =
    applicableOffers[0]

  if (!offer) {
    return {
      originalPrice,
      offerPrice:
        originalPrice,
      discountAmount: 0,
      discountLabel: null,
    }
  }

  const discountValue =
    Math.max(
      Number(
        offer.discount_value,
      ) || 0,
      0,
    )

  let discountAmount = 0

  if (
    offer.discount_type ===
    'percentage'
  ) {
    discountAmount =
      originalPrice *
      Math.min(
        discountValue,
        100,
      ) /
      100
  } else {
    discountAmount =
      Math.min(
        discountValue,
        originalPrice,
      )
  }

  discountAmount =
    Math.round(
      discountAmount,
    )

  const offerPrice =
    Math.max(
      originalPrice -
        discountAmount,
      0,
    )

  const discountLabel =
    offer.discount_type ===
    'percentage'
      ? `${Math.round(
          discountValue,
        )}% OFF`
      : `₹${Math.round(
          discountValue,
        ).toLocaleString(
          'en-IN',
        )} OFF`

  return {
    originalPrice,
    offerPrice,
    discountAmount,
    discountLabel,
  }
}

/* =========================================================
   GET ACTIVE SERVICES
========================================================= */

export async function getServices(): Promise<
  Service[]
> {
  const [
    servicesResponse,
    offersResponse,
    serviceLinksResponse,
    categoryLinksResponse,
  ] = await Promise.all([
    supabase
      .from('services')
      .select(
        `
          id,
          name,
          category_id,
          category,
          description,
          price,
          duration_minutes,
          image_url
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
      .from('offers')
      .select(
        `
          id,
          title,
          discount_type,
          discount_value,
          starts_at,
          ends_at,
          is_active,
          priority,
          applies_to_all,
          scope_type,
          service_id,
          category_id
        `,
      )
      .eq(
        'service_group',
        'beauty',
      )
      .eq(
        'is_active',
        true,
      ),

    supabase
      .from('offer_services')
      .select(
        `
          offer_id,
          service_id
        `,
      ),

    supabase
      .from('offer_categories')
      .select(
        `
          offer_id,
          category_id
        `,
      ),
  ])

  if (
    servicesResponse.error
  ) {
    throw new Error(
      servicesResponse.error.message,
    )
  }

  if (
    offersResponse.error
  ) {
    throw new Error(
      offersResponse.error.message,
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

  const data =
    (servicesResponse.data ??
      []) as ServiceRow[]

  const offers =
    (offersResponse.data ??
      []) as OfferRow[]

  const serviceLinks =
    (serviceLinksResponse.data ??
      []) as OfferServiceRow[]

  const categoryLinks =
    (categoryLinksResponse.data ??
      []) as OfferCategoryRow[]

  return data.map(
    (
      service,
    ): Service => ({
      id: service.id,

      categoryId:
        service.category_id ??
        null,

      category:
        service.category ??
        null,

      name:
        service.name,

      description:
        service.description ??
        null,

      durationMinutes:
        Number(
          service.duration_minutes,
        ) || 0,

      price:
        Number(
          service.price,
        ) || 0,

      ...applyOffer(
        service,
        offers,
        serviceLinks,
        categoryLinks,
      ),

      imageUrl:
        service.image_url ??
        null,
    }),
  )
}

/* =========================================================
   GET ONE ACTIVE SERVICE
========================================================= */

export async function getServiceById(
  serviceId: string,
): Promise<Service | null> {
  const cleanId =
    serviceId.trim()

  if (!cleanId) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('services')
    .select(
      `
        id,
        name,
        category_id,
        category,
        description,
        price,
        duration_minutes,
        image_url
      `,
    )
    .eq(
      'id',
      cleanId,
    )
    .eq(
      'is_active',
      true,
    )
    .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    return null
  }

  const service =
    data as ServiceRow

  return {
    id: service.id,

    categoryId:
      service.category_id ??
      null,

    category:
      service.category ??
      null,

    name:
      service.name,

    description:
      service.description ??
      null,

    durationMinutes:
      Number(
        service.duration_minutes,
      ) || 0,

    price:
      Number(
        service.price,
      ) || 0,

    originalPrice:
      Number(
        service.price,
      ) || 0,

    offerPrice:
      Number(
        service.price,
      ) || 0,

    discountAmount: 0,

    discountLabel: null,

    imageUrl:
      service.image_url ??
      null,
  }
}

/* =========================================================
   GET SERVICES BY IDS
========================================================= */

export async function getServicesByIds(
  serviceIds: string[],
): Promise<Service[]> {
  const ids = [
    ...new Set(
      serviceIds
        .filter(
          (
            id,
          ): id is string =>
            typeof id ===
            'string',
        )
        .map(
          (id) =>
            id.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ]

  if (ids.length === 0) {
    return []
  }

  const [
    servicesResponse,
    offersResponse,
    serviceLinksResponse,
    categoryLinksResponse,
  ] = await Promise.all([
    supabase
      .from('services')
      .select(
        `
          id,
          name,
          category_id,
          category,
          description,
          price,
          duration_minutes,
          image_url
        `,
      )
      .in(
        'id',
        ids,
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
      .from('offers')
      .select(
        `
          id,
          title,
          discount_type,
          discount_value,
          starts_at,
          ends_at,
          is_active,
          priority,
          applies_to_all,
          scope_type,
          service_id,
          category_id
        `,
      )
      .eq(
        'service_group',
        'beauty',
      )
      .eq(
        'is_active',
        true,
      ),

    supabase
      .from('offer_services')
      .select(
        `
          offer_id,
          service_id
        `,
      ),

    supabase
      .from('offer_categories')
      .select(
        `
          offer_id,
          category_id
        `,
      ),
  ])

  if (
    servicesResponse.error
  ) {
    throw new Error(
      servicesResponse.error.message,
    )
  }

  if (
    offersResponse.error
  ) {
    throw new Error(
      offersResponse.error.message,
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

  const data =
    (servicesResponse.data ??
      []) as ServiceRow[]

  const offers =
    (offersResponse.data ??
      []) as OfferRow[]

  const serviceLinks =
    (serviceLinksResponse.data ??
      []) as OfferServiceRow[]

  const categoryLinks =
    (categoryLinksResponse.data ??
      []) as OfferCategoryRow[]

  return data.map(
    (
      service,
    ): Service => ({
      id: service.id,

      categoryId:
        service.category_id ??
        null,

      category:
        service.category ??
        null,

      name:
        service.name,

      description:
        service.description ??
        null,

      durationMinutes:
        Number(
          service.duration_minutes,
        ) || 0,

      price:
        Number(
          service.price,
        ) || 0,

      ...applyOffer(
        service,
        offers,
        serviceLinks,
        categoryLinks,
      ),

      imageUrl:
        service.image_url ??
        null,
    }),
  )
}