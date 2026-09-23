const FASHION_CART_KEY = 'wildfloral_fashion_cart'

export type FashionCartItem = {
  designId: string
  designSizeId: string
  size: string
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
   CLEAN ID
========================================================= */

function cleanId(value: string): string {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

/* =========================================================
   CLEAN CART
========================================================= */

function cleanCart(
  cart: FashionCartItem[],
): FashionCartItem[] {
  const result: FashionCartItem[] = []

  for (const item of cart) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const designId = cleanId(item.designId)
    const designSizeId = cleanId(item.designSizeId)
    const size = cleanId(item.size)

    const quantity = Math.floor(
      Number(item.quantity),
    )

    if (
      !designId ||
      !designSizeId ||
      !size ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      continue
    }

    const existing = result.find(
      (entry) =>
        entry.designId === designId &&
        entry.designSizeId === designSizeId,
    )

    if (existing) {
      existing.quantity += quantity
    } else {
      result.push({
        designId,
        designSizeId,
        size,
        quantity,
      })
    }
  }

  return result
}

/* =========================================================
   GET FASHION CART
========================================================= */

export function getFashionCart(): FashionCartItem[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const stored =
      window.localStorage.getItem(
        FASHION_CART_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed: unknown =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return cleanCart(
      parsed as FashionCartItem[],
    )
  } catch {
    return []
  }
}

/* =========================================================
   SAVE FASHION CART
========================================================= */

export function saveFashionCart(
  cart: FashionCartItem[],
): void {
  if (!isBrowser()) {
    return
  }

  const cleaned = cleanCart(cart)

  window.localStorage.setItem(
    FASHION_CART_KEY,
    JSON.stringify(cleaned),
  )
}

/* =========================================================
   ADD TO FASHION CART
========================================================= */

export function addToFashionCart(
  item: FashionCartItem,
): FashionCartItem[] {
  const designId = cleanId(item.designId)
  const designSizeId = cleanId(
    item.designSizeId,
  )
  const size = cleanId(item.size)

  const quantity = Math.floor(
    Number(item.quantity),
  )

  if (
    !designId ||
    !designSizeId ||
    !size ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return getFashionCart()
  }

  const cart = getFashionCart()

  const existing = cart.find(
    (entry) =>
      entry.designId === designId &&
      entry.designSizeId === designSizeId,
  )

  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({
      designId,
      designSizeId,
      size,
      quantity,
    })
  }

  saveFashionCart(cart)

  return getFashionCart()
}

/* =========================================================
   REMOVE FROM FASHION CART
========================================================= */

export function removeFromFashionCart(
  designId: string,
  designSizeId: string,
): FashionCartItem[] {
  const cleanDesignId =
    cleanId(designId)

  const cleanDesignSizeId =
    cleanId(designSizeId)

  if (
    !cleanDesignId ||
    !cleanDesignSizeId
  ) {
    return getFashionCart()
  }

  const cart = getFashionCart().filter(
    (item) =>
      !(
        item.designId === cleanDesignId &&
        item.designSizeId ===
          cleanDesignSizeId
      ),
  )

  saveFashionCart(cart)

  return getFashionCart()
}

/* =========================================================
   UPDATE QUANTITY
========================================================= */

export function updateFashionCartQuantity(
  designId: string,
  designSizeId: string,
  quantity: number,
): FashionCartItem[] {
  const cleanDesignId =
    cleanId(designId)

  const cleanDesignSizeId =
    cleanId(designSizeId)

  if (
    !cleanDesignId ||
    !cleanDesignSizeId
  ) {
    return getFashionCart()
  }

  const nextQuantity = Math.floor(
    Number(quantity),
  )

  if (
    !Number.isFinite(nextQuantity) ||
    nextQuantity <= 0
  ) {
    return removeFromFashionCart(
      cleanDesignId,
      cleanDesignSizeId,
    )
  }

  const cart = getFashionCart()

  const item = cart.find(
    (entry) =>
      entry.designId === cleanDesignId &&
      entry.designSizeId ===
        cleanDesignSizeId,
  )

  if (!item) {
    return cart
  }

  item.quantity = nextQuantity

  saveFashionCart(cart)

  return getFashionCart()
}

/* =========================================================
   INCREASE QUANTITY
========================================================= */

export function increaseFashionCartQuantity(
  designId: string,
  designSizeId: string,
): FashionCartItem[] {
  const cart = getFashionCart()

  const item = cart.find(
    (entry) =>
      entry.designId === designId &&
      entry.designSizeId === designSizeId,
  )

  if (!item) {
    return cart
  }

  return updateFashionCartQuantity(
    designId,
    designSizeId,
    item.quantity + 1,
  )
}

/* =========================================================
   DECREASE QUANTITY
========================================================= */

export function decreaseFashionCartQuantity(
  designId: string,
  designSizeId: string,
): FashionCartItem[] {
  const cart = getFashionCart()

  const item = cart.find(
    (entry) =>
      entry.designId === designId &&
      entry.designSizeId === designSizeId,
  )

  if (!item) {
    return cart
  }

  return updateFashionCartQuantity(
    designId,
    designSizeId,
    item.quantity - 1,
  )
}

/* =========================================================
   CLEAR FASHION CART
========================================================= */

export function clearFashionCart(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(
    FASHION_CART_KEY,
  )
}

/* =========================================================
   CART COUNT
========================================================= */

export function getFashionCartCount(): number {
  return getFashionCart().reduce(
    (total, item) =>
      total + item.quantity,
    0,
  )
}

/* =========================================================
   HAS ITEMS
========================================================= */

export function hasFashionCartItems(): boolean {
  return getFashionCart().length > 0
}