const CART_KEY = 'wildfloral_booking_cart'

export type BookingCartItem = {
  serviceId: string
  quantity: number
}

function isBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

export function getBookingCart(): BookingCartItem[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const stored =
      window.localStorage.getItem(
        CART_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.serviceId ===
          'string' &&
        typeof item.quantity ===
          'number' &&
        item.quantity > 0,
    )
  } catch {
    return []
  }
}

export function saveBookingCart(
  cart: BookingCartItem[],
) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart),
  )
}

export function addToBookingCart(
  serviceId: string,
) {
  const cart =
    getBookingCart()

  const existing =
    cart.find(
      (item) =>
        item.serviceId ===
        serviceId,
    )

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      serviceId,
      quantity: 1,
    })
  }

  saveBookingCart(cart)

  return cart
}

export function removeFromBookingCart(
  serviceId: string,
) {
  const cart =
    getBookingCart().filter(
      (item) =>
        item.serviceId !==
        serviceId,
    )

  saveBookingCart(cart)

  return cart
}

export function updateBookingCartQuantity(
  serviceId: string,
  quantity: number,
) {
  const cart =
    getBookingCart()

  const item =
    cart.find(
      (entry) =>
        entry.serviceId ===
        serviceId,
    )

  if (!item) {
    return cart
  }

  if (quantity <= 0) {
    return removeFromBookingCart(
      serviceId,
    )
  }

  item.quantity = quantity

  saveBookingCart(cart)

  return cart
}

export function clearBookingCart() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(
    CART_KEY,
  )
}

export function getBookingCartCount() {
  return getBookingCart().reduce(
    (total, item) =>
      total + item.quantity,
    0,
  )
}

export function hasBookingCartItems() {
  return (
    getBookingCart().length > 0
  )
}