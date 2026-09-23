import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from "../../../lib/supabase";

import './AdminFashionBookings.css'

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
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
  | 'high'
  | 'low'

type FashionOrder = {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null

  subtotal: number
  discount_amount: number
  total_amount: number

  status: OrderStatus

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
  design_size_id: string | null
  design_name: string
  size: string
  quantity: number
  unit_price: number
  discount_amount: number
  final_price: number
  created_at: string
}

type FashionOrderPayment = {
  id: string
  order_id: string

  payment_method: string
  amount: number

  transaction_reference: string | null

  status:
    | 'pending'
    | 'submitted'
    | 'verified'
    | 'paid'
    | 'rejected'

  created_at: string
  updated_at: string

  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
}

type FashionDesignImage = {
  id: string
  design_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

type ItemPricing = {
  originalPrice: number
  discount: number
  totalPrice: number
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 8

const STATUS_OPTIONS: Array<{
  value: OrderStatus
  label: string
}> = [
  {
    value: 'pending',
    label: 'Order Pending',
  },
  {
    value: 'confirmed',
    label: 'Order Confirmed',
  },
  {
    value: 'processing',
    label: 'Order Processing',
  },
  {
    value: 'ready',
    label: 'Order Ready',
  },
  {
    value: 'delivered',
    label: 'Order Delivered',
  },
  {
    value: 'completed',
    label: 'Order Completed',
  },
  {
    value: 'cancelled',
    label: 'Order Cancelled',
  },
]

const SORT_OPTIONS: Array<{
  value: SortValue
  label: string
}> = [
  {
    value: 'latest',
    label: 'Latest',
  },
  {
    value: 'oldest',
    label: 'Oldest',
  },
  {
    value: 'high',
    label: 'Highest Amount',
  },
  {
    value: 'low',
    label: 'Lowest Amount',
  },
]

/* =========================================================
   HELPERS
========================================================= */

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
  ).format(Number(value) || 0)
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
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
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
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

function getStatusLabel(
  status: string,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.label ?? status
  )
}

function getPaymentStatusLabel(
  status: string,
): string {
  switch (status) {
    case 'paid':
      return 'Paid'

    case 'submitted':
      return 'Submitted'

    case 'verified':
      return 'Verified'

    case 'rejected':
      return 'Rejected'

    default:
      return 'Pending'
  }
}

function getPaymentMethodLabel(
  method: string,
): string {
  switch (method) {
    case 'razorpay':
      return 'Razorpay'

    case 'upi_qr':
      return 'UPI / QR'

    case 'bank_transfer':
      return 'Bank Transfer'

    case 'cash':
      return 'Cash'

    default:
      return method || '—'
  }
}

/* =========================================================
   ITEM PRICE CALCULATION
========================================================= */

