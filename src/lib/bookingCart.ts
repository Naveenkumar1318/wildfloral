const CART_KEY = 'wildfloral_booking_cart'

export type BookingCartItem = {
  serviceId: string
  quantity: number
}

/* =========================================================
   BROWSER CHECK
========================================================= */

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

/* =========================================================
   CLEAN SERVICE ID
========================================================= */

function cleanServiceId(
  serviceId: string,
): string {
  return typeof serviceId === 'string'
    ? serviceId.trim()
    : ''
}

/* =========================================================
   CLEAN CART
========================================================= */

function cleanCart(
  cart: BookingCartItem[],
): BookingCartItem[] {
  const result: BookingCartItem[] = []

  for (const item of cart) {
    if (
      !item ||
      typeof item.serviceId !== 'string'
    ) {
      continue
    }

    const serviceId =
      cleanServiceId(item.serviceId)

    if (!serviceId) {
      continue
    }

    const quantity = Math.floor(
      Number(item.quantity),
    )

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      continue
    }

    const existing =
      result.find(
        (entry) =>
          entry.serviceId ===
          serviceId,
      )

    if (existing) {
      existing.quantity += quantity
    } else {
      result.push({
        serviceId,
        quantity,
      })
    }
  }

  return result
}

/* =========================================================
   GET CART
========================================================= */

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

    const parsed: unknown =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    const validItems =
      parsed.filter(
        (
          item,
        ): item is BookingCartItem => {
          if (
            !item ||
            typeof item !== 'object'
          ) {
            return false
          }

          const value =
            item as Partial<BookingCartItem>

          return (
            typeof value.serviceId ===
              'string' &&
            value.serviceId.trim()
              .length > 0 &&
            typeof value.quantity ===
              'number' &&
            Number.isFinite(
              value.quantity,
            ) &&
            value.quantity > 0
          )
        },
      )

    return cleanCart(validItems)
  } catch {
    return []
  }
}

/* =========================================================
   SAVE CART
========================================================= */

export function saveBookingCart(
  cart: BookingCartItem[],
): void {
  if (!isBrowser()) {
    return
  }

  const cleaned =
    cleanCart(cart)

  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(cleaned),
  )
}

/* =========================================================
   ADD SERVICE
========================================================= */

export function addToBookingCart(
  serviceId: string,
): BookingCartItem[] {
  const cleanId =
    cleanServiceId(serviceId)

  if (!cleanId) {
    return getBookingCart()
  }

  const cart =
    getBookingCart()

  const existing =
    cart.find(
      (item) =>
        item.serviceId ===
        cleanId,
    )

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      serviceId: cleanId,
      quantity: 1,
    })
  }

  saveBookingCart(cart)

  return getBookingCart()
}

/* =========================================================
   REMOVE SERVICE
========================================================= */

export function removeFromBookingCart(
  serviceId: string,
): BookingCartItem[] {
  const cleanId =
    cleanServiceId(serviceId)

  if (!cleanId) {
    return getBookingCart()
  }

  const cart =
    getBookingCart().filter(
      (item) =>
        item.serviceId !== cleanId,
    )

  saveBookingCart(cart)

  return getBookingCart()
}

/* =========================================================
   UPDATE QUANTITY
========================================================= */

export function updateBookingCartQuantity(
  serviceId: string,
  quantity: number,
): BookingCartItem[] {
  const cleanId =
    cleanServiceId(serviceId)

  if (!cleanId) {
    return getBookingCart()
  }

  const cart =
    getBookingCart()

  const item =
    cart.find(
      (entry) =>
        entry.serviceId ===
        cleanId,
    )

  if (!item) {
    return cart
  }

  const nextQuantity =
    Math.floor(
      Number(quantity),
    )

  if (
    !Number.isFinite(
      nextQuantity,
    ) ||
    nextQuantity <= 0
  ) {
    return removeFromBookingCart(
      cleanId,
    )
  }

  item.quantity =
    nextQuantity

  saveBookingCart(cart)

  return getBookingCart()
}

/* =========================================================
   INCREASE QUANTITY
========================================================= */

export function increaseBookingCartQuantity(
  serviceId: string,
): BookingCartItem[] {
  const cleanId =
    cleanServiceId(serviceId)

  if (!cleanId) {
    return getBookingCart()
  }

  const item =
    getBookingCart().find(
      (entry) =>
        entry.serviceId ===
        cleanId,
    )

  if (!item) {
    return addToBookingCart(
      cleanId,
    )
  }

  return updateBookingCartQuantity(
    cleanId,
    item.quantity + 1,
  )
}

/* =========================================================
   DECREASE QUANTITY
========================================================= */

export function decreaseBookingCartQuantity(
  serviceId: string,
): BookingCartItem[] {
  const cleanId =
    cleanServiceId(serviceId)

  if (!cleanId) {
    return getBookingCart()
  }

  const item =
    getBookingCart().find(
      (entry) =>
        entry.serviceId ===
        cleanId,
    )

  if (!item) {
    return getBookingCart()
  }

  return updateBookingCartQuantity(
    cleanId,
    item.quantity - 1,
  )
}

/* =========================================================
   CLEAR CART
========================================================= */

export function clearBookingCart(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(
    CART_KEY,
  )
}

/* =========================================================
   CART COUNT
========================================================= */

export function getBookingCartCount(): number {
  return getBookingCart().reduce(
    (total, item) =>
      total + item.quantity,
    0,
  )
}

/* =========================================================
   HAS ITEMS
========================================================= */

export function hasBookingCartItems(): boolean {
  return getBookingCart().length > 0
}

/* =========================================================
   SERVICE IDS
========================================================= */

export function getBookingCartServiceIds(): string[] {
  return [
    ...new Set(
      getBookingCart().map(
        (item) =>
          item.serviceId,
      ),
    ),
  ]
}