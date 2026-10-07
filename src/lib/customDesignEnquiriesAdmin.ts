import { supabase } from './supabase'

export type CustomDesignEnquiry = {
  id: string
  customer_id: string | null
  name: string
  phone: string
  email: string | null
  design_type: string
  requirements: Record<string, string>
  preferred_date: string | null
  reference_image_url: string | null
  additional_notes: string | null
  status:
    | 'new'
    | 'contacted'
    | 'in_progress'
    | 'accepted'
    | 'rejected'
    | 'closed'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export async function getCustomDesignEnquiries() {
  const { data, error } = await supabase
    .from('custom_design_enquiries')
    .select('*')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      error.message ||
        'Unable to load custom design enquiries.',
    )
  }

  return (data ?? []) as CustomDesignEnquiry[]
}

export async function updateCustomDesignEnquiry(
  id: string,
  input: {
    status?: CustomDesignEnquiry['status']
    adminNotes?: string
  },
) {
  const updateData: Record<string, unknown> = {}

  if (input.status !== undefined) {
    updateData.status = input.status
  }

  if (input.adminNotes !== undefined) {
    updateData.admin_notes =
      input.adminNotes.trim() || null
  }

  const { data, error } = await supabase
    .from('custom_design_enquiries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Unable to update custom design enquiry.',
    )
  }

  return data as CustomDesignEnquiry
}