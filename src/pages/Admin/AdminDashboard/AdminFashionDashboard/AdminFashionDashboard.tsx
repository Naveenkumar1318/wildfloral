import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ChevronRight,
  Download,
  ExternalLink,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import { supabase } from '../../../../lib/supabase'

import './AdminFashionDashboard.css'

/* =========================================================
   TYPES
========================================================= */

type FashionOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | string

type FashionDesignImage = {
  image_url: string
  is_primary: boolean
  display_order: number
}

type FashionOrderItem = {
  id: string
  design_id: string
  design_name: string
  size: string
  quantity: number
  unit_price: number
  discount_amount: number
  final_price: number
  fashion_designs?: {
    fashion_design_images?: FashionDesignImage[]
  } | null
}

type FashionOrder = {
  id: string
  order_number: string
  total_amount: number
  status: FashionOrderStatus
  created_at: string
  customer_id: string | null
  fashion_order_items: FashionOrderItem[]
}

type DashboardOrder = {
  id: string
  orderNumber: string
  customerId: string | null
  totalAmount: number
  status: FashionOrderStatus
  createdAt: string
  items: FashionOrderItem[]
  imageUrl: string
  designName: string
  itemCount: number
}

type ProductPerformance = {
  designId: string
  designName: string
  imageUrl: string
  quantity: number
  revenue: number
}

type MonthlyData = {
  month: string
  label: string
  orders: number
  revenue: number
}

