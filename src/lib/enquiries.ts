import { getServices } from './services'
import { supabase } from './supabase'

/* =========================================================
   TYPES
========================================================= */

export type EnquiryContactPreference =
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'rejected'
  | 'converted'
  | 'closed'

export type CreateEnquiryPerson = {
  name: string
  phone?: string
  email?: string
  serviceIds: string[]
}

export type CreateEnquiryInput = {
  customerId: string

  preferredDate: string
  preferredTime: string

  contactPreference:
    EnquiryContactPreference

  notes?: string

  subtotal: number
  discountAmount: number
  totalAmount: number

  people: CreateEnquiryPerson[]
}

/* =========================================================
   HELPERS
========================================================= */

function cleanServiceIds(
  ids: string[],
): string[] {
  return [
    ...new Set(
      ids
        .filter(
          (
            id,
          ): id is string =>
            typeof id === 'string',
        )
        .map(
          (id) =>
            id.trim(),
        )
        .filter(Boolean),
    ),
  ]
}

function toSafeAmount(
  value: number,
): number {
  const amount =
    Number(value)

  if (
    !Number.isFinite(
      amount,
    ) ||
    amount < 0
  ) {
    return 0
  }

  return Math.round(
    amount * 100,
  ) / 100
}

/* =========================================================
   CREATE ENQUIRY
========================================================= */

