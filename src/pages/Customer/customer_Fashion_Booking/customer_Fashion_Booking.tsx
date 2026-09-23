import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './customer_Fashion_Booking.css'

/* =========================================================
   TYPES
========================================================= */

type FashionOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled'

type FashionPaymentStatus = string

type FashionOrder = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subtotal: number | string
  discount_amount: number | string
  total_amount: number | string
  status: FashionOrderStatus
  shipping_address: string | null
  shipping_city: string | null
  shipping_pincode: string | null
  notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

type FashionOrderItem = {
  id: string
  order_id: string
  design_id: string
  design_size_id: string
  design_name: string
  size: string
  quantity: number | string
  unit_price: number | string
  discount_amount: number | string
  final_price: number | string
  created_at: string
}

type FashionOrderPayment = {
  id: string
  order_id: string
  payment_method: string
  amount: number | string
  transaction_reference: string | null
  status: FashionPaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

type FashionDesignImage = {
  id: string
  design_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

type OrderWithRelations = FashionOrder & {
  items: FashionOrderItem[]
  payment: FashionOrderPayment | null
  imagesByDesign: Record<
    string,
    FashionDesignImage | undefined
  >
}

type FilterValue =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled'

type SortValue =
  | 'latest'
  | 'oldest'
  | 'amount-high'
  | 'amount-low'

/* =========================================================
   CONSTANTS
========================================================= */

const REFRESH_INTERVAL = 30_000
const ORDERS_PER_PAGE = 5
const FASHION_IMAGE_BUCKET = 'fashion-images'

const STATUS_FILTERS: {
  value: FilterValue
  label: string
}[] = [
  {
    value: 'all',
    label: 'All Orders',
  },
  {
    value: 'pending',
    label: 'Pending',
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
  },
  {
    value: 'processing',
    label: 'Processing',
  },
  {
    value: 'ready',
    label: 'Ready',
  },
  {
    value: 'delivered',
    label: 'Delivered',
  },
  {
    value: 'completed',
    label: 'Completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
  },
]

const SORT_OPTIONS: {
  value: SortValue
  label: string
}[] = [
  {
    value: 'latest',
    label: 'Latest First',
  },
  {
    value: 'oldest',
    label: 'Oldest First',
  },
  {
    value: 'amount-high',
    label: 'Highest Amount',
  },
  {
    value: 'amount-low',
    label: 'Lowest Amount',
  },
]

const ORDER_STEPS = [
  {
    key: 'pending',
    label: 'Order Pending',
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
  },
  {
    key: 'processing',
    label: 'Order Processing',
  },
  {
    key: 'ready',
    label: 'Order Ready',
  },
  {
    key: 'delivered',
    label: 'Order Delivered',
  },
  {
    key: 'completed',
    label: 'Order Completed',
  },
]

/* =========================================================
   ICONS
========================================================= */

function ShoppingBagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M6 8.5h12l1 12H5l1-12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 9V6.8a3 3 0 0 1 6 0V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m12 3 8 4.3v9.4L12 21l-8-4.3V7.3L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="m4.5 7.5 7.5 4 7.5-4M12 11.5V21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7v5l3.2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M20 11a8 8 0 0 0-14.7-4.2L4 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M4 5v4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 13a8 8 0 0 0 14.7 4.2L20 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M20 19v-4h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon({
  open,
}: {
  open: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={open ? 'open' : ''}
    >
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m14.5 6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m9.5 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M19 10.5c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 1 1 14 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="10.5"
        r="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M4 9h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M7 14h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

function toNumber(
  value: number | string | null | undefined,
): number {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(
    Number.isFinite(value)
      ? value
      : 0,
  )
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date)
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function normalizeStatus(
  status:
    | string
    | null
    | undefined,
): string {
  return (
    status
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, '_') ??
    'pending'
  )
}

function formatStatusLabel(
  status: string,
): string {
  return status
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}

function getOrderStatusClass(
  status: string,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case 'confirmed':
      return 'confirmed'

    case 'processing':
      return 'processing'

    case 'ready':
      return 'ready'

    case 'delivered':
      return 'delivered'

    case 'completed':
      return 'completed'

    case 'cancelled':
    case 'canceled':
      return 'cancelled'

    case 'pending':
    default:
      return 'pending'
  }
}

function getPaymentStatusClass(
  status: string,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case 'paid':
    case 'verified':
    case 'approved':
      return 'verified'

    case 'rejected':
    case 'failed':
      return 'rejected'

    case 'pending':
    default:
      return 'pending'
  }
}

function getPaymentStatusLabel(
  status: string,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case 'paid':
      return 'Payment Paid'

    case 'verified':
    case 'approved':
      return 'Payment Verified'

    case 'rejected':
      return 'Payment Rejected'

    case 'failed':
      return 'Payment Failed'

    case 'pending':
    default:
      return 'Payment Pending'
  }
}

function getStatusDescription(
  status: string,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case 'confirmed':
      return 'Your order has been confirmed and is being prepared.'

    case 'processing':
      return 'Your fashion order is currently being prepared.'

    case 'ready':
      return 'Your order is ready for delivery or collection.'

    case 'delivered':
      return 'Your fashion order has been delivered.'

    case 'completed':
      return 'Your fashion order has been completed.'

    case 'cancelled':
    case 'canceled':
      return 'This fashion order has been cancelled.'

    case 'pending':
    default:
      return 'Your order has been received and is awaiting confirmation.'
  }
}