type DashboardStats = {
  totalProducts: number
  totalOrders: number
  pendingOrders: number
  monthlyRevenue: number
  monthlyOrders: number
  monthlyCustomers: number
  completedOrders: number
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_STATS: DashboardStats = {
  totalProducts: 0,
  totalOrders: 0,
  pendingOrders: 0,
  monthlyRevenue: 0,
  monthlyOrders: 0,
  monthlyCustomers: 0,
  completedOrders: 0,
}

const MONTH_COUNT = 12

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

function getCurrentMonth(): string {
  const date = new Date()

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function getMonthLabel(
  month: string,
): string {
  const date = new Date(
    `${month}-01T00:00:00`,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return month
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric',
    },
  )
}

function formatCurrency(
  value: number,
): string {
  return `₹${Math.round(
    toNumber(value),
  ).toLocaleString('en-IN')}`
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

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function getMonthKey(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function getStatusLabel(
  status: FashionOrderStatus,
): string {
  switch (
    String(status)
      .trim()
      .toLowerCase()
  ) {
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
      return String(status || 'Unknown')
  }
}

function getStatusClass(
  status: FashionOrderStatus,
): string {
  switch (
    String(status)
      .trim()
      .toLowerCase()
  ) {
    case 'confirmed':
      return 'confirmed'

    case 'processing':
      return 'processing'

    case 'ready':
      return 'ready'

    case 'completed':
      return 'completed'

    case 'cancelled':
      return 'cancelled'

    default:
      return 'pending'
  }
}

function getPrimaryImage(
  item: FashionOrderItem,
): string {
  const images =
    item.fashion_designs
      ?.fashion_design_images ?? []

  const primary =
    images.find(
      (image) =>
        image.is_primary,
    )

  if (primary?.image_url) {
    return primary.image_url
  }

  const ordered =
    images
      .slice()
      .sort(
        (
          first,
          second,
        ) =>
          Number(
            first.display_order,
          ) -
          Number(
            second.display_order,
          ),
      )

  return ordered[0]?.image_url ?? ''
}

/* =========================================================
   ICON
========================================================= */

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminFashionDashboard() {
  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth(),
  )

  const [
    orders,
    setOrders,
  ] = useState<
    DashboardOrder[]
  >([])

  const [
    productPerformance,
    setProductPerformance,
  ] = useState<
    ProductPerformance[]
  >([])

  const [
    monthlyData,
    setMonthlyData,
  ] = useState<
    MonthlyData[]
  >([])

  const [
    stats,
    setStats,
  ] = useState<DashboardStats>(
    EMPTY_STATS,
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    downloading,
    setDownloading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError('')

        try {
          /*
           * Load active fashion products.
           */
          const productsResult =
            await supabase
              .from(
                'fashion_designs',
              )
              .select(
                `
                  id,
                  name,
                  is_active
                `,
              )
              .eq(
                'is_active',
                true,
              )

          if (
            productsResult.error
          ) {
            throw productsResult.error
          }

          /*
           * Load every Fashion shopping order.
           *
           * The customer_id filter is intentionally NOT used
           * here because this is the admin dashboard.
           */
          const ordersResult =
            await supabase
              .from(
                'fashion_orders',
              )
              .select(
                `
                  id,
                  order_number,
                  customer_id,
                  total_amount,
                  status,
                  created_at,
                  fashion_order_items (
                    id,
                    design_id,
                    design_name,
                    size,
                    quantity,
                    unit_price,
                    discount_amount,
                    final_price,
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
              .order(
                'created_at',
                {
                  ascending: false,
                },
              )

          if (
            ordersResult.error
          ) {
            throw ordersResult.error
          }

          const rawOrders =
            (ordersResult.data ??
              []) as FashionOrder[]

          /*
           * Normalize database rows.
           */
          const normalizedOrders =
            rawOrders.map(
              (
                order,
              ): DashboardOrder => {
                const items =
                  Array.isArray(
                    order.fashion_order_items,
                  )
                    ? order.fashion_order_items
                    : []

                const firstItem =
                  items[0]

                const imageUrl =
                  firstItem
                    ? getPrimaryImage(
                        firstItem,
                      )
                    : ''

                const itemCount =
                  items.reduce(
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

                return {
                  id: order.id,

                  orderNumber:
                    order.order_number,

                  customerId:
                    order.customer_id,

                  totalAmount:
                    toNumber(
                      order.total_amount,
                    ),

                  status:
                    order.status,

                  createdAt:
                    order.created_at,

                  items,

                  imageUrl,

                  designName:
                    firstItem
                      ?.design_name ??
                    'Fashion Order',

                  itemCount,
                }
              },
            )

          /*
           * Monthly calculations.
           */
          const selectedMonthOrders =
            normalizedOrders.filter(
              (order) =>
                getMonthKey(
                  order.createdAt,
                ) ===
                selectedMonth,
            )

          const completedMonthlyOrders =
            selectedMonthOrders.filter(
              (order) =>
                String(
                  order.status,
                )
                  .trim()
                  .toLowerCase() !==
                  'cancelled',
            )

          const monthlyRevenue =
            completedMonthlyOrders.reduce(
              (
                total,
                order,
              ) =>
                total +
                order.totalAmount,
              0,
            )

          const monthlyCustomers =
            new Set(
              completedMonthlyOrders
                .map(
                  (
                    order,
                  ) =>
                    order.customerId,
                )
                .filter(Boolean),
            ).size

          /*
           * Pending orders requiring attention.
           */
          const pendingOrders =
            normalizedOrders.filter(
              (order) => {
                const status =
                  String(
                    order.status,
                  )
                    .trim()
                    .toLowerCase()

                return (
                  status ===
                    'pending' ||
                  status ===
                    'confirmed'
                )
              },
            ).length

          /*
           * Product performance for selected month.
           */
          const performanceMap =
            new Map<
              string,
              ProductPerformance
            >()

          completedMonthlyOrders.forEach(
            (order) => {
              order.items.forEach(
                (item) => {
                  const existing =
                    performanceMap.get(
                      item.design_id,
                    )

                  const imageUrl =
                    getPrimaryImage(
                      item,
                    )

                  if (existing) {
                    existing.quantity +=
                      toNumber(
                        item.quantity,
                      )

                    existing.revenue +=
                      toNumber(
                        item.final_price,
                      )

                    if (
                      !existing.imageUrl &&
                      imageUrl
                    ) {
                      existing.imageUrl =
                        imageUrl
                    }

                    return
                  }

                  performanceMap.set(
                    item.design_id,
                    {
                      designId:
                        item.design_id,

                      designName:
                        item.design_name,

                      imageUrl,

                      quantity:
                        toNumber(
                          item.quantity,
                        ),

                      revenue:
                        toNumber(
                          item.final_price,
                        ),
                    },
                  )
                },
              )
            },
          )

          const rankedProducts =
            Array.from(
              performanceMap.values(),
            )
              .sort(
                (
                  first,
                  second,
                ) =>
                  second.revenue -
                    first.revenue ||
                  second.quantity -
                    first.quantity,
              )
              .slice(0, 5)

          /*
           * Monthly revenue history.
           */
          const now =
            new Date()

          const generatedMonths:
            MonthlyData[] = []

          for (
            let index =
              MONTH_COUNT - 1;
            index >= 0;
            index -= 1
          ) {
            const date =
              new Date(
                now.getFullYear(),
                now.getMonth() -
                  index,
                1,
              )

            const month =
              `${date.getFullYear()}-${String(
                date.getMonth() + 1,
              ).padStart(
                2,
                '0',
              )}`

            const monthOrders =
              normalizedOrders.filter(
                (order) =>
                  getMonthKey(
                    order.createdAt,
                  ) === month &&
                  String(
                    order.status,
                  )
                    .trim()
                    .toLowerCase() !==
                    'cancelled',
              )

            generatedMonths.push(
              {
                month,

                label:
                  date.toLocaleDateString(
                    'en-IN',
                    {
                      month:
                        'short',
                      year:
                        'numeric',
                    },
                  ),

                orders:
                  monthOrders.length,

                revenue:
                  monthOrders.reduce(
                    (
                      total,
                      order,
                    ) =>
                      total +
                      order.totalAmount,
                    0,
                  ),
              },
            )
          }

          setOrders(
            normalizedOrders,
          )

          setProductPerformance(
            rankedProducts,
          )

          setMonthlyData(
            generatedMonths,
          )

          setStats({
            totalProducts:
              productsResult.data
                ?.length ?? 0,

            totalOrders:
              normalizedOrders.length,

            pendingOrders,

            monthlyRevenue,

            monthlyOrders:
              completedMonthlyOrders.length,

            monthlyCustomers,

            completedOrders:
              normalizedOrders.filter(
                (order) =>
                  String(
                    order.status,
                  )
                    .trim()
                    .toLowerCase() ===
                  'completed',
              ).length,
          })
        } catch (
          loadError
        ) {
          console.error(
            'Failed to load Fashion Shopping Dashboard:',
            loadError,
          )

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Unable to load Fashion Shopping Dashboard.',
          )

          setOrders([])
          setProductPerformance([])
          setMonthlyData([])
          setStats(
            EMPTY_STATS,
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      [selectedMonth],
    )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  /* =======================================================
     RECENT ORDERS
  ======================================================= */

  const recentOrders =
    useMemo(
      () =>
        orders
          .slice()
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                second.createdAt,
              ).getTime() -
              new Date(
                first.createdAt,
              ).getTime(),
          )
          .slice(0, 5),
      [orders],
    )

  /* =======================================================
     REPORT DOWNLOAD
  ======================================================= */

  const downloadRevenueReport =
    useCallback(
      async () => {
        if (
          downloading ||
          loading
        ) {
          return
        }

        setDownloading(true)
        setError('')

        try {
          const width = 1400
          const margin = 70

          const rowHeight = 54

          const height =
            650 +
            productPerformance.length *
              100 +
            monthlyData.length *
              rowHeight

          const canvas =
            document.createElement(
              'canvas',
            )

          canvas.width =
            width

          canvas.height =
            height

          const context =
            canvas.getContext(
              '2d',
            )

          if (!context) {
            throw new Error(
              'Your browser could not create the report.',
            )
          }

          /*
           * Background.
           */
          context.fillStyle =
            '#ffffff'

          context.fillRect(
            0,
            0,
            width,
            height,
          )

          /*
           * Header.
           */
          context.fillStyle =
            '#edf4e8'

          context.fillRect(
            0,
            0,
            width,
            220,
          )

          context.fillStyle =
            '#29452f'

          context.font =
            '700 18px Arial'

          context.fillText(
            'WILDFLORAL · FASHION SHOPPING',
            margin,
            55,
          )

          context.fillStyle =
            '#203128'

          context.font =
            '400 48px Georgia'

          context.fillText(
            'Monthly revenue report.',
            margin,
            120,
          )

          context.fillStyle =
            '#6c7b72'

          context.font =
            '400 16px Arial'

          context.fillText(
            getMonthLabel(
              selectedMonth,
            ),
            margin,
            160,
          )

          /*
           * Summary.
           */
          let currentY = 270

          const summary = [
            [
              'TOTAL REVENUE',
              formatCurrency(
                stats.monthlyRevenue,
              ),
            ],
            [
              'ORDERS',
              String(
                stats.monthlyOrders,
              ),
            ],
            [
              'CUSTOMERS',
              String(
                stats.monthlyCustomers,
              ),
            ],
          ]

          summary.forEach(
            (
              item,
              index,
            ) => {
              const x =
                margin +
                index * 410

              context.fillStyle =
                '#f6f8f4'

              context.fillRect(
                x,
                currentY,
                370,
                120,
              )

              context.fillStyle =
                '#6d7c73'

              context.font =
                '700 12px Arial'

              context.fillText(
                item[0],
                x + 24,
                currentY + 32,
              )

              context.fillStyle =
                '#29452f'

              context.font =
                '700 28px Arial'

              context.fillText(
                item[1],
                x + 24,
                currentY + 78,
              )
            },
          )

          currentY += 175

          /*
           * Top products.
           */
          context.fillStyle =
            '#29452f'

          context.font =
            '700 15px Arial'

          context.fillText(
            'TOP FASHION PRODUCTS',
            margin,
            currentY,
          )

          currentY += 30

          productPerformance.forEach(
            (
              product,
              index,
            ) => {
              context.fillStyle =
                '#f7f9f6'

              context.fillRect(
                margin,
                currentY,
                width -
                  margin * 2,
                76,
              )

              context.fillStyle =
                '#66853e'

              context.font =
                '700 13px Arial'

              context.fillText(
                String(
                  index + 1,
                ).padStart(
                  2,
                  '0',
                ),
                margin + 18,
                currentY + 32,
              )

              context.fillStyle =
                '#203128'

              context.font =
                '600 15px Arial'

              context.fillText(
                product.designName,
                margin + 70,
                currentY + 30,
              )

              context.fillStyle =
                '#77837b'

              context.font =
                '400 12px Arial'

              context.fillText(
                `${product.quantity} items sold`,
                margin + 70,
                currentY + 53,
              )

              context.fillStyle =
                '#29452f'

              context.font =
                '700 15px Arial'

              context.fillText(
                formatCurrency(
                  product.revenue,
                ),
                width -
                  margin -
                  140,
                currentY + 40,
              )

              currentY += 95
            },
          )

          currentY += 25

          /*
           * Monthly summary.
           */
          context.fillStyle =
            '#29452f'

          context.font =
            '700 15px Arial'

          context.fillText(
            'MONTHLY PERFORMANCE',
            margin,
            currentY,
          )

          currentY += 30

          monthlyData.forEach(
            (month) => {
              context.fillStyle =
                '#203128'

              context.font =
                '400 12px Arial'

              context.fillText(
                month.label,
                margin,
                currentY + 27,
              )

              context.fillText(
                String(
                  month.orders,
                ),
                margin + 260,
                currentY + 27,
              )

              context.fillStyle =
                '#29452f'

              context.font =
                '700 12px Arial'

              context.fillText(
                formatCurrency(
                  month.revenue,
                ),
                margin + 420,
                currentY + 27,
              )

              currentY +=
                rowHeight
            },
          )

          /*
           * Footer.
           */
          context.fillStyle =
            '#f7f9f6'

          context.fillRect(
            0,
            height - 65,
            width,
            65,
          )

          context.fillStyle =
            '#77837b'

          context.font =
            '400 12px Arial'

          context.fillText(
            `WILDFLORAL · FASHION SHOPPING · ${getMonthLabel(
              selectedMonth,
            )}`,
            margin,
            height - 27,
          )

          const imageUrl =
            canvas.toDataURL(
              'image/png',
              1,
            )

          const anchor =
            document.createElement(
              'a',
            )

          anchor.href =
            imageUrl

          anchor.download =
            `wildfloral-fashion-shopping-${selectedMonth}.png`

          document.body.appendChild(
            anchor,
          )

          anchor.click()

          document.body.removeChild(
            anchor,
          )
        } catch (
          downloadError
        ) {
          console.error(
            'Fashion Shopping report error:',
            downloadError,
          )

          setError(
            downloadError instanceof
              Error
              ? downloadError.message
              : 'Unable to create the Fashion Shopping report.',
          )
        } finally {
          setDownloading(false)
        }
      },
      [
        downloading,
        loading,
        monthlyData,
        productPerformance,
        selectedMonth,
        stats,
      ],
    )

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="admin-fashion-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="admin-fashion-header">

        <div className="admin-fashion-header-copy">

          <span className="admin-fashion-eyebrow">
            WILDFLORAL · FASHION STUDIO
          </span>

          <h1>
            Shopping
            <em>
              dashboard.
            </em>
          </h1>

          <p>
            Manage ready-to-shop fashion
            products and customer orders
            from one place.
          </p>

        </div>

        <div className="admin-fashion-header-actions">

          <button
            type="button"
            className="admin-fashion-refresh-button"
            onClick={() =>
              void loadDashboard(true)
            }
            disabled={
              loading ||
              refreshing
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'is-spinning'
                  : ''
              }
            />

            <span>
              {refreshing
                ? 'Refreshing'
                : 'Refresh'}
            </span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-fashion-website-button"
          >
            <ExternalLink
              size={17}
            />

            <span>
              Website
            </span>
          </a>

        </div>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <section className="admin-fashion-error">

          <div>
            <strong>
              Dashboard data could not
              be loaded.
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard(true)
            }
          >
            Try again
          </button>

        </section>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="admin-fashion-section">

        <div className="admin-fashion-section-intro">

          <div>

            <span className="admin-fashion-eyebrow">
              SHOPPING
            </span>

            <h2>
              Fashion shopping
              <em>
                overview.
              </em>
            </h2>

            <p>
              Ready-to-shop fashion
              performance and orders.
            </p>

          </div>

          <div className="admin-fashion-live-date">

            <span>
              LIVE DATA
            </span>

            <strong>
              {getMonthLabel(
                selectedMonth,
              )}
            </strong>

          </div>

        </div>

        <div className="admin-fashion-kpi-grid">

          <article className="admin-fashion-kpi-card">

            <div className="admin-fashion-kpi-icon">
              <Package
                size={20}
              />
            </div>

            <span>
              PRODUCTS
            </span>

            <strong>
              {loading
                ? '—'
                : stats.totalProducts}
            </strong>

            <small>
              Active fashion products
            </small>

          </article>

          <article className="admin-fashion-kpi-card">

            <div className="admin-fashion-kpi-icon">
              <ShoppingBag
                size={20}
              />
            </div>

            <span>
              ORDERS
            </span>

            <strong>
              {loading
                ? '—'
                : stats.totalOrders}
            </strong>

            <small>
              Total shopping orders
            </small>

          </article>

          <article className="admin-fashion-kpi-card">

            <div className="admin-fashion-kpi-icon">
              <RefreshCw
                size={20}
              />
            </div>

            <span>
              PENDING
            </span>

            <strong>
              {loading
                ? '—'
                : stats.pendingOrders}
            </strong>

            <small>
              Orders needing attention
            </small>

          </article>

          <article className="admin-fashion-kpi-card admin-fashion-kpi-revenue">

            <div className="admin-fashion-kpi-icon">
              <TrendingUp
                size={20}
              />
            </div>

            <span>
              MONTHLY REVENUE
            </span>

            <strong>
              {loading
                ? '—'
                : formatCurrency(
                    stats.monthlyRevenue,
                  )}
            </strong>

            <small>
              {getMonthLabel(
                selectedMonth,
              )}
            </small>

          </article>

        </div>

      </section>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <section className="admin-fashion-orders-section">

        <div className="admin-fashion-panel-header">

          <div>

            <span>
              ORDERS
            </span>

            <h2>
              Recent shopping
              <em>
                orders.
              </em>
            </h2>

            <p>
              Latest ready-to-shop
              fashion purchases.
            </p>

          </div>

        </div>

        <div className="admin-fashion-orders-list">

          {loading ? (
            <div className="admin-fashion-empty">
              Loading orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="admin-fashion-empty">

              <ShoppingBag
                size={25}
              />

              <strong>
                No shopping orders yet
              </strong>

              <span>
                Fashion purchases will
                appear here.
              </span>

            </div>
          ) : (
            recentOrders.map(
              (order) => (
                <article
                  key={order.id}
                  className="admin-fashion-order-row"
                >

                  <div className="admin-fashion-order-image">

                    {order.imageUrl ? (
                      <img
                        src={
                          order.imageUrl
                        }
                        alt={
                          order.designName
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        WF
                      </span>
                    )}

                  </div>

                  <div className="admin-fashion-order-info">

                    <span className="admin-fashion-order-number">
                      {order.orderNumber}
                    </span>

                    <strong>
                      {order.designName}
                    </strong>

                    <small>
                      {order.itemCount}{' '}
                      {order.itemCount ===
                      1
                        ? 'item'
                        : 'items'}
                      {' · '}
                      {formatDate(
                        order.createdAt,
                      )}
                    </small>

                  </div>

                  <div className="admin-fashion-order-customer">

                    <Users
                      size={15}
                    />

                    <span>
                      {order.customerId
                        ? 'Customer'
                        : 'Guest'}
                    </span>

                  </div>

                  <div className="admin-fashion-order-meta">

                    <strong>
                      {formatCurrency(
                        order.totalAmount,
                      )}
                    </strong>

                    <span
                      className={`admin-fashion-status ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      {getStatusLabel(
                        order.status,
                      )}
                    </span>

                  </div>

                  <ChevronRight
                    size={18}
                  />

                </article>
              ),
            )
          )}

        </div>

      </section>

      {/* =====================================================
          MONTHLY REVENUE
      ===================================================== */}

      <section className="admin-fashion-revenue-section">

        <div className="admin-fashion-revenue-header">

          <div>

            <span className="admin-fashion-eyebrow">
              PERFORMANCE REPORT
            </span>

            <h2>
              Monthly
              <em>
                revenue.
              </em>
            </h2>

            <p>
              Select a month and download
              the complete Fashion Shopping
              report.
            </p>

          </div>

          <div className="admin-fashion-revenue-controls">

            <label>

              <span>
                REPORT MONTH
              </span>

              <select
                value={
                  selectedMonth
                }
                onChange={(
                  event,
                ) =>
                  setSelectedMonth(
                    event.target.value,
                  )
                }
              >

                {monthlyData.map(
                  (month) => (
                    <option
                      key={
                        month.month
                      }
                      value={
                        month.month
                      }
                    >
                      {
                        month.label
                      }
                    </option>
                  ),
                )}

              </select>

            </label>

            <button
              type="button"
              className="admin-fashion-download-button"
              onClick={() =>
                void downloadRevenueReport()
              }
              disabled={
                loading ||
                downloading
              }
            >

              <Download
                size={18}
              />

              <span>
                {downloading
                  ? 'Creating report...'
                  : 'Download PNG'}
              </span>

            </button>

          </div>

        </div>

        <div className="admin-fashion-revenue-summary">

          <article>

            <span>
              TOTAL REVENUE
            </span>

            <strong>
              {formatCurrency(
                stats.monthlyRevenue,
              )}
            </strong>

            <small>
              {getMonthLabel(
                selectedMonth,
              )}
            </small>

          </article>

          <article>

            <span>
              ORDERS
            </span>

            <strong>
              {stats.monthlyOrders}
            </strong>

            <small>
              Completed / active sales
            </small>

          </article>

          <article>

            <span>
              CUSTOMERS
            </span>

            <strong>
              {stats.monthlyCustomers}
            </strong>

            <small>
              Fashion customers
            </small>

          </article>

        </div>

      </section>

      {/* =====================================================
          TOP PRODUCTS
      ===================================================== */}

      <section className="admin-fashion-products-section">

        <div className="admin-fashion-panel-header">

          <div>

            <span>
              PRODUCT PERFORMANCE
            </span>

            <h2>
              Top 5 Fashion
              <em>
                products.
              </em>
            </h2>

            <p>
              Highest-performing shopping
              products for the selected month.
            </p>

          </div>

          <Link
            to="/admin/services/fashion"
            className="admin-fashion-view-link"
          >
            View products
            <ArrowIcon />
          </Link>

        </div>

        <div className="admin-fashion-product-list">

          {loading ? (
            <div className="admin-fashion-empty">
              Loading product performance...
            </div>
          ) : productPerformance.length ===
            0 ? (
            <div className="admin-fashion-empty">

              <Package
                size={25}
              />

              <strong>
                No product sales
              </strong>

              <span>
                There are no completed
                Fashion shopping transactions
                for this month.
              </span>

            </div>
          ) : (
            productPerformance.map(
              (
                product,
                index,
              ) => (
                <div
                  key={
                    product.designId
                  }
                  className="admin-fashion-product-row"
                >

                  <span className="admin-fashion-product-rank">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div className="admin-fashion-product-image">

                    {product.imageUrl ? (
                      <img
                        src={
                          product.imageUrl
                        }
                        alt={
                          product.designName
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        WF
                      </span>
                    )}

                  </div>

                  <div className="admin-fashion-product-info">

                    <strong>
                      {
                        product.designName
                      }
                    </strong>

                    <span>
                      {
                        product.quantity
                      }{' '}
                      {product.quantity ===
                      1
                        ? 'item'
                        : 'items'}{' '}
                      sold
                    </span>

                  </div>

                  <div className="admin-fashion-product-revenue">

                    <span>
                      REVENUE
                    </span>

                    <strong>
                      {formatCurrency(
                        product.revenue,
                      )}
                    </strong>

                  </div>

                </div>
              ),
            )
          )}

        </div>

      </section>

      {/* =====================================================
          ORDER STATUS
      ===================================================== */}

      <section className="admin-fashion-status-section">

        <div className="admin-fashion-panel-header">

          <div>

            <span>
              ORDER MANAGEMENT
            </span>

            <h2>
              Shopping order
              <em>
                status.
              </em>
            </h2>

            <p>
              Current state of your Fashion
              shopping orders.
            </p>

          </div>

        </div>

        <div className="admin-fashion-status-grid">

          {[
            'pending',
            'confirmed',
            'processing',
            'ready',
            'completed',
          ].map(
            (status) => {

              const count =
                orders.filter(
                  (order) =>
                    String(
                      order.status,
                    )
                      .trim()
                      .toLowerCase() ===
                    status,
                ).length

              return (
                <article
                  key={status}
                  className="admin-fashion-status-card"
                >

                  <span
                    className={`admin-fashion-status-dot ${getStatusClass(
                      status,
                    )}`}
                  />

                  <span>
                    {getStatusLabel(
                      status,
                    )}
                  </span>

                  <strong>
                    {count}
                  </strong>

                </article>
              )
            },
          )}

        </div>

      </section>

      {/* =====================================================
          FUTURE CUSTOMIZATION
      ===================================================== */}

      <section className="admin-fashion-future-section">

        <div>

          <span className="admin-fashion-eyebrow">
            FUTURE FEATURE
          </span>

          <h2>
            Customization
            <em>
              coming soon.
            </em>
          </h2>

          <p>
            Personalized fashion enquiries,
            measurements, custom orders and
            production management will be
            introduced separately.
          </p>

        </div>

        <div className="admin-fashion-future-badge">
          COMING SOON
        </div>

      </section>

    </main>
  )
}

export default AdminFashionDashboard