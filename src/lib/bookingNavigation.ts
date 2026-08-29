import {
  BookingMode,
  setBookingMode,
  setSelectedServices,
} from './bookingFlow'

export function getAuthRedirect(
  mode: BookingMode,
) {
  return mode === 'booking'
    ? '/booking'
    : '/enquiry'
}

export function startBookingFlow(
  mode: BookingMode,
  serviceIds: string[],
  isAuthenticated: boolean,
) {
  setBookingMode(mode)
  setSelectedServices(serviceIds)

  const destination =
    getAuthRedirect(mode)

  if (isAuthenticated) {
    return destination
  }

  return `/login?redirect=${encodeURIComponent(
    destination,
  )}`
}