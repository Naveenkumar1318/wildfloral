export type BookingMode =
  | 'booking'
  | 'enquiry'

export type BookingStep =
  | 1
  | 2
  | 3
  | 4
  | 5

export function startBookingFlow(
  mode: BookingMode = 'booking',
): void {
  sessionStorage.setItem(
    'booking_mode',
    mode,
  )

  sessionStorage.setItem(
    'booking_step',
    '1',
  )
}

export function setBookingMode(
  mode: BookingMode,
): void {
  sessionStorage.setItem(
    'booking_mode',
    mode,
  )
}

export function getBookingMode(): BookingMode {
  const value =
    sessionStorage.getItem(
      'booking_mode',
    )

  return value === 'enquiry'
    ? 'enquiry'
    : 'booking'
}

export function setBookingStep(
  step: BookingStep,
): void {
  sessionStorage.setItem(
    'booking_step',
    String(step),
  )
}

export function getBookingStep(): BookingStep {
  const value = Number(
    sessionStorage.getItem(
      'booking_step',
    ),
  )

  if (
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  ) {
    return value
  }

  return 1
}