function getItemPricing(
  order: FashionOrder,
  orderItems: FashionOrderItem[],
  itemIndex: number,
): ItemPricing {
  const originalPrice =
    orderItems.reduce(
      (total, item) =>
        total +
        Number(item.unit_price || 0) *
          Number(item.quantity || 0),
      0,
    )

  const currentItem =
    orderItems[itemIndex]

  if (!currentItem) {
    return {
      originalPrice: 0,
      discount: 0,
      totalPrice: 0,
    }
  }

  const currentOriginalPrice =
    Number(currentItem.unit_price || 0) *
    Number(currentItem.quantity || 0)

  const itemLevelDiscounts =
    orderItems.reduce(
      (total, item) =>
        total +
        Number(
          item.discount_amount || 0,
        ),
      0,
    )

  const orderLevelDiscount =
    Math.max(
      0,
      Number(
        order.discount_amount || 0,
      ) - itemLevelDiscounts,
    )

  let allocatedOrderDiscount = 0

  if (
    originalPrice > 0 &&
    orderLevelDiscount > 0
  ) {
    if (
      itemIndex ===
      orderItems.length - 1
    ) {
      const previousAllocated =
        orderItems
          .slice(0, itemIndex)
          .reduce(
            (total, item) => {
              const previousOriginal =
                Number(
                  item.unit_price || 0,
                ) *
                Number(
                  item.quantity || 0,
                )

              return (
                total +
                Math.round(
                  (orderLevelDiscount *
                    previousOriginal) /
                    originalPrice,
                )
              )
            },
            0,
          )

      allocatedOrderDiscount =
        Math.max(
          0,
          orderLevelDiscount -
            previousAllocated,
        )
    } else {
      allocatedOrderDiscount =
        Math.round(
          (orderLevelDiscount *
            currentOriginalPrice) /
            originalPrice,
        )
    }
  }

  const itemLevelDiscount =
    Number(
      currentItem.discount_amount || 0,
    )

  const totalDiscount =
    Math.min(
      currentOriginalPrice,
      itemLevelDiscount +
        allocatedOrderDiscount,
    )

  const totalPrice =
    Math.max(
      0,
      currentOriginalPrice -
        totalDiscount,
    )

  return {
    originalPrice:
      currentOriginalPrice,
    discount: totalDiscount,
    totalPrice,
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminFashionBookings() {
  const [
    orders,
    setOrders,
  ] = useState<FashionOrder[]>([])

  const [
    items,
    setItems,
  ] = useState<FashionOrderItem[]>([])

  const [
    payments,
    setPayments,
  ] = useState<FashionOrderPayment[]>([])

  const [
    designImages,
    setDesignImages,
  ] = useState<FashionDesignImage[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    activeStatus,
    setActiveStatus,
  ] = useState<
    OrderStatus | 'all'
  >('all')

  const [
    sortBy,
    setSortBy,
  ] = useState<SortValue>('latest')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<FashionOrder | null>(
      null,
    )

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<OrderStatus | ''>('')

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState('')

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false)

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(false)

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false)

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!selectedOrder) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [selectedOrder])

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!selectedOrder) {
      return
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape' &&
        !updatingStatus
      ) {
        setSelectedOrder(null)
        setSelectedStatus('')
        setCancellationReason('')
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [
    selectedOrder,
    updatingStatus,
  ])

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders =
    useCallback(
      async (
        showLoading = true,
      ) => {
        if (showLoading) {
          setLoading(true)
        }

        setError('')

        try {
          const {
            data,
            error: ordersError,
          } =
            await supabase
              .from(
                'fashion_orders',
              )
              .select(`
                id,
                order_number,
                customer_id,
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
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (ordersError) {
            throw ordersError
          }

          const loadedOrders =
            (data ?? []) as FashionOrder[]

          if (!loadedOrders.length) {
            setOrders([])
            return
          }

          const orderIds =
            loadedOrders.map(
              (order) => order.id,
            )

          const {
            data: paymentRows,
            error: paymentRowsError,
          } =
            await supabase
              .from(
                'fashion_order_payments',
              )
              .select(`
                order_id,
                status,
                created_at
              `)
              .in(
                'order_id',
                orderIds,
              )
              .order(
                'created_at',
                {
                  ascending: false,
                },
              )

          if (paymentRowsError) {
            throw paymentRowsError
          }

          const paidOrderIds =
            new Set(
              (paymentRows ?? [])
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

          setOrders(
            visibleOrders,
          )
        } catch (err) {
          console.error(
            'Failed to load fashion orders:',
            err,
          )

          setError(
            'Unable to load fashion orders.',
          )
        } finally {
          if (showLoading) {
            setLoading(false)
          }
        }
      },
      [],
    )

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  /* =======================================================
     LOAD VISIBLE ORDER DATA
  ======================================================= */

  const loadOrderData =
    useCallback(
      async (
        orderList: FashionOrder[],
      ) => {
        if (!orderList.length) {
          return
        }

        const orderIds =
          orderList.map(
            (order) => order.id,
          )

        try {
          const [
            itemsResult,
            paymentsResult,
          ] = await Promise.all([
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
                  ascending: true,
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
                updated_at,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
              `)
              .in(
                'order_id',
                orderIds,
              )
              .order(
                'created_at',
                {
                  ascending: false,
                },
              ),
          ])

          if (itemsResult.error) {
            throw itemsResult.error
          }

          if (paymentsResult.error) {
            throw paymentsResult.error
          }

          const newItems =
            (itemsResult.data ??
              []) as FashionOrderItem[]

          const newPayments =
            (paymentsResult.data ??
              []) as FashionOrderPayment[]

          const latestPaymentByOrder =
            new Map<
              string,
              FashionOrderPayment
            >()

          for (
            const payment of newPayments
          ) {
            if (
              !latestPaymentByOrder.has(
                payment.order_id,
              )
            ) {
              latestPaymentByOrder.set(
                payment.order_id,
                payment,
              )
            }
          }

          setItems(
            (previous) => [
              ...previous.filter(
                (item) =>
                  !orderIds.includes(
                    item.order_id,
                  ),
              ),
              ...newItems,
            ],
          )

          setPayments(
            (previous) => [
              ...previous.filter(
                (payment) =>
                  !orderIds.includes(
                    payment.order_id,
                  ),
              ),
              ...Array.from(
                latestPaymentByOrder.values(),
              ),
            ],
          )

          const designIds =
            Array.from(
              new Set(
                newItems.map(
                  (item) =>
                    item.design_id,
                ),
              ),
            )

          if (!designIds.length) {
            return
          }

          const {
            data: imageData,
            error: imageError,
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
                'display_order',
                {
                  ascending: true,
                },
              )

          if (imageError) {
            throw imageError
          }

          const newImages =
            (imageData ??
              []) as FashionDesignImage[]

          setDesignImages(
            (previous) => [
              ...previous.filter(
                (image) =>
                  !designIds.includes(
                    image.design_id,
                  ),
              ),
              ...newImages,
            ],
          )
        } catch (err) {
          console.error(
            'Failed to load fashion order data:',
            err,
          )

          setError(
            'Some order details could not be loaded.',
          )
        }
      },
      [],
    )

  /* =======================================================
     VISIBLE ORDERS
  ======================================================= */

  const visibleOrderIds =
    useMemo(
      () =>
        orders
          .slice(
            (currentPage - 1) *
              PAGE_SIZE,
            currentPage * PAGE_SIZE,
          )
          .map(
            (order) =>
              order.id,
          )
          .join('|'),
      [orders, currentPage],
    )

  const visibleOrders =
    useMemo(() => {
      if (!visibleOrderIds) {
        return []
      }

      const ids =
        visibleOrderIds.split('|')

      return orders.filter(
        (order) =>
          ids.includes(order.id),
      )
    }, [
      orders,
      visibleOrderIds,
    ])

  useEffect(() => {
    if (!visibleOrders.length) {
      return
    }

    void loadOrderData(
      visibleOrders,
    )
  }, [
    visibleOrders,
    loadOrderData,
  ])

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      let result = [...orders]

      if (
        activeStatus !== 'all'
      ) {
        result =
          result.filter(
            (order) =>
              order.status ===
              activeStatus,
          )
      }

      if (normalizedSearch) {
        result =
          result.filter(
            (order) =>
              order.order_number
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              order.customer_name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              order.customer_email
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              (
                order.customer_phone ??
                ''
              )
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
          )
      }

      result.sort(
        (a, b) => {
          switch (sortBy) {
            case 'oldest':
              return (
                new Date(
                  a.created_at,
                ).getTime() -
                new Date(
                  b.created_at,
                ).getTime()
              )

            case 'high':
              return (
                Number(
                  b.total_amount,
                ) -
                Number(
                  a.total_amount,
                )
              )

            case 'low':
              return (
                Number(
                  a.total_amount,
                ) -
                Number(
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
      search,
      activeStatus,
      sortBy,
    ])

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
          PAGE_SIZE,
      ),
    )

  const paginatedOrders =
    filteredOrders.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage * PAGE_SIZE,
    )

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages,
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(
      () => ({
        total: orders.length,

        pending:
          orders.filter(
            (order) =>
              order.status ===
              'pending',
          ).length,

        confirmed:
          orders.filter(
            (order) =>
              order.status ===
              'confirmed',
          ).length,

        processing:
          orders.filter(
            (order) =>
              order.status ===
              'processing',
          ).length,

        ready:
          orders.filter(
            (order) =>
              order.status ===
              'ready',
          ).length,

        completed:
          orders.filter(
            (order) =>
              order.status ===
              'completed',
          ).length,

        cancelled:
          orders.filter(
            (order) =>
              order.status ===
              'cancelled',
          ).length,
      }),
      [orders],
    )

  /* =======================================================
     ORDER ITEMS
  ======================================================= */

  function getOrderItems(
    orderId: string,
  ): FashionOrderItem[] {
    return items.filter(
      (item) =>
        item.order_id ===
        orderId,
    )
  }

  /* =======================================================
     PAYMENT LOOKUP
  ======================================================= */

  function getOrderPayment(
    orderId: string,
  ): FashionOrderPayment | undefined {
    return payments.find(
      (payment) =>
        payment.order_id ===
        orderId,
    )
  }

  /* =======================================================
     DESIGN IMAGE
  ======================================================= */

  function getDesignImage(
    designId: string,
  ): string | null {
    const image =
      designImages.find(
        (item) =>
          item.design_id ===
            designId &&
          item.is_primary,
      ) ??
      designImages.find(
        (item) =>
          item.design_id ===
          designId,
      )

    return image?.image_url ?? null
  }

  /* =======================================================
     LOAD SINGLE ORDER DETAILS
  ======================================================= */

  const loadSingleOrderData =
    useCallback(
      async (
        orderId: string,
      ) => {
        setDetailLoading(true)
        setPaymentLoading(true)

        try {
          const [
            itemsResult,
            paymentResult,
          ] = await Promise.all([
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
              .eq(
                'order_id',
                orderId,
              )
              .order(
                'created_at',
                {
                  ascending: true,
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
                updated_at,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
              `)
              .eq(
                'order_id',
                orderId,
              )
              .order(
                'created_at',
                {
                  ascending: false,
                },
              )
              .limit(1)
              .maybeSingle(),
          ])

          if (itemsResult.error) {
            throw itemsResult.error
          }

          if (paymentResult.error) {
            throw paymentResult.error
          }

          const orderItems =
            (itemsResult.data ??
              []) as FashionOrderItem[]

          setItems(
            (previous) => [
              ...previous.filter(
                (item) =>
                  item.order_id !==
                  orderId,
              ),
              ...orderItems,
            ],
          )

          if (paymentResult.data) {
            setPayments(
              (previous) => [
                ...previous.filter(
                  (payment) =>
                    payment.order_id !==
                    orderId,
                ),
                paymentResult.data as FashionOrderPayment,
              ],
            )
          } else {
            setPayments(
              (previous) =>
                previous.filter(
                  (payment) =>
                    payment.order_id !==
                    orderId,
                ),
            )
          }

          const designIds =
            Array.from(
              new Set(
                orderItems.map(
                  (item) =>
                    item.design_id,
                ),
              ),
            )

          if (designIds.length) {
            const {
              data: imageData,
              error: imageError,
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
                  'display_order',
                  {
                    ascending: true,
                  },
                )

            if (imageError) {
              throw imageError
            }

            const newImages =
              (imageData ??
                []) as FashionDesignImage[]

            setDesignImages(
              (previous) => [
                ...previous.filter(
                  (image) =>
                    !designIds.includes(
                      image.design_id,
                    ),
                ),
                ...newImages,
              ],
            )
          }
        } catch (err) {
          console.error(
            'Failed to load fashion order details:',
            err,
          )

          setError(
            'Unable to load order details.',
          )
        } finally {
          setDetailLoading(false)
          setPaymentLoading(false)
        }
      },
      [],
    )

  /* =======================================================
     OPEN DETAILS
  ======================================================= */

  function openDetails(
    order: FashionOrder,
  ) {
    setSelectedOrder(order)
    setSelectedStatus(
      order.status,
    )
    setCancellationReason(
      order.cancellation_reason ?? '',
    )
    setError('')

    void loadSingleOrderData(
      order.id,
    )
  }

  /* =======================================================
     CLOSE DETAILS
  ======================================================= */

  function closeDetails() {
    if (updatingStatus) {
      return
    }

    setSelectedOrder(null)
    setSelectedStatus('')
    setCancellationReason('')
  }

  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  async function updateOrderStatus() {
    if (
      !selectedOrder ||
      !selectedStatus ||
      (selectedStatus === selectedOrder.status &&
        selectedStatus !== 'cancelled')
    ) {
      return
    }

    const orderId =
      selectedOrder.id

    const nextStatus =
      selectedStatus

    if (
      nextStatus === 'cancelled' &&
      !cancellationReason.trim()
    ) {
      setError(
        'Please enter a cancellation reason before cancelling the order.',
      )
      return
    }

    setUpdatingStatus(true)
    setError('')

    try {
      const now =
        new Date().toISOString()

      const {
        error: updateError,
      } =
        await supabase
          .from(
            'fashion_orders',
          )
          .update({
            status:
              nextStatus,
            cancellation_reason:
              nextStatus === 'cancelled'
                ? cancellationReason.trim()
                : null,
            updated_at:
              now,
          })
          .eq(
            'id',
            orderId,
          )

      if (updateError) {
        throw updateError
      }

      /*
       * Update local list immediately.
       */
      setOrders(
        (previous) =>
          previous.map(
            (order) =>
              order.id ===
              orderId
                ? {
                    ...order,
                    status:
                      nextStatus,
                    cancellation_reason:
                      nextStatus === 'cancelled'
                        ? cancellationReason.trim()
                        : null,
                    updated_at:
                      now,
                  }
                : order,
          ),
      )

      /*
       * Close modal immediately after
       * successful database update.
       */
      setSelectedOrder(null)
      setSelectedStatus('')
      setCancellationReason('')

      /*
       * Silent refresh.
       * This does not show the full page
       * loading screen.
       */
      await loadOrders(false)
    } catch (err) {
      console.error(
        'Failed to update order status:',
        err,
      )

      setError(
        'Unable to update order status.',
      )
    } finally {
      setUpdatingStatus(false)
    }
  }



  /* =======================================================
     FILTER HANDLERS
  ======================================================= */

  function handleSearch(
    value: string,
  ) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleStatusFilter(
    status:
      | OrderStatus
      | 'all',
  ) {
    setActiveStatus(status)
    setCurrentPage(1)
  }

  function handleSort(
    value: SortValue,
  ) {
    setSortBy(value)
    setCurrentPage(1)
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="admin-fashion-bookings">
        <div className="admin-fashion-bookings-loading">
          <div className="admin-fashion-spinner" />

          <p>
            Loading fashion bookings...
          </p>
        </div>
      </div>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-fashion-bookings">
      <div className="admin-fashion-bookings-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="admin-fashion-bookings-header">
          <div>
            <span className="admin-fashion-eyebrow">
              ORDER MANAGEMENT
            </span>

            <h1>
              Fashion Bookings
            </h1>

            <p>
              Manage customer fashion
              orders, payments, and
              order status.
            </p>
          </div>

          <button
            type="button"
            className="admin-fashion-refresh-button"
            onClick={() =>
              void loadOrders()
            }
          >
            ↻ Refresh
          </button>
        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="admin-fashion-error"
            role="alert"
          >
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="admin-fashion-stats">
          {(
            [
              [
                'all',
                'Total Orders',
                statistics.total,
              ],
              [
                'pending',
                'Pending',
                statistics.pending,
              ],
              [
                'confirmed',
                'Confirmed',
                statistics.confirmed,
              ],
              [
                'processing',
                'Processing',
                statistics.processing,
              ],
              [
                'ready',
                'Ready',
                statistics.ready,
              ],
              [
                'completed',
                'Completed',
                statistics.completed,
              ],
              [
                'cancelled',
                'Cancelled',
                statistics.cancelled,
              ],
            ] as const
          ).map(
            ([
              value,
              label,
              count,
            ]) => (
              <button
                key={value}
                type="button"
                className={`admin-fashion-stat-card ${
                  activeStatus ===
                  value
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleStatusFilter(
                    value,
                  )
                }
              >
                <span>
                  {label}
                </span>

                <strong>
                  {count}
                </strong>
              </button>
            ),
          )}
        </section>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="admin-fashion-toolbar">
          <div className="admin-fashion-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                handleSearch(
                  event.target.value,
                )
              }
              placeholder="Search order number, customer, email..."
            />
          </div>

          <div className="admin-fashion-sort">
            <span>
              Sort by
            </span>

            <select
              value={sortBy}
              onChange={(event) =>
                handleSort(
                  event.target
                    .value as SortValue,
                )
              }
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        </section>

        {/* =================================================
            STATUS FILTERS
        ================================================= */}

        <div className="admin-fashion-status-filters">
          {(
            [
              [
                'all',
                'All',
              ],
              ...STATUS_OPTIONS.map(
                (option) => [
                  option.value,
                  option.label,
                ] as const,
              ),
            ] as Array<
              [
                OrderStatus | 'all',
                string,
              ]
            >
          ).map(
            ([
              value,
              label,
            ]) => (
              <button
                key={value}
                type="button"
                className={
                  activeStatus ===
                  value
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleStatusFilter(
                    value,
                  )
                }
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* =================================================
            RESULTS
        ================================================= */}

        {paginatedOrders.length ===
        0 ? (
          <div className="admin-fashion-empty">
            <div className="admin-fashion-empty-icon">
              ◎
            </div>

            <h2>
              No fashion orders found
            </h2>

            <p>
              Try changing your
              search or filter.
            </p>
          </div>
        ) : (
          <section className="admin-fashion-orders">
            {paginatedOrders.map(
              (order) => {
                const orderItems =
                  getOrderItems(
                    order.id,
                  )

                const payment =
                  getOrderPayment(
                    order.id,
                  )

                const itemCount =
                  orderItems.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      Number(
                        item.quantity,
                      ),
                    0,
                  )

                return (
                  <article
                    key={order.id}
                    className="admin-fashion-order-card"
                  >
                    <div className="admin-fashion-order-card-top">
                      <div className="admin-fashion-order-main">
                        <span className="admin-fashion-order-label">
                          ORDER
                        </span>

                        <h2>
                          {
                            order.order_number
                          }
                        </h2>

                        <p>
                          {
                            order.customer_name
                          }
                        </p>

                        <small>
                          Placed on{' '}
                          {formatDate(
                            order.created_at,
                          )}
                        </small>
                      </div>

                      <div className="admin-fashion-order-total">
                        <span
                          className={`admin-fashion-status ${order.status}`}
                        >
                          <i />

                          {
                            getStatusLabel(
                              order.status,
                            )
                          }
                        </span>

                        <strong>
                          {formatCurrency(
                            order.total_amount,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-fashion-order-card-middle">
                      <div>
                        <span>
                          Items
                        </span>

                        <strong>
                          {itemCount}{' '}
                          {itemCount ===
                          1
                            ? 'Item'
                            : 'Items'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Subtotal
                        </span>

                        <strong>
                          {formatCurrency(
                            order.subtotal,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Discount
                        </span>

                        <strong className="discount">
                          -
                          {formatCurrency(
                            order.discount_amount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Payment
                        </span>

                        <strong
                          className={
                            payment
                              ? `admin-fashion-payment-inline ${payment.status}`
                              : ''
                          }
                        >
                          {payment
                            ? getPaymentStatusLabel(
                                payment.status,
                              )
                            : 'Loading...'}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-fashion-order-card-bottom">
                      <div className="admin-fashion-mini-items">
                        {orderItems
                          .slice(0, 3)
                          .map(
                            (item) => {
                              const image =
                                getDesignImage(
                                  item.design_id,
                                )

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="admin-fashion-mini-item"
                                >
                                  <div className="admin-fashion-mini-image">
                                    {image ? (
                                      <img
                                        src={
                                          image
                                        }
                                        alt={
                                          item.design_name
                                        }
                                        loading="lazy"
                                      />
                                    ) : (
                                      <span>
                                        WF
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <strong>
                                      {
                                        item.design_name
                                      }
                                    </strong>

                                    <small>
                                      Size:{' '}
                                      {
                                        item.size
                                      }{' '}
                                      · Qty:{' '}
                                      {
                                        item.quantity
                                      }
                                    </small>
                                  </div>
                                </div>
                              )
                            },
                          )}

                        {orderItems.length >
                          3 && (
                          <span className="admin-fashion-more-items">
                            +
                            {orderItems.length -
                              3}{' '}
                            more items
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="admin-fashion-view-button"
                        onClick={() =>
                          openDetails(
                            order,
                          )
                        }
                      >
                        View Details
                        <span>
                          →
                        </span>
                      </button>
                    </div>
                  </article>
                )
              },
            )}
          </section>
        )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        {filteredOrders.length >
          0 && (
          <div className="admin-fashion-pagination">
            <span>
              Showing{' '}
              {Math.min(
                filteredOrders.length,
                (currentPage - 1) *
                  PAGE_SIZE +
                  1,
              )}
              {' - '}
              {Math.min(
                filteredOrders.length,
                currentPage *
                  PAGE_SIZE,
              )}{' '}
              of{' '}
              {filteredOrders.length}
            </span>

            <div>
              <button
                type="button"
                disabled={
                  currentPage ===
                  1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      page - 1,
                  )
                }
              >
                Previous
              </button>

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) =>
                  index + 1,
              ).map(
                (page) => (
                  <button
                    key={page}
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
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      page + 1,
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selectedOrder && (
        <div
          className="admin-fashion-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails()
            }
          }}
        >
          <div
            className="admin-fashion-details"
            role="dialog"
            aria-modal="true"
            aria-label="Fashion order details"
          >
            {/* =============================================
                HEADER
            ============================================= */}

            <div className="admin-fashion-details-header">
              <div>
                <span>
                  FASHION ORDER
                </span>

                <h2>
                  {
                    selectedOrder.order_number
                  }
                </h2>

                <p>
                  Placed on{' '}
                  {formatDateTime(
                    selectedOrder.created_at,
                  )}
                </p>
              </div>

              <div className="admin-fashion-details-header-actions">
                <span
                  className={`admin-fashion-status ${selectedOrder.status}`}
                >
                  <i />

                  {
                    getStatusLabel(
                      selectedOrder.status,
                    )
                  }
                </span>

                <button
                  type="button"
                  className="admin-fashion-close"
                  onClick={
                    closeDetails
                  }
                  aria-label="Close order details"
                  disabled={
                    updatingStatus
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="admin-fashion-detail-loading">
                <div className="admin-fashion-spinner" />

                <p>
                  Loading order details...
                </p>
              </div>
            ) : (
              <>
                {/* =========================================
                    CUSTOMER
                ========================================= */}

                <section className="admin-fashion-detail-section">
                  <div className="admin-fashion-detail-section-title">
                    <span>
                      CUSTOMER
                    </span>
                  </div>

                  <div className="admin-fashion-customer-box">
                    <div className="admin-fashion-avatar">
                      {selectedOrder.customer_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>
                        {
                          selectedOrder.customer_name
                        }
                      </h3>

                      <p>
                        {
                          selectedOrder.customer_email
                        }
                      </p>

                      <p>
                        {selectedOrder.customer_phone ||
                          'Phone not provided'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* =========================================
                    ITEMS
                ========================================= */}

                <section className="admin-fashion-detail-section">
                  <div className="admin-fashion-detail-section-heading">
                    <span>
                      ITEMS
                    </span>

                    <strong>
                      {
                        getOrderItems(
                          selectedOrder.id,
                        ).length
                      }{' '}
                      designs
                    </strong>
                  </div>

                  <div className="admin-fashion-items-table">
                    <div className="admin-fashion-items-head">
                      <span>
                        DESIGN
                      </span>

                      <span>
                        SIZE
                      </span>

                      <span>
                        QTY
                      </span>

                      <span>
                        ORIGINAL PRICE
                      </span>

                      <span>
                        DISCOUNT
                      </span>

                      <span>
                        TOTAL PRICE
                      </span>
                    </div>

                    {getOrderItems(
                      selectedOrder.id,
                    ).length ===
                    0 ? (
                      <div className="admin-fashion-no-items">
                        No items found.
                      </div>
                    ) : (
                      getOrderItems(
                        selectedOrder.id,
                      ).map(
                        (
                          item,
                          itemIndex,
                          orderItems,
                        ) => {
                          const image =
                            getDesignImage(
                              item.design_id,
                            )

                          const pricing =
                            getItemPricing(
                              selectedOrder,
                              orderItems,
                              itemIndex,
                            )

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="admin-fashion-item-row"
                            >
                              <div className="admin-fashion-item-design">
                                <div className="admin-fashion-detail-item-image">
                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt={
                                        item.design_name
                                      }
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span>
                                      WF
                                    </span>
                                  )}
                                </div>

                                <div className="admin-fashion-item-design-info">
                                  <strong>
                                    {
                                      item.design_name
                                    }
                                  </strong>

                                  <small>
                                    Fashion
                                    Design
                                  </small>
                                </div>
                              </div>

                              <span className="admin-fashion-item-size">
                                {
                                  item.size
                                }
                              </span>

                              <span className="admin-fashion-item-qty">
                                {
                                  item.quantity
                                }
                              </span>

                              <span className="admin-fashion-original-price">
                                {formatCurrency(
                                  pricing.originalPrice,
                                )}
                              </span>

                              <span
                                className={`admin-fashion-item-discount ${
                                  pricing.discount >
                                  0
                                    ? 'has-discount'
                                    : 'no-discount'
                                }`}
                              >
                                {pricing.discount >
                                0
                                  ? `− ${formatCurrency(
                                      pricing.discount,
                                    )}`
                                  : 'No discount'}
                              </span>

                              <strong className="admin-fashion-item-total">
                                {formatCurrency(
                                  pricing.totalPrice,
                                )}
                              </strong>
                            </div>
                          )
                        },
                      )
                    )}
                  </div>
                </section>

                {/* =========================================
                    PAYMENT + PRICE
                ========================================= */}

                <section className="admin-fashion-finance-grid">
                  {/* PAYMENT */}

                  <div className="admin-fashion-finance-card">
                    <span className="admin-fashion-finance-title">
                      PAYMENT INFORMATION
                    </span>

                    {paymentLoading ? (
                      <div className="admin-fashion-payment-loading">
                        Loading payment...
                      </div>
                    ) : (
                      (() => {
                        const payment =
                          getOrderPayment(
                            selectedOrder.id,
                          )

                        if (!payment) {
                          return (
                            <div className="admin-fashion-payment-empty">
                              <strong>
                                No payment record
                                found
                              </strong>

                              <span>
                                Payment data is
                                not available
                                for this order.
                              </span>
                            </div>
                          )
                        }

                        return (
                          <div className="admin-fashion-payment-details">
                            <div>
                              <span>
                                Method
                              </span>

                              <strong>
                                {getPaymentMethodLabel(
                                  payment.payment_method,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Amount
                              </span>

                              <strong>
                                {formatCurrency(
                                  payment.amount,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Status
                              </span>

                              <strong
                                className={`admin-fashion-payment-status ${payment.status}`}
                              >
                                {getPaymentStatusLabel(
                                  payment.status,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Transaction Reference
                              </span>

                              <strong>
                                {payment.transaction_reference || 'Not Available'}
                              </strong>
                            </div>

                          </div>
                        )
                      })()
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="admin-fashion-finance-card">
                    <span className="admin-fashion-finance-title">
                      PRICE SUMMARY
                    </span>

                    <div className="admin-fashion-price-summary">
                      <div>
                        <span>
                          Subtotal
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedOrder.subtotal,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Discount
                        </span>

                        <strong className="discount">
                          −{' '}
                          {formatCurrency(
                            selectedOrder.discount_amount,
                          )}
                        </strong>
                      </div>

                      <div className="total">
                        <span>
                          Total
                        </span>

                        <strong>
                          {formatCurrency(
                            selectedOrder.total_amount,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                {/* =========================================
                    SHIPPING
                ========================================= */}

                <section className="admin-fashion-detail-section">
                  <div className="admin-fashion-detail-section-title">
                    <span>
                      SHIPPING INFORMATION
                    </span>
                  </div>

                  <div className="admin-fashion-shipping-grid">
                    <div>
                      <span>
                        Address
                      </span>

                      <strong>
                        {
                          selectedOrder.shipping_address ||
                          '—'
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        City
                      </span>

                      <strong>
                        {
                          selectedOrder.shipping_city ||
                          '—'
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Pincode
                      </span>

                      <strong>
                        {
                          selectedOrder.shipping_pincode ||
                          '—'
                        }
                      </strong>
                    </div>
                  </div>
                </section>

                {/* =========================================
                    NOTES
                ========================================= */}

                {selectedOrder.notes && (
                  <section className="admin-fashion-detail-section">
                    <div className="admin-fashion-detail-section-title">
                      <span>
                        CUSTOMER NOTES
                      </span>
                    </div>

                    <div className="admin-fashion-notes">
                      {
                        selectedOrder.notes
                      }
                    </div>
                  </section>
                )}

                {selectedOrder.cancellation_reason && (
                  <section className="admin-fashion-detail-section">
                    <div className="admin-fashion-detail-section-title">
                      <span>
                        CANCELLATION REASON
                      </span>
                    </div>

                    <div className="admin-fashion-notes admin-fashion-cancellation-reason-box">
                      {
                        selectedOrder.cancellation_reason
                      }
                    </div>
                  </section>
                )}

                {/* =========================================
                    STATUS UPDATE
                ========================================= */}

                <section className="admin-fashion-status-update">
                  <div>
                    <span>
                      ORDER STATUS
                    </span>

                    <strong>
                      {getStatusLabel(
                        selectedOrder.status,
                      )}
                    </strong>
                  </div>

                  {selectedStatus === 'cancelled' && (
                    <div className="admin-fashion-cancellation-field">
                      <label htmlFor="fashion-cancellation-reason">
                        Cancellation Reason
                      </label>

                      <textarea
                        id="fashion-cancellation-reason"
                        value={cancellationReason}
                        disabled={updatingStatus}
                        onChange={(event) =>
                          setCancellationReason(
                            event.target.value,
                          )
                        }
                        placeholder="Enter the reason for cancelling this order..."
                        rows={4}
                        maxLength={500}
                      />

                      <small>
                        This reason will be visible to the customer.
                      </small>
                    </div>
                  )}

                  <div className="admin-fashion-status-controls">
                    <select
                      value={
                        selectedStatus
                      }
                      disabled={
                        updatingStatus
                      }
                      onChange={(
                        event,
                      ) =>
                        setSelectedStatus(
                          event.target
                            .value as OrderStatus,
                        )
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <button
                      type="button"
                      disabled={
                        updatingStatus ||
                        !selectedStatus ||
                        (selectedStatus === selectedOrder.status &&
                          (selectedStatus !== 'cancelled' ||
                            cancellationReason.trim() ===
                              (selectedOrder.cancellation_reason ?? '').trim()))
                      }
                      onClick={() =>
                        void updateOrderStatus()
                      }
                    >
                      {updatingStatus
                        ? 'Updating...'
                        : 'Update Status'}
                    </button>
                  </div>

                  <small>
                    Last updated{' '}
                    {formatDateTime(
                      selectedOrder.updated_at,
                    )}
                  </small>
                </section>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminFashionBookings