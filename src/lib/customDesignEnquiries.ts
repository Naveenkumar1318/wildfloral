import { supabase } from './supabase'

export type CustomDesignStatus =
  | 'new'
  | 'accepted'
  | 'rejected'

export type CreateCustomDesignEnquiryInput = {
  name: string
  phone: string
  email?: string
  designType: string
  requirements: Record<string, string>
  preferredDate?: string
  referenceImageUrl?: string
  additionalNotes?: string
}

export async function createCustomDesignEnquiry(
  input: CreateCustomDesignEnquiryInput,
) {
  /*
   * =========================================================
   * GET CURRENT LOGGED-IN USER
   * =========================================================
   */

  const {
    data: {
      user,
    },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) {
    throw new Error(
      sessionError.message ||
        'Unable to verify your login.',
    )
  }

  if (!user) {
    throw new Error(
      'Please login before submitting a fashion enquiry.',
    )
  }

  /*
   * =========================================================
   * CLEAN INPUT
   * =========================================================
   */

  const name =
    input.name.trim()

  const phone =
    input.phone.trim()

  const email =
    input.email?.trim() || null

  const designType =
    input.designType.trim()

  /*
   * =========================================================
   * VALIDATION
   * =========================================================
   */

  if (!name) {
    throw new Error(
      'Name is required.',
    )
  }

  if (!phone) {
    throw new Error(
      'Phone number is required.',
    )
  }

  if (!designType) {
    throw new Error(
      'Design type is required.',
    )
  }

  /*
   * =========================================================
   * CREATE NEW ENQUIRY
   * =========================================================
   */

  const {
    error,
  } = await supabase
    .from(
      'custom_design_enquiries',
    )
    .insert({
      customer_id:
        user.id,

      name,

      phone,

      email,

      design_type:
        designType,

      requirements:
        input.requirements,

      preferred_date:
        input.preferredDate ||
        null,

      reference_image_url:
        input.referenceImageUrl?.trim() ||
        null,

      additional_notes:
        input.additionalNotes?.trim() ||
        null,

      status:
        'new',
    })

  if (error) {
    throw new Error(
      error.message ||
        'Unable to submit custom design enquiry.',
    )
  }

  return {
    success: true,
  }
}