function getStatusStepIndex(
  status: string,
): number {
  const normalized =
    normalizeStatus(status)

  if (
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return -1
  }

  const index =
    ORDER_STEPS.findIndex(
      (step) =>
        step.key === normalized,
    )

  return index === -1
    ? 0
    : index
}

/*
 * image_url is normally stored as the public
 * Supabase Storage URL by the admin fashion
 * design form.
 *
 * This also supports an old record containing
 * only the storage path.
 */
function getFashionImageUrl(
  imageUrl:
    | string
    | null
    | undefined,
): string | null {
  if (!imageUrl) {
    return null
  }

  const value =
    imageUrl.trim()

  if (!value) {
    return null
  }

  if (
    /^https?:\/\//i.test(value)
  ) {
    return value
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        FASHION_IMAGE_BUCKET,
      )
      .getPublicUrl(value)

  return data.publicUrl || null
}

/*
 * IMPORTANT:
 *
 * Older orders currently have:
 *   item.discount_amount = 0
 *   item.final_price = original line total
 *
 * while the real discount is stored on the
 * parent fashion_orders row.
 *
 * Therefore we:
 *
 * 1. Prefer an explicit item discount when
 *    available.
 * 2. Otherwise use an already-discounted
 *    final_price when it is actually lower.
 * 3. Otherwise allocate the order-level
 *    discount proportionally across items.
 *
 * This keeps the displayed total consistent
 * with the order total for existing orders.
 */
function getItemPricing(
  order: FashionOrder,
  item: FashionOrderItem,
) {
  const quantity =
    Math.max(
      0,
      toNumber(item.quantity),
    )

  const unitPrice =
    Math.max(
      0,
      toNumber(item.unit_price),
    )

  const originalLineTotal =
    unitPrice * quantity

  const storedDiscount =
    Math.max(
      0,
      toNumber(
        item.discount_amount,
      ),
    )

  const storedFinalPrice =
    Math.max(
      0,
      toNumber(
        item.final_price,
      ),
    )

  let discountAmount =
    storedDiscount

  let paidLineTotal =
    originalLineTotal

  /*
   * Future-proof:
   * if the database already contains
   * an actual item-level discounted
   * final price, use it.
   */
  if (
    discountAmount === 0 &&
    storedFinalPrice > 0 &&
    storedFinalPrice <
      originalLineTotal
  ) {
    paidLineTotal =
      storedFinalPrice

    discountAmount =
      Math.max(
        0,
        originalLineTotal -
          paidLineTotal,
      )
  } else if (
    discountAmount > 0
  ) {
    paidLineTotal =
      Math.max(
        0,
        originalLineTotal -
          discountAmount,
      )
  } else {
    /*
     * Existing orders:
     * distribute the order discount
     * proportionally.
     */
    const orderSubtotal =
      toNumber(
        order.subtotal,
      )

    const orderDiscount =
      toNumber(
        order.discount_amount,
      )

    if (
      orderSubtotal > 0 &&
      orderDiscount > 0 &&
      originalLineTotal > 0
    ) {
      discountAmount =
        Math.min(
          originalLineTotal,
          (
            originalLineTotal /
            orderSubtotal
          ) *
            orderDiscount,
        )

      paidLineTotal =
        Math.max(
          0,
          originalLineTotal -
            discountAmount,
        )
    } else {
      /*
       * No discount.
       *
       * Current checkout code stores
       * final_price as lineTotal.
       */
      paidLineTotal =
        storedFinalPrice > 0
          ? storedFinalPrice
          : originalLineTotal
    }
  }

  const paidUnitPrice =
    quantity > 0
      ? paidLineTotal /
        quantity
      : 0

  return {
    quantity,
    unitPrice,
    originalLineTotal,
    discountAmount,
    paidLineTotal,
    paidUnitPrice,
    hasDiscount:
      discountAmount > 0,
  }
}

/* =========================================================
   PAGE
========================================================= */