export async function createEnquiry(
  input: CreateEnquiryInput,
) {
  if (!input.customerId) {
    throw new Error(
      'Customer is required.',
    )
  }

  if (!input.preferredDate) {
    throw new Error(
      'Preferred date is required.',
    )
  }

  if (!input.preferredTime) {
    throw new Error(
      'Preferred time is required.',
    )
  }

  if (!input.contactPreference) {
    throw new Error(
      'Contact preference is required.',
    )
  }

  if (
    !Array.isArray(
      input.people,
    ) ||
    input.people.length === 0
  ) {
    throw new Error(
      'At least one person is required.',
    )
  }

  /*
   * -------------------------------------------------------
   * LOAD CURRENT SERVICE CATALOGUE
   * -------------------------------------------------------
   *
   * This is intentionally done through getServices()
   * instead of directly reading services.price.
   *
   * The booking flow already uses getServices() to
   * calculate offerPrice / discount information.
   */
  const serviceCatalogue =
    await getServices()

  const serviceMap =
    new Map(
      serviceCatalogue.map(
        (
          service,
        ) => [
          service.id,
          service,
        ],
      ),
    )

  /*
   * -------------------------------------------------------
   * NORMALIZE PEOPLE + SERVICES
   * -------------------------------------------------------
   */

  const normalizedPeople =
    input.people.map(
      (
        person,
      ) => ({
        name:
          person.name.trim(),

        phone:
          person.phone?.trim() ||
          null,

        email:
          person.email?.trim() ||
          null,

        serviceIds:
          cleanServiceIds(
            person.serviceIds,
          ).filter(
            (
              serviceId,
            ) =>
              serviceMap.has(
                serviceId,
              ),
          ),
      }),
    )

  const validPeople =
    normalizedPeople.filter(
      (
        person,
      ) =>
        person.serviceIds.length >
        0,
    )

  if (
    validPeople.length ===
    0
  ) {
    throw new Error(
      'No valid services were found for this enquiry.',
    )
  }

  /*
   * -------------------------------------------------------
   * CALCULATE FROM THE SAME SERVICE SNAPSHOT
   * -------------------------------------------------------
   */

  let calculatedSubtotal =
    0

  for (
    const person of validPeople
  ) {
    for (
      const serviceId of person.serviceIds
    ) {
      const service =
        serviceMap.get(
          serviceId,
        )

      if (!service) {
        continue
      }

      calculatedSubtotal +=
        Number(
          service.offerPrice,
        ) ||
        Number(
          service.price,
        ) ||
        0
    }
  }

  calculatedSubtotal =
    toSafeAmount(
      calculatedSubtotal,
    )

  const requestedDiscount =
    toSafeAmount(
      input.discountAmount,
    )

  const calculatedDiscount =
    Math.min(
      requestedDiscount,
      calculatedSubtotal,
    )

  const calculatedTotal =
    toSafeAmount(
      Math.max(
        calculatedSubtotal -
          calculatedDiscount,
        0,
      ),
    )

  /*
   * -------------------------------------------------------
   * CREATE MAIN ENQUIRY
   * -------------------------------------------------------
   */

  const {
    data: enquiry,
    error: enquiryError,
  } =
    await supabase
      .from('enquiries')
      .insert({
       preferred_date:
          input.preferredDate,

        preferred_time:
          input.preferredTime,

        contact_preference:
          input.contactPreference,

        notes:
          input.notes?.trim() ||
          null,

        subtotal:
          calculatedSubtotal,

        discount_amount:
          calculatedDiscount,

        total_amount:
          calculatedTotal,

        status:
          'new',
      })
      .select('id')
      .single()

  if (
    enquiryError ||
    !enquiry
  ) {
    throw new Error(
      enquiryError?.message ??
        'Unable to create enquiry.',
    )
  }

  try {
    /*
     * -----------------------------------------------------
     * PEOPLE + ITEMS
     * -----------------------------------------------------
     */

    for (
      const person of validPeople
    ) {
      const {
        data: enquiryPerson,
        error: personError,
      } =
        await supabase
          .from(
            'enquiry_people',
          )
          .insert({
            enquiry_id:
              enquiry.id,

            name:
              person.name,

            phone:
              person.phone,

            email:
              person.email,
          })
          .select('id')
          .single()

      if (
        personError ||
        !enquiryPerson
      ) {
        throw new Error(
          personError?.message ??
            'Unable to save enquiry person.',
        )
      }

      const items =
        person.serviceIds
          .map(
            (
              serviceId,
            ) => {
              const service =
                serviceMap.get(
                  serviceId,
                )

              if (!service) {
                return null
              }

              const basePrice =
                Number(
                  service.originalPrice,
                ) ||
                Number(
                  service.price,
                ) ||
                0

              const offerPrice =
                Number(
                  service.offerPrice,
                ) ||
                Number(
                  service.price,
                ) ||
                0

              const originalPrice =
                Math.max(
                  basePrice,
                  offerPrice,
                )

              const discountAmount =
                Math.max(
                  originalPrice -
                    offerPrice,
                  0,
                )

              const discountLabel =
                discountAmount >
                  0 &&
                originalPrice >
                  0
                  ? `${Math.round(
                      (
                        discountAmount /
                        originalPrice
                      ) * 100,
                    )}% OFF`
                  : null

              return {
                enquiry_id:
                  enquiry.id,

                person_id:
                  enquiryPerson.id,

                service_id:
                  service.id,

                service_name:
                  service.name,

                duration_minutes:
                  Number(
                    service.durationMinutes,
                  ) || 0,

                original_price:
                  toSafeAmount(
                    originalPrice,
                  ),

                price:
                  toSafeAmount(
                    offerPrice,
                  ),

                discount_amount:
                  toSafeAmount(
                    discountAmount,
                  ),

                discount_label:
                  service.discountLabel ??
                  discountLabel,
              }
            },
          )
          .filter(
            (
              item,
            ): item is NonNullable<
              typeof item
            > =>
              item !== null,
          )

      if (
        items.length ===
        0
      ) {
        continue
      }

      const {
        error: itemError,
      } =
        await supabase
          .from(
            'enquiry_items',
          )
          .insert(
            items,
          )

      if (itemError) {
        throw new Error(
          itemError.message,
        )
      }
    }

    return enquiry
  } catch (
    error
  ) {
    /*
     * enquiries -> enquiry_people ->
     * enquiry_items are configured with
     * ON DELETE CASCADE.
     */
    await supabase
      .from('enquiries')
      .delete()
      .eq(
        'id',
        enquiry.id,
      )

    throw error
  }
}