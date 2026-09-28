import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import { supabase } from '../../../../lib/supabase'

import {
  getFashionCartCount,
} from '../../../../lib/fashionCart'

import './CustomerFashionDashboard.css'

type DashboardMode = 'fashion' | 'custom'

type FashionOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'

type FashionOrderItem = {
  id: string
  design_name: string
  quantity: number
  final_price: number
  size: string
  image_url: string
}

type FashionOrder = {
  id: string
  order_number: string
  total_amount: number
  status: FashionOrderStatus
  created_at: string
  items: FashionOrderItem[]
}

type MonthlyOrder = {
  monthKey: string
  monthLabel: string
  orders: FashionOrder[]
}

const RECENT_ORDER_LIMIT = 5

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getMonthKey(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function getMonthLabel(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function getStatusLabel(
  status: FashionOrderStatus,
): string {
  switch (status) {
    case 'pending':
      return 'Pending'

    case 'confirmed':
      return 'Confirmed'

    case 'processing':
      return 'Processing'

    case 'ready':
      return 'Ready'

    case 'completed':
      return 'Completed'

    case 'cancelled':
      return 'Cancelled'

    default:
      return status
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function CustomerFashionDashboard() {
  const [
    mode,
    setMode,
  ] = useState<DashboardMode>('fashion')

  const [
    orders,
    setOrders,
  ] = useState<FashionOrder[]>([])

  const [
    cartCount,
    setCartCount,
  ] = useState(0)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    selectedMonthIndex,
    setSelectedMonthIndex,
  ] = useState(0)

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async () => {
      setLoading(true)
      setError('')

      try {
        const {
          data: {
            user,
          },
          error: authError,
        } =
          await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!user) {
          setOrders([])
          setCartCount(
            getFashionCartCount(),
          )
          setLoading(false)

          return
        }

        const {
          data,
          error: ordersError,
        } =
          await supabase
            .from('fashion_orders')
            .select(
              `
                id,
                order_number,
                total_amount,
                status,
                created_at,
                fashion_order_items (
                  id,
                  design_name,
                  quantity,
                  final_price,
                  size,
                  design_id,
                  fashion_designs (
                    fashion_design_images (
                      image_url,
                      is_primary,
                      display_order
                    )
                  )
                )
              `,
            )
            .eq(
              'customer_id',
              user.id,
            )
            .order(
              'created_at',
              {
                ascending: false,
              },
            )

        if (ordersError) {
          throw ordersError
        }

        const normalizedOrders: FashionOrder[] =
  (data ?? []).map(
    (order) => ({
      id: order.id,
      order_number:
        order.order_number,
      total_amount:
        Number(
          order.total_amount ?? 0,
        ),
      status:
        order.status as FashionOrderStatus,
      created_at:
        order.created_at,
      items:
        Array.isArray(
          order.fashion_order_items,
        )
          ? order.fashion_order_items.map(
              (item) => {
                const design =
                  Array.isArray(
                    item.fashion_designs,
                  )
                    ? item.fashion_designs[0]
                    : item.fashion_designs

                const images =
                  Array.isArray(
                    design?.fashion_design_images,
                  )
                    ? design.fashion_design_images
                    : []

                const primaryImage =
                  images.find(
                    (image) =>
                      image.is_primary === true,
                  ) ??
                  images
                    .slice()
                    .sort(
                      (
                        first,
                        second,
                      ) =>
                        Number(
                          first.display_order ?? 0,
                        ) -
                        Number(
                          second.display_order ?? 0,
                        ),
                    )[0]

                return {
                  id: item.id,
                  design_name:
                    item.design_name,
                  quantity:
                    Number(
                      item.quantity ?? 0,
                    ),
                  final_price:
                    Number(
                      item.final_price ?? 0,
                    ),
                  size: item.size,
                  image_url:
                    primaryImage?.image_url ?? '',
                }
              },
            )
          : [],
    }),
  )

        setOrders(
          normalizedOrders,
        )

        setCartCount(
          getFashionCartCount(),
        )
      } catch (loadError) {
        console.error(
          'Customer fashion dashboard error:',
          loadError,
        )

        setError(
          'We could not load your fashion dashboard. Please try again.',
        )

        setOrders([])

        setCartCount(
          getFashionCartCount(),
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  /* =======================================================
     CART REFRESH
  ======================================================= */

  useEffect(() => {
    function handleStorageChange() {
      setCartCount(
        getFashionCartCount(),
      )
    }

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    window.addEventListener(
      'fashion-cart-updated',
      handleStorageChange,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange,
      )

      window.removeEventListener(
        'fashion-cart-updated',
        handleStorageChange,
      )
    }
  }, [])

  /* =======================================================
     TOTAL ORDERS
  ======================================================= */

  const totalOrders =
    orders.length

  /* =======================================================
     RECENT ORDERS
     MAXIMUM 5
  ======================================================= */

  const recentOrders =
    useMemo(() => {
      return orders
        .slice()
        .sort(
          (first, second) =>
            new Date(
              second.created_at,
            ).getTime() -
            new Date(
              first.created_at,
            ).getTime(),
        )
        .slice(
          0,
          RECENT_ORDER_LIMIT,
        )
    }, [orders])

  /* =======================================================
     MONTHLY ORDERS
  ======================================================= */

  const monthlyOrders =
    useMemo<MonthlyOrder[]>(() => {
      const groups =
        new Map<
          string,
          MonthlyOrder
        >()

      orders.forEach(
        (order) => {
          const monthKey =
            getMonthKey(
              order.created_at,
            )

          if (!monthKey) {
            return
          }

          const existing =
            groups.get(
              monthKey,
            )

          if (existing) {
            existing.orders.push(
              order,
            )

            return
          }

          groups.set(
            monthKey,
            {
              monthKey,
              monthLabel:
                getMonthLabel(
                  order.created_at,
                ),
              orders: [order],
            },
          )
        },
      )

      return Array.from(
        groups.values(),
      ).sort(
        (first, second) =>
          second.monthKey.localeCompare(
            first.monthKey,
          ),
      )
    }, [orders])

  /* =======================================================
     CURRENT MONTH
  ======================================================= */

  const currentMonth =
    monthlyOrders[
      selectedMonthIndex
    ]

  /* =======================================================
     MONTH PAGINATION
  ======================================================= */

  const canGoOlderMonth =
    selectedMonthIndex <
    monthlyOrders.length - 1

  const canGoNewerMonth =
    selectedMonthIndex > 0

  function goOlderMonth() {
    if (!canGoOlderMonth) {
      return
    }

    setSelectedMonthIndex(
      (current) =>
        current + 1,
    )
  }

  function goNewerMonth() {
    if (!canGoNewerMonth) {
      return
    }

    setSelectedMonthIndex(
      (current) =>
        current - 1,
    )
  }

  /* =======================================================
     MODE SWITCH
  ======================================================= */

  function switchMode(
    nextMode: DashboardMode,
  ) {
    setMode(nextMode)
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="customer-fashion-dashboard">
        <div className="fashion-dashboard-state">
          <div className="fashion-state-spinner" />

          <h2>
            Loading your fashion journey
          </h2>

          <p>
            Please wait while we load your
            latest fashion activity.
          </p>
        </div>
      </main>
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="customer-fashion-dashboard">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="fashion-dashboard-hero">

        <div className="fashion-dashboard-hero-content">

          <span className="fashion-dashboard-eyebrow">
            WILDFLORAL / FASHION
          </span>

          <h1>
            {mode === 'fashion' ? (
              <>
                Your Fashion
                <span>
                  Journey.
                </span>
              </>
            ) : (
              <>
                Your Custom
                <span>
                  Journey.
                </span>
              </>
            )}
          </h1>

          <p>
            {mode === 'fashion'
              ? 'Discover fashion created around you.'
              : 'Create something made specifically for you.'}
          </p>

          <div className="fashion-dashboard-mode-switch">

            <button
              type="button"
              className={
                mode === 'fashion'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                switchMode(
                  'fashion',
                )
              }
            >
              Shop Fashion
            </button>

            <button
              type="button"
              className={
                mode === 'custom'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                switchMode(
                  'custom',
                )
              }
            >
              Custom Order
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <section className="fashion-dashboard-error">

          <div>
            <strong>
              Something went wrong
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
          >
            Try Again
          </button>

        </section>
      )}

      {/* =====================================================
          FASHION MODE
      ===================================================== */}

      {mode === 'fashion' && (
        <>
          {/* =================================================
              FASHION OVERVIEW
          ================================================= */}

          <section className="fashion-dashboard-overview">

            <article className="fashion-overview-card">

              <div className="fashion-overview-icon">
                <span>
                  □
                </span>
              </div>

              <div className="fashion-overview-content">

                <span className="fashion-overview-label">
                  ORDERS
                </span>

                <strong>
                  {totalOrders}
                </strong>

                <p>
                  Total Orders
                </p>

              </div>

            </article>

            <article className="fashion-overview-card">

              <div className="fashion-overview-icon">
                <span>
                  ◇
                </span>
              </div>

              <div className="fashion-overview-content">

                <span className="fashion-overview-label">
                  CART
                </span>

                <strong>
                  {cartCount}
                </strong>

                <p>
                  Items
                </p>

              </div>

            </article>

            <article className="fashion-overview-card">

              <div className="fashion-overview-icon">
                <span>
                  ♡
                </span>
              </div>

              <div className="fashion-overview-content">

                <span className="fashion-overview-label">
                  SAVED
                </span>

                <strong>
                  0
                </strong>

                <p>
                  Items
                </p>

              </div>

            </article>

          </section>

          {/* =================================================
              ORDERS
          ================================================= */}

          <section className="fashion-dashboard-panel">

            <div className="fashion-panel-heading">

              <div>
                <span className="fashion-panel-eyebrow">
                  ORDERS
                </span>

                <h2>
                  Your Orders
                </h2>

                <p>
                  Track your ready-to-shop
                  fashion purchases.
                </p>
              </div>

              <Link
                to="/account/bookings/fashion"
                className="fashion-section-link"
              >
                View All
                <span>
                  →
                </span>
              </Link>

            </div>

            <div className="fashion-orders-layout">

              {/* =================================================
                  RECENT ORDERS
              ================================================= */}

              <article className="fashion-orders-box">

                <div className="fashion-box-header">

                  <div>
                    <span>
                      ORDERS
                    </span>

                    <h3>
                      Recent Orders
                    </h3>
                  </div>

                  <strong>
                    {Math.min(
                      totalOrders,
                      5,
                    )}
                  </strong>

                </div>

                {recentOrders.length > 0 ? (
                  <div className="fashion-order-list">

                    {recentOrders.map(
                      (order) => (
                        <article
                          key={order.id}
                          className="fashion-order-card"
                        >

                          <div className="fashion-order-image">
                            {order.items[0]?.image_url ? (
                              <img
                                src={order.items[0].image_url}
                                alt={order.items[0].design_name}
                                loading="lazy"
                              />
                            ) : (
                              <span>WF</span>
                            )}
                          </div>

                          <div className="fashion-order-info">

                            <span className="fashion-order-id">
                              {order.order_number}
                            </span>

                            <h4>
                              {order.items[0]
                                ?.design_name ??
                                'Fashion Order'}
                            </h4>

                            <p>
                              {order.items.reduce(
                                (
                                  total,
                                  item,
                                ) =>
                                  total +
                                  item.quantity,
                                0,
                              )}{' '}
                              {order.items.reduce(
                                (
                                  total,
                                  item,
                                ) =>
                                  total +
                                  item.quantity,
                                0,
                              ) === 1
                                ? 'item'
                                : 'items'}
                            </p>

                          </div>

                          <div className="fashion-order-meta">

                            <strong>
                              {formatCurrency(
                                order.total_amount,
                              )}
                            </strong>

                            <span
                              className={`fashion-order-status ${order.status}`}
                            >
                              {getStatusLabel(
                                order.status,
                              )}
                            </span>

                          </div>

                          <Link
                            to="/account/bookings/fashion"
                            className="fashion-order-view"
                          >
                            View
                            <span>
                              →
                            </span>
                          </Link>

                        </article>
                      ),
                    )}

                  </div>
                ) : (
                  <div className="fashion-small-empty">

                    <div className="fashion-empty-icon">
                      □
                    </div>

                    <h4>
                      No orders yet
                    </h4>

                    <p>
                      Your fashion purchases
                      will appear here after
                      you place an order.
                    </p>

                    <Link
                      to="/fashion"
                      className="fashion-empty-button"
                    >
                      Shop Fashion
                      <span>
                        →
                      </span>
                    </Link>

                  </div>
                )}

              </article>

              {/* =================================================
                  ORDERS BY MONTH
              ================================================= */}

              <article className="fashion-orders-box">

                <div className="fashion-box-header">

                  <div>
                    <span>
                      MONTHLY ACTIVITY
                    </span>

                    <h3>
                      Orders by Month
                    </h3>
                  </div>

                  {currentMonth && (
                    <div className="fashion-month-controls">

                      <button
                        type="button"
                        onClick={
                          goOlderMonth
                        }
                        disabled={
                          !canGoOlderMonth
                        }
                        aria-label="Previous month"
                      >
                        ←
                      </button>

                      <span>
                        {currentMonth.monthLabel}
                      </span>

                      <button
                        type="button"
                        onClick={
                          goNewerMonth
                        }
                        disabled={
                          !canGoNewerMonth
                        }
                        aria-label="Next month"
                      >
                        →
                      </button>

                    </div>
                  )}

                </div>

                {currentMonth ? (
                  <div className="fashion-month-content">

                    <div className="fashion-month-stat">

                      <span>
                        ORDERS
                      </span>

                      <strong>
                        {
                          currentMonth
                            .orders
                            .length
                        }
                      </strong>

                    </div>

                    <div className="fashion-month-order-list">

                      {currentMonth.orders
                        .slice(0, 5)
                        .map(
                          (order) => (
                            <article
                              key={
                                order.id
                              }
                              className="fashion-month-order"
                            >

                              <div className="fashion-order-image">
  {order.items[0]?.image_url ? (
    <img
      src={order.items[0].image_url}
      alt={
        order.items[0].design_name
      }
      loading="lazy"
    />
  ) : (
    <span>WF</span>
  )}
</div>

                              <div>
                                <strong>
                                  {order.items[0]
                                    ?.design_name ??
                                    'Fashion Order'}
                                </strong>

                                <span>
                                  {getStatusLabel(
                                    order.status,
                                  )}
                                </span>
                              </div>

                              <b>
                                {formatCurrency(
                                  order.total_amount,
                                )}
                              </b>

                            </article>
                          ),
                        )}

                    </div>

                    {currentMonth.orders
                      .length > 5 && (
                      <Link
                        to="/account/bookings/fashion"
                        className="fashion-section-link fashion-month-view-all"
                      >
                        View All
                        <span>
                          →
                        </span>
                      </Link>
                    )}

                  </div>
                ) : (
                  <div className="fashion-small-empty">

                    <div className="fashion-empty-icon">
                      ◷
                    </div>

                    <h4>
                      No monthly activity
                    </h4>

                    <p>
                      Your order activity
                      by month will appear
                      here.
                    </p>

                  </div>
                )}

              </article>

            </div>

          </section>
        </>
      )}

      {/* =====================================================
          CUSTOM MODE
      ===================================================== */}

      {mode === 'custom' && (
        <>
          {/* =================================================
              CUSTOM OVERVIEW
          ================================================= */}

          <section className="fashion-dashboard-overview fashion-custom-overview">

            <article className="fashion-overview-card">

              <div className="fashion-overview-icon">
                <span>
                  ◇
                </span>
              </div>

              <div className="fashion-overview-content">

                <span className="fashion-overview-label">
                  CUSTOM ORDERS
                </span>

                <strong>
                  0
                </strong>

                <p>
                  Active Orders
                </p>

              </div>

            </article>

            <article className="fashion-overview-card">

              <div className="fashion-overview-icon">
                <span>
                  ?
                </span>
              </div>

              <div className="fashion-overview-content">

                <span className="fashion-overview-label">
                  CUSTOM ENQUIRIES
                </span>

                <strong>
                  0
                </strong>

                <p>
                  Total Enquiries
                </p>

              </div>

            </article>

          </section>

          {/* =================================================
              CUSTOM ORDERS
          ================================================= */}

          <section className="fashion-dashboard-panel">

            <div className="fashion-panel-heading">

              <div>
                <span className="fashion-panel-eyebrow">
                  CUSTOMIZATION
                </span>

                <h2>
                  Your Custom Orders
                </h2>

                <p>
                  Personalized fashion created
                  specifically for you.
                </p>
              </div>

              <Link
                to="/enquiry"
                className="fashion-section-link"
              >
                Start Custom Order
                <span>
                  →
                </span>
              </Link>

            </div>

            <div className="fashion-custom-grid">

              {/* =================================================
                  OUR CUSTOM ORDERS
              ================================================= */}

              <article className="fashion-custom-box">

                <div className="fashion-custom-box-header">

                  <div>
                    <span>
                      CUSTOM ORDERS
                    </span>

                    <h3>
                      Our Custom Orders
                    </h3>
                  </div>

                  <strong>
                    0
                  </strong>

                </div>

                <div className="fashion-custom-empty">

                  <div className="fashion-empty-icon">
                    ◇
                  </div>

                  <h4>
                    No custom orders yet
                  </h4>

                  <p>
                    Your accepted customization
                    orders will appear here.
                  </p>

                  <Link
                    to="/enquiry"
                    className="fashion-empty-button"
                  >
                    Create Custom Order
                    <span>
                      →
                    </span>
                  </Link>

                </div>

              </article>

              {/* =================================================
                  UPCOMING ENQUIRIES
              ================================================= */}

              <article className="fashion-custom-box">

                <div className="fashion-custom-box-header">

                  <div>
                    <span>
                      ENQUIRIES
                    </span>

                    <h3>
                      Our Upcoming Enquiries
                    </h3>
                  </div>

                  <strong>
                    0
                  </strong>

                </div>

                <div className="fashion-custom-empty">

                  <div className="fashion-empty-icon">
                    ?
                  </div>

                  <h4>
                    No upcoming enquiries
                  </h4>

                  <p>
                    Your active customization
                    enquiries will appear here.
                  </p>

                </div>

              </article>

              {/* =================================================
                  COMPLETED ENQUIRIES
              ================================================= */}

              <article className="fashion-custom-box">

                <div className="fashion-custom-box-header">

                  <div>
                    <span>
                      HISTORY
                    </span>

                    <h3>
                      Completed Enquiries
                    </h3>
                  </div>

                  <strong>
                    0
                  </strong>

                </div>

                <div className="fashion-custom-empty">

                  <div className="fashion-empty-icon">
                    ✓
                  </div>

                  <h4>
                    No completed enquiries
                  </h4>

                  <p>
                    Completed customization
                    enquiries will appear here.
                  </p>

                </div>

              </article>

              {/* =================================================
                  ACTIVE BY MONTH
              ================================================= */}

              <article className="fashion-custom-box">

                <div className="fashion-custom-box-header">

                  <div>
                    <span>
                      MONTHLY ACTIVITY
                    </span>

                    <h3>
                      Active by Month
                    </h3>
                  </div>

                  <strong>
                    0
                  </strong>

                </div>

                <div className="fashion-custom-empty">

                  <div className="fashion-empty-icon">
                    ◷
                  </div>

                  <h4>
                    No custom activity
                  </h4>

                  <p>
                    Your custom enquiry activity
                    by month will appear here.
                  </p>

                </div>

              </article>

            </div>

          </section>
        </>
      )}

    </main>
  )
}

export default CustomerFashionDashboard