function CustomerFashionBooking() {
  const navigate =
    useNavigate()

  const [
    orders,
    setOrders,
  ] =
    useState<
      OrderWithRelations[]
    >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterValue>(
      'all',
    )

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortValue>(
      'latest',
    )

  const [
    sortOpen,
    setSortOpen,
  ] = useState(false)

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] =
    useState<
      string | null
    >(null)

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders =
    useCallback(
      async (
        silent = false,
      ) => {
        if (silent) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError('')

        try {
          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser()

          if (
            userError ||
            !user
          ) {
            navigate(
              '/login?redirect=/account/bookings/fashion',
              {
                replace: true,
              },
            )

            return
          }

          /*
           * =================================================
           * ORDERS
           * =================================================
           */

          const {
            data: orderData,
            error:
              orderError,
          } =
            await supabase
              .from(
                'fashion_orders',
              )
              .select(`
                id,
                order_number,
                customer_name,
                customer_email,
                customer_phone,
                subtotal,
                discount_amount,
                total_amount,
                status,
                shipping_address,
                shipping_city,
                shipping_pincode,
                notes,
                cancellation_reason,
                created_at,
                updated_at
              `)
              .eq(
                'customer_id',
                user.id,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (
            orderError
          ) {
            throw orderError
          }

          const loadedOrders =
            (orderData ??
              []) as FashionOrder[]

          if (
            loadedOrders.length ===
            0
          ) {
            setOrders([])
            return
          }

          const orderIds =
            loadedOrders.map(
              (order) =>
                order.id,
            )

          /*
           * =================================================
           * ITEMS + PAYMENTS
           * =================================================
           */

          const [
            itemsResult,
            paymentsResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'fashion_order_items',
                )
                .select(`
                  id,
                  order_id,
                  design_id,
                  design_size_id,
                  design_name,
                  size,
                  quantity,
                  unit_price,
                  discount_amount,
                  final_price,
                  created_at
                `)
                .in(
                  'order_id',
                  orderIds,
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      true,
                  },
                ),

              supabase
                .from(
                  'fashion_order_payments',
                )
                .select(`
                  id,
                  order_id,
                  payment_method,
                  amount,
                  transaction_reference,
                  status,
                  created_at,
                  updated_at
                `)
                .in(
                  'order_id',
                  orderIds,
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  },
                ),
            ])

          if (
            itemsResult.error
          ) {
            throw itemsResult.error
          }

          /*
           * Payment SELECT is deliberately
           * non-blocking.
           *
           * If payment RLS is not configured
           * yet, the order page still loads and
           * shows Payment Pending.
           */
          const items =
            (itemsResult.data ??
              []) as FashionOrderItem[]

          const payments =
            paymentsResult.error
              ? []
              : (paymentsResult.data ??
                  []) as FashionOrderPayment[]

          const paidOrderIds =
            new Set(
              payments
                .filter(
                  (payment) =>
                    payment.status === 'paid',
                )
                .map(
                  (payment) =>
                    payment.order_id,
                ),
            )

          const visibleOrders =
            loadedOrders.filter(
              (order) =>
                order.status !== 'pending' ||
                paidOrderIds.has(
                  order.id,
                ),
            )

          if (
            paymentsResult.error
          ) {
            console.warn(
              'Fashion payment records could not be read:',
              paymentsResult.error,
            )
          }

          /*
           * =================================================
           * LOAD DESIGN IMAGES
           * =================================================
           */

          const designIds = [
            ...new Set(
              items
                .map(
                  (item) =>
                    item.design_id,
                )
                .filter(Boolean),
            ),
          ]

          let designImages: FashionDesignImage[] =
            []

          if (
            designIds.length > 0
          ) {
            const {
              data:
                imageData,
              error:
                imageError,
            } =
              await supabase
                .from(
                  'fashion_design_images',
                )
                .select(`
                  id,
                  design_id,
                  image_url,
                  alt_text,
                  display_order,
                  is_primary
                `)
                .in(
                  'design_id',
                  designIds,
                )
                .order(
                  'is_primary',
                  {
                    ascending:
                      false,
                  },
                )
                .order(
                  'display_order',
                  {
                    ascending:
                      true,
                  },
                )

            if (
              imageError
            ) {
              throw imageError
            }

            designImages =
              (imageData ??
                []) as FashionDesignImage[]
          }

          /*
           * =================================================
           * MAP PRIMARY IMAGE PER DESIGN
           * =================================================
           */

          const imagesByDesign =
            new Map<
              string,
              FashionDesignImage
            >()

          for (
            const image of designImages
          ) {
            if (
              !imagesByDesign.has(
                image.design_id,
              )
            ) {
              imagesByDesign.set(
                image.design_id,
                image,
              )
            }
          }

          /*
           * =================================================
           * MAP ITEMS BY ORDER
           * =================================================
           */

          const itemsByOrder =
            new Map<
              string,
              FashionOrderItem[]
            >()

          for (
            const item of items
          ) {
            const current =
              itemsByOrder.get(
                item.order_id,
              ) ?? []

            current.push(item)

            itemsByOrder.set(
              item.order_id,
              current,
            )
          }

          /*
           * =================================================
           * MAP LATEST PAYMENT
           * =================================================
           */

          const paymentByOrder =
            new Map<
              string,
              FashionOrderPayment
            >()

          for (
            const payment of payments
          ) {
            if (
              !paymentByOrder.has(
                payment.order_id,
              )
            ) {
              paymentByOrder.set(
                payment.order_id,
                payment,
              )
            }
          }

          /*
           * =================================================
           * COMBINE
           * =================================================
           */

          const combinedOrders =
            visibleOrders.map(
              (order) => {
                const orderItems =
                  itemsByOrder.get(
                    order.id,
                  ) ?? []

                const orderImages: Record<
                  string,
                  FashionDesignImage | undefined
                > = {}

                for (
                  const item of orderItems
                ) {
                  orderImages[
                    item.design_id
                  ] =
                    imagesByDesign.get(
                      item.design_id,
                    )
                }

                return {
                  ...order,
                  items:
                    orderItems,
                  payment:
                    paymentByOrder.get(
                      order.id,
                    ) ?? null,
                  imagesByDesign:
                    orderImages,
                }
              },
            )

          setOrders(
            combinedOrders,
          )
        } catch (
          loadError
        ) {
          console.error(
            'Customer fashion orders load error:',
            loadError,
          )

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load your fashion orders.',
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      [navigate],
    )

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadOrders(false)
  }, [
    loadOrders,
  ])

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => {
          void loadOrders(true)
        },
        REFRESH_INTERVAL,
      )

    return () => {
      window.clearInterval(
        intervalId,
      )
    }
  }, [
    loadOrders,
  ])

  /* =======================================================
     REFRESH WHEN TAB BECOMES ACTIVE
  ======================================================= */

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        void loadOrders(true)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [
    loadOrders,
  ])

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const processedOrders =
    useMemo(() => {
      let result =
        [...orders]

      if (
        activeFilter !==
        'all'
      ) {
        result =
          result.filter(
            (order) => {
              const status =
                normalizeStatus(
                  order.status,
                )

              if (
                activeFilter ===
                'cancelled'
              ) {
                return (
                  status ===
                    'cancelled' ||
                  status ===
                    'canceled'
                )
              }

              return (
                status ===
                activeFilter
              )
            },
          )
      }

      result.sort(
        (a, b) => {
          switch (
            sortBy
          ) {
            case 'oldest':
              return (
                new Date(
                  a.created_at,
                ).getTime() -
                new Date(
                  b.created_at,
                ).getTime()
              )

            case 'amount-high':
              return (
                toNumber(
                  b.total_amount,
                ) -
                toNumber(
                  a.total_amount,
                )
              )

            case 'amount-low':
              return (
                toNumber(
                  a.total_amount,
                ) -
                toNumber(
                  b.total_amount,
                )
              )

            case 'latest':
            default:
              return (
                new Date(
                  b.created_at,
                ).getTime() -
                new Date(
                  a.created_at,
                ).getTime()
              )
          }
        },
      )

      return result
    }, [
      orders,
      activeFilter,
      sortBy,
    ])

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        processedOrders.length /
          ORDERS_PER_PAGE,
      ),
    )

  const paginatedOrders =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ORDERS_PER_PAGE

      return processedOrders.slice(
        start,
        start +
          ORDERS_PER_PAGE,
      )
    }, [
      processedOrders,
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
    setExpandedOrderId(null)
  }, [
    activeFilter,
    sortBy,
  ])

  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const statusCounts =
    useMemo(() => {
      return {
        all:
          orders.length,

        pending:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'pending',
          ).length,

        confirmed:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'confirmed',
          ).length,

        processing:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'processing',
          ).length,

        ready:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'ready',
          ).length,

        delivered:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'delivered',
          ).length,

        completed:
          orders.filter(
            (order) =>
              normalizeStatus(
                order.status,
              ) ===
              'completed',
          ).length,

        cancelled:
          orders.filter(
            (order) => {
              const status =
                normalizeStatus(
                  order.status,
                )

              return (
                status ===
                  'cancelled' ||
                status ===
                  'canceled'
              )
            },
          ).length,
      }
    }, [
      orders,
    ])

  /* =======================================================
     PAGINATION NUMBERS
  ======================================================= */

  const pageNumbers =
    useMemo(() => {
      if (
        totalPages <= 5
      ) {
        return Array.from(
          {
            length:
              totalPages,
          },
          (_, index) =>
            index + 1,
        )
      }

      if (
        currentPage <= 3
      ) {
        return [
          1,
          2,
          3,
          4,
          totalPages,
        ]
      }

      if (
        currentPage >=
        totalPages - 2
      ) {
        return [
          1,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ]
      }

      return [
        1,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        totalPages,
      ]
    }, [
      currentPage,
      totalPages,
    ])

  /* =======================================================
     TOGGLE DETAILS
  ======================================================= */

  function toggleOrder(
    orderId: string,
  ) {
    setExpandedOrderId(
      (current) =>
        current === orderId
          ? null
          : orderId,
    )
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="customer-fashion-booking-page">
        <section className="customer-fashion-loading">
          <div className="customer-fashion-spinner" />

          <strong>
            Loading your fashion orders...
          </strong>

          <p>
            Please wait while we fetch your latest orders.
          </p>
        </section>
      </main>
    )
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    orders.length === 0
  ) {
    return (
      <main className="customer-fashion-booking-page">
        <section className="customer-fashion-error">
          <div>
            <strong>
              Unable to load orders
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadOrders(false)
            }
          >
            Try Again
          </button>
        </section>
      </main>
    )
  }

  /* =======================================================
     EMPTY ORDERS
  ======================================================= */

  if (
    !error &&
    orders.length === 0
  ) {
    return (
      <main className="customer-fashion-booking-page">
        <section className="customer-fashion-empty">
          <div className="customer-fashion-empty-icon">
            <ShoppingBagIcon />
          </div>

          <span>
            FASHION SERVICES
          </span>

          <h1>
            No Fashion Orders Yet
          </h1>

          <p>
            Your fashion orders will
            appear here after you
            complete a purchase.
          </p>

          <Link
            to="/fashion"
            className="customer-fashion-empty-button"
          >
            Explore Fashion
          </Link>
        </section>
      </main>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="customer-fashion-booking-page">

      {/* ===================================================
         HEADER
      =================================================== */}

      <section className="customer-fashion-header">

        <div className="customer-fashion-header-copy">

          <span className="customer-fashion-eyebrow">
            FASHION SERVICES
          </span>

          <h1>
            My Fashion Orders
          </h1>

          <p>
            View your fashion purchases,
            payment status, delivery details,
            and order progress.
          </p>

        </div>

        <div className="customer-fashion-header-actions">

          <button
            type="button"
            className="customer-fashion-refresh-button"
            onClick={() =>
              void loadOrders(true)
            }
            disabled={refreshing}
          >
            <RefreshIcon />

            <span>
              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </span>
          </button>

          <Link
            to="/fashion"
            className="customer-fashion-shop-button"
          >
            Explore Fashion
          </Link>

        </div>

      </section>

      {/* ===================================================
         SUMMARY
      =================================================== */}

      <section className="customer-fashion-summary">

        <div className="customer-fashion-summary-card">
          <span className="customer-fashion-summary-icon">
            <ShoppingBagIcon />
          </span>

          <div>
            <strong>
              {statusCounts.all}
            </strong>

            <span>
              Total Orders
            </span>
          </div>
        </div>

        <div className="customer-fashion-summary-card">
          <span className="customer-fashion-summary-icon">
            <ClockIcon />
          </span>

          <div>
            <strong>
              {statusCounts.pending}
            </strong>

            <span>
              Pending
            </span>
          </div>
        </div>

        <div className="customer-fashion-summary-card">
          <span className="customer-fashion-summary-icon">
            <PackageIcon />
          </span>

          <div>
            <strong>
              {
                statusCounts.processing +
                statusCounts.ready
              }
            </strong>

            <span>
              In Progress
            </span>
          </div>
        </div>

        <div className="customer-fashion-summary-card">
          <span className="customer-fashion-summary-icon">
            <CheckIcon />
          </span>

          <div>
            <strong>
              {statusCounts.completed}
            </strong>

            <span>
              Completed
            </span>
          </div>
        </div>

      </section>

      {/* ===================================================
         FILTER + SORT
      =================================================== */}

      <section className="customer-fashion-controls">

        <div className="customer-fashion-filter-area">

          <div className="customer-fashion-filter-heading">
            <span>
              YOUR ORDERS
            </span>

            <strong>
              {processedOrders.length}{' '}
              {processedOrders.length ===
              1
                ? 'Order'
                : 'Orders'}
            </strong>
          </div>

          <div className="customer-fashion-filter-list">

            {STATUS_FILTERS.map(
              (filter) => (
                <button
                  key={
                    filter.value
                  }
                  type="button"
                  className={
                    activeFilter ===
                    filter.value
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter.value,
                    )
                  }
                >
                  <span>
                    {filter.label}
                  </span>

                  <small>
                    {
                      statusCounts[
                        filter.value
                      ]
                    }
                  </small>
                </button>
              ),
            )}

          </div>

        </div>

        <div className="customer-fashion-sort-area">

          <span>
            Sort by
          </span>

          <div
            className={`customer-fashion-sort-dropdown ${
              sortOpen
                ? 'open'
                : ''
            }`}
          >

            <button
              type="button"
              className="customer-fashion-sort-trigger"
              onClick={() =>
                setSortOpen(
                  (current) =>
                    !current,
                )
              }
              aria-expanded={
                sortOpen
              }
            >
              <strong>
                {
                  SORT_OPTIONS.find(
                    (option) =>
                      option.value ===
                      sortBy,
                  )?.label
                }
              </strong>

              <ChevronDownIcon
                open={sortOpen}
              />
            </button>

            {sortOpen && (
              <div className="customer-fashion-sort-menu">

                {SORT_OPTIONS.map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={
                        sortBy ===
                        option.value
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setSortBy(
                          option.value,
                        )

                        setSortOpen(
                          false,
                        )
                      }}
                    >
                      {option.label}

                      {sortBy ===
                        option.value && (
                        <CheckIcon />
                      )}
                    </button>
                  ),
                )}

              </div>
            )}

          </div>

        </div>

      </section>

      {/* ===================================================
         FILTER EMPTY
      =================================================== */}

      {processedOrders.length ===
        0 && (
        <section className="customer-fashion-empty customer-fashion-filter-empty">

          <div className="customer-fashion-empty-icon">
            <ShoppingBagIcon />
          </div>

          <span>
            NO MATCHING ORDERS
          </span>

          <h2>
            Nothing Here Yet
          </h2>

          <p>
            There are no orders matching
            the selected status.
          </p>

          <button
            type="button"
            className="customer-fashion-empty-button"
            onClick={() =>
              setActiveFilter(
                'all',
              )
            }
          >
            Show All Orders
          </button>

        </section>
      )}

      {/* ===================================================
         ORDER LIST
      =================================================== */}

      {paginatedOrders.length >
        0 && (
        <section className="customer-fashion-orders">

          {paginatedOrders.map(
            (order) => {
              const isExpanded =
                expandedOrderId ===
                order.id

              const status =
                normalizeStatus(
                  order.status,
                )

              const paymentStatus =
                normalizeStatus(
                  order.payment
                    ?.status ??
                    'pending',
                )

              const itemCount =
                order.items.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total +
                    toNumber(
                      item.quantity,
                    ),
                  0,
                )

              return (
                <article
                  key={order.id}
                  className={`customer-fashion-order-card ${
                    isExpanded
                      ? 'expanded'
                      : ''
                  }`}
                >

                  {/* =====================================
                     ORDER HEADER
                  ===================================== */}

                  <div className="customer-fashion-order-top">

                    <div className="customer-fashion-order-number">

                      <span className="customer-fashion-order-icon">
                        <PackageIcon />
                      </span>

                      <div>
                        <span>
                          ORDER
                        </span>

                        <strong>
                          {
                            order.order_number
                          }
                        </strong>

                        <small>
                          Placed on{' '}
                          {formatDate(
                            order.created_at,
                          )}
                        </small>
                      </div>

                    </div>

                    <div className="customer-fashion-order-meta">

                      <span
                        className={`customer-fashion-status ${getOrderStatusClass(
                          status,
                        )}`}
                      >
                        <i />

                        {formatStatusLabel(
                          status,
                        )}
                      </span>

                      <strong className="customer-fashion-order-total">
                        {formatCurrency(
                          toNumber(
                            order.total_amount,
                          ),
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* =====================================
                     ORDER PREVIEW
                  ===================================== */}

                  <div className="customer-fashion-order-preview">

                    <div className="customer-fashion-preview-items">

                      {order.items
                        .slice(
                          0,
                          2,
                        )
                        .map(
                          (
                            item,
                          ) => {
                            const image =
                              order
                                .imagesByDesign[
                                item
                                  .design_id
                              ]

                            const imageUrl =
                              getFashionImageUrl(
                                image?.image_url,
                              )

                            return (
                              <div
                                key={
                                  item.id
                                }
                                className="customer-fashion-preview-item"
                              >

                                <div className="customer-fashion-preview-image">
                                  <span>
                                    W
                                  </span>

                                  {imageUrl && (
                                    <img
                                      src={
                                        imageUrl
                                      }
                                      alt={
                                        image?.alt_text ||
                                        item.design_name
                                      }
                                      loading="lazy"
                                      onError={(
                                        event,
                                      ) => {
                                        event.currentTarget.style.display =
                                          'none'
                                      }}
                                    />
                                  )}
                                </div>

                                <div className="customer-fashion-preview-info">

                                  <strong>
                                    {
                                      item.design_name
                                    }
                                  </strong>

                                  <span>
                                    Size:{' '}
                                    {
                                      item.size
                                    }{' '}
                                    · Qty:{' '}
                                    {
                                      item.quantity
                                    }
                                  </span>

                                </div>

                              </div>
                            )
                          },
                        )}

                      {itemCount >
                        2 && (
                        <span className="customer-fashion-more-items">
                          +
                          {itemCount -
                            2}{' '}
                          more items
                        </span>
                      )}

                    </div>

                    <div className="customer-fashion-preview-payment">

                      <span>
                        {itemCount}{' '}
                        {itemCount ===
                        1
                          ? 'item'
                          : 'items'}
                      </span>

                     
                  {/* =====================================
                     VIEW DETAILS
                  ===================================== */}

                  <div className="customer-fashion-view-details-row">

                    <button
                      type="button"
                      className="customer-fashion-view-details-button"
                      onClick={() =>
                        toggleOrder(
                          order.id,
                        )
                      }
                      aria-expanded={
                        isExpanded
                      }
                    >
                      {isExpanded
                        ? 'Hide Details'
                        : 'View Details'}

                      <ChevronDownIcon
                        open={
                          isExpanded
                        }
                      />
                    </button>

                  </div>

                    </div>

                  </div>


                  {/* =====================================
                     DETAILS
                  ===================================== */}

                  {isExpanded && (
                    <div className="customer-fashion-order-details">

                      {/* =================================
                         STATUS
                      ================================= */}

                      <section className="customer-fashion-detail-section">

                        <div className="customer-fashion-detail-heading">

                          <div>
                            <span>
                              ORDER STATUS
                            </span>

                            <h3>
                              {
                                formatStatusLabel(
                                  status,
                                )
                              }
                            </h3>

                            <p>
                              {getStatusDescription(
                                status,
                              )}
                            </p>
                          </div>

                          <span className="customer-fashion-section-icon">
                            <PackageIcon />
                          </span>

                        </div>

                        {status !==
                          'cancelled' &&
                          status !==
                            'canceled' && (
                            <div className="customer-fashion-timeline-wrapper">

                              <div className="customer-fashion-timeline">

                                {ORDER_STEPS.map(
                                  (
                                    step,
                                    index,
                                  ) => {
                                    const statusStep =
                                      getStatusStepIndex(
                                        status,
                                      )

                                    const isDone =
                                      index <=
                                      statusStep

                                    const isCurrent =
                                      index ===
                                      statusStep

                                    return (
                                      <div
                                        key={
                                          step.key
                                        }
                                        className={`customer-fashion-timeline-step ${
                                          isDone
                                            ? 'done'
                                            : ''
                                        } ${
                                          isCurrent
                                            ? 'current'
                                            : ''
                                        }`}
                                      >

                                        <div className="customer-fashion-timeline-dot">
                                          {isDone
                                            ? '✓'
                                            : index +
                                              1}
                                        </div>

                                        <span>
                                          {
                                            step.label
                                          }
                                        </span>

                                        {index <
                                          ORDER_STEPS.length -
                                            1 && (
                                          <div
                                            className={`customer-fashion-timeline-line ${
                                              index <
                                              statusStep
                                                ? 'done'
                                                : ''
                                            }`}
                                          />
                                        )}

                                      </div>
                                    )
                                  },
                                )}

                              </div>

                            </div>
                          )}

                        {(status ===
                          'cancelled' ||
                          status ===
                            'canceled') && (
                          <div className="customer-fashion-cancelled-message">
                            This order has been cancelled.
                          </div>
                        )}

                      </section>

                      {/* =================================
                         ITEMS
                      ================================= */}

                      <section className="customer-fashion-detail-section">

                        <div className="customer-fashion-detail-heading">

                          <div>
                            <span>
                              ORDER ITEMS
                            </span>

                            <h3>
                              Items in Your Order
                            </h3>
                          </div>

                          <span className="customer-fashion-detail-count">
                            {
                              order.items.length
                            }{' '}
                            product
                            {order.items.length ===
                            1
                              ? ''
                              : 's'}
                          </span>

                        </div>

                        <div className="customer-fashion-detail-items">

                          {order.items.map(
                            (
                              item,
                            ) => {
                              const image =
                                order
                                  .imagesByDesign[
                                  item
                                    .design_id
                                ]

                              const imageUrl =
                                getFashionImageUrl(
                                  image?.image_url,
                                )

                              const pricing =
                                getItemPricing(
                                  order,
                                  item,
                                )

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="customer-fashion-detail-item"
                                >

                                  <div className="customer-fashion-detail-item-image">
                                    <span>
                                      W
                                    </span>

                                    {imageUrl && (
                                      <img
                                        src={
                                          imageUrl
                                        }
                                        alt={
                                          image?.alt_text ||
                                          item.design_name
                                        }
                                        loading="lazy"
                                        onError={(
                                          event,
                                        ) => {
                                          event.currentTarget.style.display =
                                            'none'
                                        }}
                                      />
                                    )}
                                  </div>

                                  <div className="customer-fashion-detail-item-info">

                                    <strong>
                                      {
                                        item.design_name
                                      }
                                    </strong>

                                    <span>
                                      Size:{' '}
                                      {
                                        item.size
                                      }
                                    </span>

                                    <span>
                                      Quantity:{' '}
                                      {
                                        pricing.quantity
                                      }
                                    </span>

                                  </div>

                                  <div className="customer-fashion-detail-item-price">

                                    {pricing.hasDiscount ? (
                                      <>
                                        <div className="customer-fashion-item-price-original">
                                          <span>
                                            Original Price
                                          </span>

                                          <del>
                                            {formatCurrency(
                                              pricing.unitPrice,
                                            )}
                                          </del>
                                        </div>

                                        <div className="customer-fashion-item-price-paid">
                                          <span>
                                            Paid
                                          </span>

                                          <strong>
                                            {formatCurrency(
                                              pricing.paidUnitPrice,
                                            )}{' '}
                                            each
                                          </strong>
                                        </div>

                                        <small className="customer-fashion-item-discount">
                                          Save{' '}
                                          {formatCurrency(
                                            pricing.discountAmount,
                                          )}
                                        </small>

                                        <strong className="customer-fashion-item-line-total">
                                          {formatCurrency(
                                            pricing.paidLineTotal,
                                          )}
                                        </strong>
                                      </>
                                    ) : (
                                      <>
                                        <span>
                                          {formatCurrency(
                                            pricing.unitPrice,
                                          )}{' '}
                                          each
                                        </span>

                                        <strong>
                                          {formatCurrency(
                                            pricing.paidLineTotal,
                                          )}
                                        </strong>
                                      </>
                                    )}

                                  </div>

                                </div>
                              )
                            },
                          )}

                        </div>

                      </section>

                      {/* =================================
                         PAYMENT + PRICE
                      ================================= */}

                      <div className="customer-fashion-two-column">

                        {/* PAYMENT */}

                        <section className="customer-fashion-detail-section">

                          <div className="customer-fashion-detail-heading">

                            <div>
                              <span>
                                PAYMENT
                              </span>

                              <h3>
                                Payment Information
                              </h3>
                            </div>

                            <span className="customer-fashion-section-icon">
                              <CreditCardIcon />
                            </span>

                          </div>

                          <div className="customer-fashion-payment-grid">

                            <div className="customer-fashion-info-box">
                              <span>
                                Method
                              </span>

                              <strong>
                                {
                                  order
                                    .payment
                                    ?.payment_method ||
                                  '—'
                                }
                              </strong>
                            </div>

                            <div className="customer-fashion-info-box">
                              <span>
                                Amount
                              </span>

                              <strong>
                                {formatCurrency(
                                  toNumber(
                                    order
                                      .payment
                                      ?.amount ??
                                      order.total_amount,
                                  ),
                                )}
                              </strong>
                            </div>

                            <div className="customer-fashion-info-box">
                              <span>
                                Status
                              </span>

                              <strong
                                className={`customer-fashion-payment-text ${getPaymentStatusClass(
                                  paymentStatus,
                                )}`}
                              >
                                {
                                  getPaymentStatusLabel(
                                    paymentStatus,
                                  )
                                }
                              </strong>
                            </div>

                            <div className="customer-fashion-info-box">
                              <span>
                                Transaction Reference
                              </span>

                              <strong>
                                {order
                                  .payment
                                  ?.transaction_reference ||
                                  'Not Available'}
                              </strong>
                            </div>

                          </div>

                        </section>

                        {/* PRICE SUMMARY */}

                        <section className="customer-fashion-detail-section">

                          <div className="customer-fashion-detail-heading">

                            <div>
                              <span>
                                PRICE SUMMARY
                              </span>

                              <h3>
                                Order Total
                              </h3>
                            </div>

                          </div>

                          <div className="customer-fashion-price-summary">

                            <div>
                              <span>
                                Subtotal
                              </span>

                              <strong>
                                {formatCurrency(
                                  toNumber(
                                    order.subtotal,
                                  ),
                                )}
                              </strong>
                            </div>

                            {toNumber(
                              order.discount_amount,
                            ) > 0 && (
                              <div className="discount">
                                <span>
                                  Discount
                                </span>

                                <strong>
                                  -
                                  {formatCurrency(
                                    toNumber(
                                      order.discount_amount,
                                    ),
                                  )}
                                </strong>
                              </div>
                            )}

                            <div className="total">
                              <span>
                                Total
                              </span>

                              <strong>
                                {formatCurrency(
                                  toNumber(
                                    order.total_amount,
                                  ),
                                )}
                              </strong>
                            </div>

                          </div>

                        </section>

                      </div>

                      {/* =================================
                         SHIPPING
                      ================================= */}

                      <section className="customer-fashion-detail-section">

                        <div className="customer-fashion-detail-heading">

                          <div>
                            <span>
                              DELIVERY
                            </span>

                            <h3>
                              Shipping Information
                            </h3>
                          </div>

                          <span className="customer-fashion-section-icon">
                            <MapPinIcon />
                          </span>

                        </div>

                        <div className="customer-fashion-shipping-card">

                          <div className="customer-fashion-shipping-main">

                            <strong>
                              {
                                order.customer_name
                              }
                            </strong>

                            {order
                              .customer_phone && (
                              <span>
                                {
                                  order.customer_phone
                                }
                              </span>
                            )}

                            {order
                              .shipping_address && (
                              <span>
                                {
                                  order.shipping_address
                                }
                              </span>
                            )}

                            {(order
                              .shipping_city ||
                              order
                                .shipping_pincode) && (
                              <span>
                                {[
                                  order.shipping_city,
                                  order.shipping_pincode,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ' - ',
                                  )}
                              </span>
                            )}

                          </div>

                          <div className="customer-fashion-shipping-email">

                            <span>
                              Email
                            </span>

                            <strong>
                              {
                                order.customer_email
                              }
                            </strong>

                          </div>

                        </div>

                      </section>

                      {/* =================================
                         NOTES
                      ================================= */}

                      {order.notes && (
                        <section className="customer-fashion-order-note">

                          <span>
                            ORDER NOTE
                          </span>

                          <p>
                            {order.notes}
                          </p>

                        </section>
                      )}

                      {normalizeStatus(order.status) ===
                        'cancelled' &&
                        order.cancellation_reason && (
                          <section className="customer-fashion-cancellation-notice">
                            <span>
                              ORDER CANCELLED
                            </span>

                            <h3>
                              This order was cancelled by WildFloral.
                            </h3>

                            <p>
                              {order.cancellation_reason}
                            </p>
                          </section>
                        )}

                      {/* =================================
                         FOOTER
                      ================================= */}

                      <div className="customer-fashion-detail-footer">

                        <div>
                          <span>
                            Last updated
                          </span>

                          <strong>
                            {formatDateTime(
                              order.updated_at,
                            )}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void loadOrders(
                              true,
                            )
                          }
                          disabled={
                            refreshing
                          }
                        >
                          <RefreshIcon />

                          {refreshing
                            ? 'Updating...'
                            : 'Check Latest Status'}
                        </button>

                      </div>

                    </div>
                  )}

                </article>
              )
            },
          )}

        </section>
      )}

      {/* ===================================================
         PAGINATION
      =================================================== */}

      {processedOrders.length >
        ORDERS_PER_PAGE && (
        <nav
          className="customer-fashion-pagination"
          aria-label="Fashion orders pagination"
        >

          <button
            type="button"
            disabled={
              currentPage ===
              1
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
            <ChevronLeftIcon />

            <span>
              Previous
            </span>
          </button>

          <div className="customer-fashion-page-numbers">

            {pageNumbers.map(
              (
                page,
                index,
              ) => {
                const previousPage =
                  pageNumbers[
                    index - 1
                  ]

                const showEllipsis =
                  index > 0 &&
                  page -
                    previousPage >
                    1

                return (
                  <span
                    key={page}
                    className="customer-fashion-page-number-group"
                  >
                    {showEllipsis && (
                      <span className="customer-fashion-page-ellipsis">
                        ...
                      </span>
                    )}

                    <button
                      type="button"
                      className={
                        currentPage ===
                        page
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setCurrentPage(
                          page,
                        )
                      }
                      aria-current={
                        currentPage ===
                        page
                          ? 'page'
                          : undefined
                      }
                    >
                      {page}
                    </button>
                  </span>
                )
              },
            )}

          </div>

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
            <span>
              Next
            </span>

            <ChevronRightIcon />
          </button>

        </nav>
      )}

      {/* ===================================================
         FOOTER NOTE
      =================================================== */}

      <div className="customer-fashion-page-footer">

        <span>
          Showing{' '}
          {processedOrders.length ===
          0
            ? 0
            : (currentPage -
                1) *
                ORDERS_PER_PAGE +
              1}
          –
          {Math.min(
            currentPage *
              ORDERS_PER_PAGE,
            processedOrders.length,
          )}{' '}
          of{' '}
          {
            processedOrders.length
          }{' '}
          orders
        </span>

        <span>
          Orders are automatically
          refreshed every 30 seconds.
        </span>

      </div>

    </main>
  )
}

export default CustomerFashionBooking