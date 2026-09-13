import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import {
  getServices,
  type Service,
} from "../../../../lib/services";

import { supabase } from "../../../../lib/supabase";

import "./AdminBeautyDashboard.css";
/* =========================================================
   TYPES
========================================================= */

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'canceled'
  | 'rejected'
  | string

type BookingRow = {
  id: string
  customer_id: string | null
  service_id: string | null
  booking_date: string
  booking_time: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  price: number | string | null
  status: BookingStatus | null
  created_at: string
}

type BookingItemRow = {
  id: string
  booking_id: string
  service_id: string
  service_name: string
  price: number | string | null
  duration_minutes: number | string | null
}

type OPRevenueRow = {
  id: string
  grand_total: number | string | null
  visit_date: string
}

type OPPersonRow = {
  id: string
  op_customer_id: string
}

type OPServiceRow = {
  op_customer_person_id: string
  service_id: string | null
  service_name: string | null
  final_price: number | string | null
  created_at: string
}

type EnquiryRow = {
  id: string
  preferred_date: string | null
  preferred_time: string | null
  total_amount: number | string | null
  status: string | null
  created_at: string
}

type OfferRow = {
  id: string
  title: string
  description: string | null
  discount_type:
    | 'percentage'
    | 'fixed'
    | string
  discount_value:
    | number
    | string
    | null
  starts_at: string
  ends_at: string | null
  is_active: boolean
  priority:
    | number
    | string
    | null
  promo_code: string | null
  image_url: string | null
}

type DashboardBooking =
  BookingRow & {
    serviceName: string
    serviceImage: string | null
  }

type DailyRevenue = {
  date: string
  bookings: number
  walkIns: number
  services: number
  bookingRevenue: number
  walkInRevenue: number
  revenue: number
}

type ServicePerformance = {
  serviceId: string
  serviceName: string
  imageUrl: string | null
  bookings: number
  revenue: number
}

type DashboardStats = {
  todayAppointments: number
  todayCompleted: number
  todayPending: number

  todayEnquiries: number
  todayNewEnquiries: number

  upcomingAppointments: number
  upcomingEnquiries: number

  todayWalkIns: number
  todayWalkInRevenue: number

  totalRevenue: number

  selectedMonthBookings: number
  selectedMonthWalkIns: number
  selectedMonthBookingRevenue: number
  selectedMonthWalkInRevenue: number
  selectedMonthRevenue: number
}

type MonthOption = {
  value: string
  label: string
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_STATS: DashboardStats = {
  todayAppointments: 0,
  todayCompleted: 0,
  todayPending: 0,

  todayEnquiries: 0,
  todayNewEnquiries: 0,

  upcomingAppointments: 0,
  upcomingEnquiries: 0,

  todayWalkIns: 0,
  todayWalkInRevenue: 0,

  totalRevenue: 0,

  selectedMonthBookings: 0,
  selectedMonthWalkIns: 0,
  selectedMonthBookingRevenue: 0,
  selectedMonthWalkInRevenue: 0,
  selectedMonthRevenue: 0,
}

const MONTH_COUNT = 12

/* =========================================================
   HELPERS
========================================================= */

function toNumber(
  value:
    | number
    | string
    | null
    | undefined,
): number {
  const result = Number(value)

  if (
    !Number.isFinite(result) ||
    result < 0
  ) {
    return 0
  }

  return result
}

function getToday(): string {
  const date = new Date()

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
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
  const date =
    new Date(
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
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
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

function formatShortDate(
  value: string,
): string {
  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
    },
  )
}

function formatTime(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const [
    hours,
    minutes,
  ] = value.split(':')

  const date = new Date()

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0,
  )

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )
}

function getStatusLabel(
  status: BookingStatus | null,
): string {
  const value =
    String(
      status ?? '',
    )
      .trim()
      .toLowerCase()

  switch (value) {
    case 'pending':
      return 'Pending'

    case 'confirmed':
      return 'Confirmed'

    case 'completed':
      return 'Completed'

    case 'cancelled':
    case 'canceled':
      return 'Cancelled'

    case 'rejected':
      return 'Rejected'

    default:
      return value || 'Unknown'
  }
}

function getStatusClass(
  status: BookingStatus | null,
): string {
  const value =
    String(
      status ?? '',
    )
      .trim()
      .toLowerCase()

  if (
    value === 'confirmed'
  ) {
    return 'confirmed'
  }

  if (
    value === 'completed'
  ) {
    return 'completed'
  }

  if (
    value === 'cancelled' ||
    value === 'canceled'
  ) {
    return 'cancelled'
  }

  if (
    value === 'rejected'
  ) {
    return 'rejected'
  }

  return 'pending'
}

function isCancelled(
  status: BookingStatus | null,
): boolean {
  const value =
    String(
      status ?? '',
    )
      .trim()
      .toLowerCase()

  return (
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  )
}

function isRevenueBooking(
  status: BookingStatus | null,
): boolean {
  return (
    String(
      status ?? '',
    )
      .trim()
      .toLowerCase() ===
    'completed'
  )
}

function isFutureAppointment(
  booking: BookingRow,
): boolean {
  if (
    isCancelled(
      booking.status,
    ) ||
    String(
      booking.status ?? '',
    ).toLowerCase() ===
      'completed'
  ) {
    return false
  }

  if (
    !booking.booking_date
  ) {
    return false
  }

  const appointment =
    new Date(
      `${booking.booking_date}T${
        booking.booking_time ??
        '00:00'
      }`,
    )

  return (
    appointment.getTime() >=
    Date.now()
  )
}

function getOfferStatus(
  offer: OfferRow,
): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (!offer.is_active) {
    return 'inactive'
  }

  const now =
    Date.now()

  const start =
    new Date(
      offer.starts_at,
    ).getTime()

  const end =
    offer.ends_at
      ? new Date(
          offer.ends_at,
        ).getTime()
      : null

  if (
    Number.isFinite(start) &&
    now < start
  ) {
    return 'scheduled'
  }

  if (
    end !== null &&
    Number.isFinite(end) &&
    now > end
  ) {
    return 'expired'
  }

  return 'active'
}

function getOfferDiscount(
  offer: OfferRow,
): string {
  const value =
    toNumber(
      offer.discount_value,
    )

  if (
    offer.discount_type ===
    'percentage'
  ) {
    return `${value}% OFF`
  }

  return `${formatCurrency(
    value,
  )} OFF`
}

function getOfferRemaining(
  endsAt: string | null,
): string {
  if (!endsAt) {
    return 'No expiry'
  }

  const difference =
    new Date(
      endsAt,
    ).getTime() -
    Date.now()

  if (
    difference <= 0
  ) {
    return 'Expired'
  }

  const days =
    Math.ceil(
      difference /
        (1000 * 60 * 60 * 24),
    )

  return days === 1
    ? '1 day left'
    : `${days} days left`
}

/* =========================================================
   SVG ICONS
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

function AdminBeautyDashboard() {
  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth(),
  )

  const [
    bookings,
    setBookings,
  ] = useState<
    DashboardBooking[]
  >([])

  const [
    services,
    setServices,
  ] = useState<Service[]>([])

  const [
    enquiries,
    setEnquiries,
  ] = useState<
    EnquiryRow[]
  >([])

  const [
    offers,
    setOffers,
  ] = useState<
    OfferRow[]
  >([])

  const [
    stats,
    setStats,
  ] = useState<DashboardStats>(
    EMPTY_STATS,
  )

  const [
    dailyRevenue,
    setDailyRevenue,
  ] = useState<
    DailyRevenue[]
  >([])

  const [
    topServices,
    setTopServices,
  ] = useState<
    ServicePerformance[]
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
    downloading,
    setDownloading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  /* =======================================================
     SERVICE MAP
  ======================================================= */

  const serviceMap =
    useMemo(
      () =>
        new Map(
          services.map(
            (
              service,
            ) => [
              service.id,
              service,
            ],
          ),
        ),
      [services],
    )

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
          const [
            servicesResult,
            bookingsResult,
            bookingItemsResult,
            opCustomersResult,
            opPersonsResult,
            opServicesResult,
            enquiriesResult,
            offersResult,
          ] =
            await Promise.all([
              getServices(),

              supabase
                .from('bookings')
                .select(
                  `
                    id,
                    customer_id,
                    service_id,
                    booking_date,
                    booking_time,
                    customer_name,
                    customer_email,
                    customer_phone,
                    price,
                    status,
                    created_at
                  `,
                )
                .order(
                  'booking_date',
                  {
                    ascending: true,
                  },
                )
                .order(
                  'booking_time',
                  {
                    ascending: true,
                  },
                ),

              supabase
                .from('booking_items')
                .select(
                  `
                    id,
                    booking_id,
                    service_id,
                    service_name,
                    price,
                    duration_minutes
                  `,
                ),

              supabase
                .from('op_customers')
                .select(
                  `
                    id,
                    grand_total,
                    visit_date
                  `,
                ),

              supabase
                .from('op_customer_people')
                .select(
                  `
                    id,
                    op_customer_id
                  `,
                ),

              supabase
                .from('op_customer_services')
                .select(
                  `
                    op_customer_person_id,
                    service_id,
                    service_name,
                    final_price,
                    created_at
                  `,
                ),

              supabase
                .from('enquiries')
                .select(
                  `
                    id,
                    preferred_date,
                    preferred_time,
                    total_amount,
                    status,
                    created_at
                  `,
                )
                .order(
                  'created_at',
                  {
                    ascending: false,
                  },
                ),

              supabase
                .from('offers')
                .select(
                  `
                    id,
                    title,
                    description,
                    discount_type,
                    discount_value,
                    starts_at,
                    ends_at,
                    is_active,
                    priority,
                    promo_code,
                    image_url
                  `,
                )
                .eq(
                  'service_group',
                  'beauty',
                )
                .order(
                  'priority',
                  {
                    ascending: false,
                  },
                )
                .order(
                  'created_at',
                  {
                    ascending: false,
                  },
                ),
            ])

          if (servicesResult instanceof Error) {
            throw servicesResult
          }

          if (bookingsResult.error) {
            throw new Error(
              bookingsResult.error.message,
            )
          }

          if (
            bookingItemsResult.error
          ) {
            throw new Error(
              bookingItemsResult.error.message,
            )
          }

          if (
            opCustomersResult.error
          ) {
            throw new Error(
              opCustomersResult.error.message,
            )
          }

          if (
            opPersonsResult.error
          ) {
            throw new Error(
              opPersonsResult.error.message,
            )
          }

          if (
            opServicesResult.error
          ) {
            throw new Error(
              opServicesResult.error.message,
            )
          }

          if (
            enquiriesResult.error
          ) {
            throw new Error(
              enquiriesResult.error.message,
            )
          }

          if (
            offersResult.error
          ) {
            throw new Error(
              offersResult.error.message,
            )
          }

          const loadedServices =
            servicesResult

          const loadedBookingRows =
            (bookingsResult.data ??
              []) as BookingRow[]

          const loadedBookingItems =
            (bookingItemsResult.data ??
              []) as BookingItemRow[]

          const loadedOPCustomers =
            (opCustomersResult.data ??
              []) as OPRevenueRow[]

          const loadedOPPersons =
            (opPersonsResult.data ??
              []) as OPPersonRow[]

          const loadedOPServices =
            (opServicesResult.data ??
              []) as OPServiceRow[]

          const loadedEnquiries =
            (enquiriesResult.data ??
              []) as EnquiryRow[]

          const loadedOffers =
            (offersResult.data ??
              []) as OfferRow[]

          const beautyBookings =
            loadedBookingRows
              .filter(
                (
                  booking,
                ) =>
                  Boolean(
                    serviceMap.size ===
                      0 ||
                    serviceMap.has(
                      booking.service_id ??
                        '',
                    ),
                  ),
              )
              .map(
                (
                  booking,
                ): DashboardBooking => {
                  const service =
                    loadedServices.find(
                      (
                        item,
                      ) =>
                        item.id ===
                        booking.service_id,
                    )

                  return {
                    ...booking,
                    serviceName:
                      service?.name ??
                      'Beauty Service',
                    serviceImage:
                      service?.imageUrl ??
                      null,
                  }
                },
              )

          const today =
            getToday()

          const todayBookings =
            beautyBookings.filter(
              (
                booking,
              ) =>
                booking.booking_date ===
                today &&
                !isCancelled(
                  booking.status,
                ),
            )

          const todayCompleted =
            todayBookings.filter(
              (
                booking,
              ) =>
                String(
                  booking.status ??
                    '',
                ).toLowerCase() ===
                'completed',
            )

          const todayPending =
            todayBookings.filter(
              (
                booking,
              ) =>
                String(
                  booking.status ??
                    '',
                ).toLowerCase() ===
                'pending',
            )

          const todayEnquiries =
            loadedEnquiries.filter(
              (
                enquiry,
              ) =>
                enquiry.preferred_date ===
                today,
            )

          const todayNewEnquiries =
            todayEnquiries.filter(
              (
                enquiry,
              ) =>
                String(
                  enquiry.status ??
                    '',
                ).toLowerCase() ===
                'new',
            )

          const upcomingBookings =
            beautyBookings.filter(
              (
                booking,
              ) =>
                isFutureAppointment(
                  booking,
                ),
            )

          const upcomingEnquiryRows =
            loadedEnquiries.filter(
              (
                enquiry,
              ) => {
                if (
                  !enquiry.preferred_date
                ) {
                  return false
                }

                return (
                  new Date(
                    `${enquiry.preferred_date}T${
                      enquiry.preferred_time ??
                      '00:00'
                    }`,
                  ).getTime() >=
                  Date.now()
                )
              },
            )

          const todayWalkIns =
            loadedOPCustomers.filter(
              (
                customer,
              ) =>
                customer.visit_date ===
                today,
            )

          const todayWalkInRevenue =
            todayWalkIns.reduce(
              (
                total,
                customer,
              ) =>
                total +
                toNumber(
                  customer.grand_total,
                ),
              0,
            )

          const completedBookings =
            beautyBookings.filter(
              (
                booking,
              ) =>
                isRevenueBooking(
                  booking.status,
                ),
            )

          const totalBookingRevenue =
            completedBookings.reduce(
              (
                total,
                booking,
              ) =>
                total +
                toNumber(
                  booking.price,
                ),
              0,
            )

          const totalWalkInRevenue =
            loadedOPCustomers.reduce(
              (
                total,
                customer,
              ) =>
                total +
                toNumber(
                  customer.grand_total,
                ),
              0,
            )

          const totalRevenue =
            totalBookingRevenue +
            totalWalkInRevenue

          const selectedMonthBookings =
            completedBookings.filter(
              (
                booking,
              ) =>
                booking.booking_date.startsWith(
                  selectedMonth,
                ),
            )

          const selectedMonthWalkIns =
            loadedOPCustomers.filter(
              (
                customer,
              ) =>
                customer.visit_date.startsWith(
                  selectedMonth,
                ),
            )

          const selectedMonthBookingRevenue =
            selectedMonthBookings.reduce(
              (
                total,
                booking,
              ) =>
                total +
                toNumber(
                  booking.price,
                ),
              0,
            )

          const selectedMonthWalkInRevenue =
            selectedMonthWalkIns.reduce(
              (
                total,
                customer,
              ) =>
                total +
                toNumber(
                  customer.grand_total,
                ),
              0,
            )

          const daysInMonth =
            new Date(
              Number(
                selectedMonth.slice(
                  0,
                  4,
                ),
              ),
              Number(
                selectedMonth.slice(
                  5,
                  7,
                ),
              ),
              0,
            ).getDate()

          const dailyRows:
            DailyRevenue[] = []

          for (
            let day = 1;
            day <= daysInMonth;
            day += 1
          ) {
            const date =
              `${selectedMonth}-${String(
                day,
              ).padStart(2, '0')}`

            const dayBookings =
              selectedMonthBookings.filter(
                (
                  booking,
                ) =>
                  booking.booking_date ===
                  date,
              )

            const dayWalkIns =
              selectedMonthWalkIns.filter(
                (
                  customer,
                ) =>
                  customer.visit_date ===
                  date,
              )

            const dayBookingRevenue =
              dayBookings.reduce(
                (
                  total,
                  booking,
                ) =>
                  total +
                  toNumber(
                    booking.price,
                  ),
                0,
              )

            const dayWalkInRevenue =
              dayWalkIns.reduce(
                (
                  total,
                  customer,
                ) =>
                  total +
                  toNumber(
                    customer.grand_total,
                  ),
                0,
              )

            const dayBookingItems =
              loadedBookingItems.filter(
                (
                  item,
                ) =>
                  dayBookings.some(
                    (
                      booking,
                    ) =>
                      booking.id ===
                      item.booking_id,
                  ),
              )

            const dayOPPersons =
              new Set(
                dayWalkIns.map(
                  (
                    customer,
                  ) =>
                    customer.id,
                ),
              )

            const dayOPPersonIds =
              new Set(
                loadedOPPersons
                  .filter(
                    (
                      person,
                    ) =>
                      dayOPPersons.has(
                        person.op_customer_id,
                      ),
                  )
                  .map(
                    (
                      person,
                    ) =>
                      person.id,
                  ),
              )

            const dayOPServices =
              loadedOPServices.filter(
                (
                  item,
                ) =>
                  dayOPPersonIds.has(
                    item.op_customer_person_id,
                  ),
              )

            dailyRows.push({
              date,
              bookings:
                dayBookings.length,
              walkIns:
                dayWalkIns.length,
              services:
                dayBookingItems.length +
                dayOPServices.length,
              bookingRevenue:
                dayBookingRevenue,
              walkInRevenue:
                dayWalkInRevenue,
              revenue:
                dayBookingRevenue +
                dayWalkInRevenue,
            })
          }

          const serviceTotals =
            new Map<
              string,
              ServicePerformance
            >()

          const monthBookingIds =
            new Set(
              selectedMonthBookings.map(
                (
                  booking,
                ) =>
                  booking.id,
              ),
            )

          loadedBookingItems
            .filter(
              (
                item,
              ) =>
                monthBookingIds.has(
                  item.booking_id,
                ),
            )
            .forEach(
              (
                item,
              ) => {
                const service =
                  loadedServices.find(
                    (
                      value,
                    ) =>
                      value.id ===
                      item.service_id,
                  )

                const key =
                  item.service_id

                const current =
                  serviceTotals.get(
                    key,
                  ) ?? {
                    serviceId:
                      key,
                    serviceName:
                      item.service_name ||
                      service?.name ||
                      'Beauty Service',
                    imageUrl:
                      service?.imageUrl ??
                      null,
                    bookings: 0,
                    revenue: 0,
                  }

                current.bookings += 1

                current.revenue +=
                  toNumber(
                    item.price,
                  )

                serviceTotals.set(
                  key,
                  current,
                )
              },
            )

          const monthOPCustomers =
            new Set(
              selectedMonthWalkIns.map(
                (
                  customer,
                ) =>
                  customer.id,
              ),
            )

          const monthOPPersonIds =
            new Set(
              loadedOPPersons
                .filter(
                  (
                    person,
                  ) =>
                    monthOPCustomers.has(
                      person.op_customer_id,
                    ),
                )
                .map(
                  (
                    person,
                  ) =>
                    person.id,
                ),
            )

          loadedOPServices
            .filter(
              (
                item,
              ) =>
                monthOPPersonIds.has(
                  item.op_customer_person_id,
                ),
            )
            .forEach(
              (
                item,
              ) => {
                const service =
                  loadedServices.find(
                    (
                      value,
                    ) =>
                      value.id ===
                      item.service_id,
                  )

                const key =
                  item.service_id ??
                  item.service_name ??
                  'walk-in-service'

                const current =
                  serviceTotals.get(
                    key,
                  ) ?? {
                    serviceId:
                      key,
                    serviceName:
                      item.service_name ||
                      service?.name ||
                      'Beauty Service',
                    imageUrl:
                      service?.imageUrl ??
                      null,
                    bookings: 0,
                    revenue: 0,
                  }

                current.bookings += 1

                current.revenue +=
                  toNumber(
                    item.final_price,
                  )

                serviceTotals.set(
                  key,
                  current,
                )
              },
            )

          const rankedServices =
            Array.from(
              serviceTotals.values(),
            )
              .sort(
                (
                  first,
                  second,
                ) =>
                  second.revenue -
                  first.revenue ||
                  second.bookings -
                    first.bookings,
              )
              .slice(
                0,
                5,
              )

          setServices(
            loadedServices,
          )

          setBookings(
            beautyBookings,
          )

          setEnquiries(
            loadedEnquiries,
          )

          setOffers(
            loadedOffers,
          )

          setStats({
            todayAppointments:
              todayBookings.length,
            todayCompleted:
              todayCompleted.length,
            todayPending:
              todayPending.length,

            todayEnquiries:
              todayEnquiries.length,
            todayNewEnquiries:
              todayNewEnquiries.length,

            upcomingAppointments:
              upcomingBookings.length,
            upcomingEnquiries:
              upcomingEnquiryRows.length,

            todayWalkIns:
              todayWalkIns.length,
            todayWalkInRevenue,

            totalRevenue,

            selectedMonthBookings:
              selectedMonthBookings.length,

            selectedMonthWalkIns:
              selectedMonthWalkIns.length,

            selectedMonthBookingRevenue,

            selectedMonthWalkInRevenue,

            selectedMonthRevenue:
              selectedMonthBookingRevenue +
              selectedMonthWalkInRevenue,
          })

          setDailyRevenue(
            dailyRows,
          )

          setTopServices(
            rankedServices,
          )
        } catch (
          loadError
        ) {
          console.error(
            'Failed to load beauty dashboard:',
            loadError,
          )

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load beauty dashboard data.',
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      [selectedMonth],
    )

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  /* =======================================================
     DISPLAY DATA
  ======================================================= */

  const upcomingBookings =
    useMemo(
      () =>
        bookings
          .filter(
            (
              booking,
            ) =>
              isFutureAppointment(
                booking,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              `${first.booking_date} ${
                first.booking_time ??
                ''
              }`.localeCompare(
                `${second.booking_date} ${
                  second.booking_time ??
                  ''
                }`,
              ),
          )
          .slice(
            0,
            5,
          ),
      [bookings],
    )

  const recentEnquiries =
    useMemo(
      () =>
        enquiries.slice(
          0,
          5,
        ),
      [enquiries],
    )

  const activeOffers =
    useMemo(
      () =>
        offers
          .filter(
            (
              offer,
            ) =>
              getOfferStatus(
                offer,
              ) === 'active',
          )
          .slice(
            0,
            3,
          ),
      [offers],
    )

  /* =======================================================
     MONTH OPTIONS
  ======================================================= */

  const monthOptions =
    useMemo<MonthOption[]>(
      () => {
        const result: MonthOption[] =
          []

        const now =
          new Date()

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

          const value =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1,
            ).padStart(2, '0')}`

          result.push({
            value,
            label:
              date.toLocaleDateString(
                'en-IN',
                {
                  month:
                    'long',
                  year:
                    'numeric',
                },
              ),
          })
        }

        return result
      },
      [],
    )

  /* =======================================================
     DOWNLOAD PNG REPORT
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
          const monthLabel =
            getMonthLabel(
              selectedMonth,
            )

          const width = 1400
          const margin = 70

          const topServiceHeight = 125
          const transactionRowHeight = 48

          const reportHeight =
            480 +
            topServices.length *
              topServiceHeight +
            dailyRevenue.length *
              transactionRowHeight +
            430

          const canvas =
            document.createElement(
              'canvas',
            )

          canvas.width =
            width

          canvas.height =
            reportHeight

          const context =
            canvas.getContext('2d')

          if (!context) {
            throw new Error(
              'Unable to create report image.',
            )
          }

          context.fillStyle =
            '#ffffff'

          context.fillRect(
            0,
            0,
            width,
            reportHeight,
          )

          context.fillStyle =
            '#f5f8f2'

          context.fillRect(
            0,
            0,
            width,
            300,
          )

          /* -----------------------------------------------
             HEADER
          ------------------------------------------------ */

          context.fillStyle =
            '#66853e'

          context.font =
            '700 18px Arial'

          context.fillText(
            'WILDFLORAL · BEAUTY STUDIO',
            margin,
            75,
          )

          context.fillStyle =
            '#1e3025'

          context.font =
            '600 52px Georgia'

          context.fillText(
            'Monthly revenue.',
            margin,
            145,
          )

          context.fillStyle =
            '#66853e'

          context.font =
            '400 30px Georgia'

          context.fillText(
            monthLabel,
            margin,
            195,
          )

          context.fillStyle =
            '#77837b'

          context.font =
            '400 17px Arial'

          context.fillText(
            'Business performance report',
            margin,
            235,
          )

          /* -----------------------------------------------
             SUMMARY CARDS
          ------------------------------------------------ */

          const cardY = 330
          const cardWidth = 390
          const cardHeight = 125
          const cardGap = 35

          const cards = [
            {
              label: 'TOTAL REVENUE',
              value:
                stats.selectedMonthRevenue,
            },
            {
              label: 'BOOKING REVENUE',
              value:
                stats.selectedMonthBookingRevenue,
            },
            {
              label: 'WALK-IN REVENUE',
              value:
                stats.selectedMonthWalkInRevenue,
            },
          ]

          cards.forEach(
            (
              card,
              index,
            ) => {
              const x =
                margin +
                index *
                  (cardWidth +
                    cardGap)

              context.fillStyle =
                '#f7faf5'

              context.fillRect(
                x,
                cardY,
                cardWidth,
                cardHeight,
              )

              context.strokeStyle =
                '#dfe8d9'

              context.lineWidth = 1

              context.strokeRect(
                x,
                cardY,
                cardWidth,
                cardHeight,
              )

              context.fillStyle =
                '#7c8a81'

              context.font =
                '700 14px Arial'

              context.fillText(
                card.label,
                x + 25,
                cardY + 35,
              )

              context.fillStyle =
                '#42652f'

              context.font =
                '500 34px Georgia'

              context.fillText(
                formatCurrency(
                  card.value,
                ),
                x + 25,
                cardY + 85,
              )
            },
          )

          let currentY =
            cardY +
            cardHeight +
            80

          /* -----------------------------------------------
             TOP SERVICES
          ------------------------------------------------ */

          context.fillStyle =
            '#66853e'

          context.font =
            '700 14px Arial'

          context.fillText(
            'SERVICE PERFORMANCE',
            margin,
            currentY,
          )

          currentY += 45

          context.fillStyle =
            '#1e3025'

          context.font =
            '500 34px Georgia'

          context.fillText(
            'Top 5 services',
            margin,
            currentY,
          )

          currentY += 35

          for (
            let index = 0;
            index <
            topServices.length;
            index += 1
          ) {
            const service =
              topServices[index]

            const rowY =
              currentY +
              index *
                topServiceHeight

            context.fillStyle =
              '#fbfcfa'

            context.fillRect(
              margin,
              rowY,
              width -
                margin * 2,
              topServiceHeight -
                12,
            )

            context.strokeStyle =
              '#e4ebe0'

            context.strokeRect(
              margin,
              rowY,
              width -
                margin * 2,
              topServiceHeight -
                12,
            )

            context.fillStyle =
              '#66853e'

            context.font =
              '700 18px Arial'

            context.fillText(
              String(
                index + 1,
              ).padStart(2, '0'),
              margin + 22,
              rowY + 50,
            )

            if (
              service.imageUrl
            ) {
              try {
                const image =
                  new Image()

                image.crossOrigin =
                  'anonymous'

                image.src =
                  service.imageUrl

                await new Promise<void>(
                  (
                    resolve,
                  ) => {
                    image.onload =
                      () =>
                        resolve()

                    image.onerror =
                      () =>
                        resolve()
                  },
                )

                if (
                  image.naturalWidth >
                  0
                ) {
                  context.save()

                  context.beginPath()

                  context.roundRect(
                    margin + 75,
                    rowY + 15,
                    75,
                    75,
                    12,
                  )

                  context.clip()

                  context.drawImage(
                    image,
                    margin + 75,
                    rowY + 15,
                    75,
                    75,
                  )

                  context.restore()
                }
              } catch {
                // Keep the report usable
                // when an external image
                // cannot be loaded.
              }
            }

            context.fillStyle =
              '#203128'

            context.font =
              '600 23px Georgia'

            context.fillText(
              service.serviceName,
              margin + 180,
              rowY + 43,
            )

            context.fillStyle =
              '#7a867e'

            context.font =
              '400 16px Arial'

            context.fillText(
              `${service.bookings} ${
                service.bookings ===
                1
                  ? 'booking'
                  : 'bookings'
              }`,
              margin + 180,
              rowY + 72,
            )

            context.fillStyle =
              '#7a867e'

            context.font =
              '700 12px Arial'

            context.fillText(
              'REVENUE',
              width -
                margin -
                250,
              rowY + 37,
            )

            context.fillStyle =
              '#42652f'

            context.font =
              '500 25px Georgia'

            context.fillText(
              formatCurrency(
                service.revenue,
              ),
              width -
                margin -
                250,
              rowY + 72,
            )
          }

          currentY +=
            topServices.length *
              topServiceHeight +
            55

          /* -----------------------------------------------
             DAILY TRANSACTIONS
          ------------------------------------------------ */

          context.fillStyle =
            '#66853e'

          context.font =
            '700 14px Arial'

          context.fillText(
            'MONTHLY TRANSACTION DETAILS',
            margin,
            currentY,
          )

          currentY += 40

          const columns = [
            'DATE',
            'BOOKINGS',
            'WALK-INS',
            'SERVICES',
            'BOOKING REVENUE',
            'WALK-IN REVENUE',
            'TOTAL REVENUE',
          ]

          const columnX = [
            margin,
            margin + 175,
            margin + 300,
            margin + 425,
            margin + 555,
            margin + 770,
            margin + 1000,
          ]

          context.fillStyle =
            '#eef3eb'

          context.fillRect(
            margin,
            currentY - 30,
            width -
              margin * 2,
            45,
          )

          context.fillStyle =
            '#718078'

          context.font =
            '700 12px Arial'

          columns.forEach(
            (
              column,
              index,
            ) => {
              context.fillText(
                column,
                columnX[index],
                currentY,
              )
            },
          )

          currentY += 45

          dailyRevenue.forEach(
            (
              row,
              index,
            ) => {
              if (
                index % 2 ===
                0
              ) {
                context.fillStyle =
                  '#fbfcfa'

                context.fillRect(
                  margin,
                  currentY -
                    30,
                  width -
                    margin * 2,
                  transactionRowHeight,
                )
              }

              context.fillStyle =
                '#26372d'

              context.font =
                '400 14px Arial'

              context.fillText(
                formatShortDate(
                  row.date,
                ),
                columnX[0],
                currentY,
              )

              context.fillText(
                String(
                  row.bookings,
                ),
                columnX[1],
                currentY,
              )

              context.fillText(
                String(
                  row.walkIns,
                ),
                columnX[2],
                currentY,
              )

              context.fillText(
                String(
                  row.services,
                ),
                columnX[3],
                currentY,
              )

              context.fillText(
                formatCurrency(
                  row.bookingRevenue,
                ),
                columnX[4],
                currentY,
              )

              context.fillText(
                formatCurrency(
                  row.walkInRevenue,
                ),
                columnX[5],
                currentY,
              )

              context.fillStyle =
                '#42652f'

              context.font =
                '700 14px Arial'

              context.fillText(
                formatCurrency(
                  row.revenue,
                ),
                columnX[6],
                currentY,
              )

              currentY +=
                transactionRowHeight
            },
          )

          currentY += 45

          /* -----------------------------------------------
             MONTH SUMMARY
          ------------------------------------------------ */

          context.fillStyle =
            '#f5f8f2'

          context.fillRect(
            margin,
            currentY,
            width -
              margin * 2,
            270,
          )

          context.fillStyle =
            '#66853e'

          context.font =
            '700 14px Arial'

          context.fillText(
            'MONTH SUMMARY',
            margin + 30,
            currentY + 45,
          )

          const summaryRows = [
            [
              'Total bookings',
              String(
                stats.selectedMonthBookings,
              ),
            ],
            [
              'Total walk-ins',
              String(
                stats.selectedMonthWalkIns,
              ),
            ],
            [
              'Total transactions',
              String(
                stats.selectedMonthBookings +
                  stats.selectedMonthWalkIns,
              ),
            ],
            [
              'Booking revenue',
              formatCurrency(
                stats.selectedMonthBookingRevenue,
              ),
            ],
            [
              'Walk-in revenue',
              formatCurrency(
                stats.selectedMonthWalkInRevenue,
              ),
            ],
            [
              'Total revenue',
              formatCurrency(
                stats.selectedMonthRevenue,
              ),
            ],
          ]

          summaryRows.forEach(
            (
              row,
              index,
            ) => {
              const y =
                currentY +
                82 +
                index * 30

              context.fillStyle =
                '#718078'

              context.font =
                '400 14px Arial'

              context.fillText(
                row[0],
                margin + 30,
                y,
              )

              context.fillStyle =
                '#26372d'

              context.font =
                '600 14px Arial'

              context.fillText(
                row[1],
                margin + 330,
                y,
              )
            },
          )

          /* -----------------------------------------------
             FOOTER
          ------------------------------------------------ */

          context.fillStyle =
            '#ffffff'

          context.fillRect(
            0,
            reportHeight - 80,
            width,
            80,
          )

          context.fillStyle =
            '#77837b'

          context.font =
            '400 13px Arial'

          context.fillText(
            `WILDFLORAL · BEAUTY STUDIO · ${monthLabel}`,
            margin,
            reportHeight - 35,
          )

          context.fillText(
            'Generated from live business data',
            width -
              margin -
              260,
            reportHeight - 35,
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
            `wildfloral-beauty-revenue-${selectedMonth}.png`

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
            'Failed to download revenue report:',
            downloadError,
          )

          setError(
            downloadError instanceof
              Error
              ? downloadError.message
              : 'Unable to create the monthly report image.',
          )
        } finally {
          setDownloading(false)
        }
      },
      [
        downloading,
        loading,
        selectedMonth,
        stats,
        dailyRevenue,
        topServices,
      ],
    )

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="admin-beauty-dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="admin-beauty-header">

        <div className="admin-beauty-header-copy">

          <span className="admin-beauty-eyebrow">
            WILDFLORAL · BEAUTY STUDIO
          </span>

          <h1>
            Beauty
            <em>
              dashboard.
            </em>
          </h1>

          <p>
            Your business at a glance.
            Monitor appointments, enquiries,
            walk-ins, offers and revenue from
            one place.
          </p>

        </div>

        <div className="admin-beauty-header-actions">

          <button
            type="button"
            className="admin-beauty-refresh-button"
            onClick={() =>
              void loadDashboard(
                true,
              )
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
            className="admin-beauty-website-button"
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

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <section className="admin-beauty-error">

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
              void loadDashboard(
                true,
              )
            }
          >
            Try again
          </button>

        </section>
      )}

      {/* =================================================
          TODAY OVERVIEW
      ================================================= */}

      <section className="admin-beauty-section">

        <div className="admin-beauty-section-intro">

          <div>
            <span className="admin-beauty-eyebrow">
              TODAY
            </span>

            <h2>
              Business
              <em>
                overview.
              </em>
            </h2>

            <p>
              Everything that needs
              attention today.
            </p>
          </div>

          <div className="admin-beauty-live-date">
            <span>
              LIVE DATA
            </span>

            <strong>
              {formatDate(
                getToday(),
              )}
            </strong>
          </div>

        </div>

        <div className="admin-beauty-kpi-grid">

          <article className="admin-beauty-kpi-card admin-beauty-kpi-primary">

            <div className="admin-beauty-kpi-icon">
              <CalendarDays
                size={20}
              />
            </div>

            <span>
              TODAY'S APPOINTMENTS
            </span>

            <strong>
              {loading
                ? '—'
                : stats.todayAppointments}
            </strong>

            <small>
              {stats.todayCompleted}
              {' '}
              completed ·{' '}
              {stats.todayPending}
              {' '}
              pending
            </small>

          </article>

          <article className="admin-beauty-kpi-card">

            <div className="admin-beauty-kpi-icon">
              <MessageSquareText
                size={20}
              />
            </div>

            <span>
              ENQUIRIES
            </span>

            <strong>
              {loading
                ? '—'
                : stats.todayEnquiries}
            </strong>

            <small>
              {stats.todayNewEnquiries}
              {' '}
              new today
            </small>

          </article>

          <article className="admin-beauty-kpi-card">

            <div className="admin-beauty-kpi-icon">
              <Clock3
                size={20}
              />
            </div>

            <span>
              UPCOMING
            </span>

            <strong>
              {loading
                ? '—'
                : stats.upcomingAppointments}
            </strong>

            <small>
              appointments scheduled
            </small>

          </article>

          <article className="admin-beauty-kpi-card admin-beauty-kpi-revenue">

            <div className="admin-beauty-kpi-icon">
              <TrendingUp
                size={20}
              />
            </div>

            <span>
              TOTAL REVENUE
            </span>

            <strong>
              {loading
                ? '—'
                : formatCurrency(
                    stats.totalRevenue,
                  )}
            </strong>

            <small>
              bookings + walk-ins
            </small>

          </article>

        </div>

      </section>

      {/* =================================================
          UPCOMING + ENQUIRIES
      ================================================= */}

      <section className="admin-beauty-content-grid">

        <div className="admin-beauty-panel">

          <div className="admin-beauty-panel-header">

            <div>
              <span>
                NEXT EXPERIENCE
              </span>

              <h2>
                Upcoming
                <em>
                  bookings.
                </em>
              </h2>
            </div>

            <Link
              to="/admin/bookings/beauty"
              className="admin-beauty-view-link"
            >
              View all
              <ArrowIcon />
            </Link>

          </div>

          <div className="admin-beauty-booking-list">

            {loading ? (
              <div className="admin-beauty-empty">
                Loading bookings...
              </div>
            ) : upcomingBookings.length ===
              0 ? (
              <div className="admin-beauty-empty">
                <strong>
                  No upcoming bookings
                </strong>

                <span>
                  New appointments will
                  appear here.
                </span>
              </div>
            ) : (
              upcomingBookings.map(
                (
                  booking,
                ) => (
                  <Link
                    key={
                      booking.id
                    }
                    to={`/admin/bookings/beauty?booking=${booking.id}`}
                    className="admin-beauty-booking-row"
                  >

                    <div className="admin-beauty-booking-date">

                      <strong>
                        {new Date(
                          `${booking.booking_date}T00:00:00`,
                        ).getDate()}
                      </strong>

                      <span>
                        {new Date(
                          `${booking.booking_date}T00:00:00`,
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            month:
                              'short',
                          },
                        )}
                      </span>

                    </div>

                    <div className="admin-beauty-booking-info">

                      <span>
                        {
                          booking.serviceName
                        }
                      </span>

                      <strong>
                        {booking.customer_name ||
                          'Customer'}
                      </strong>

                      <small>
                        <Clock3
                          size={12}
                        />
                        {formatTime(
                          booking.booking_time,
                        )}
                        {' · '}
                        {formatDate(
                          booking.booking_date,
                        )}
                      </small>

                    </div>

                    <div className="admin-beauty-booking-price">

                      <strong>
                        {formatCurrency(
                          toNumber(
                            booking.price,
                          ),
                        )}
                      </strong>

                      <span
                        className={`admin-beauty-status ${getStatusClass(
                          booking.status,
                        )}`}
                      >
                        {getStatusLabel(
                          booking.status,
                        )}
                      </span>

                    </div>

                    <ChevronRight
                      size={18}
                    />

                  </Link>
                ),
              )
            )}

          </div>

        </div>

        <div className="admin-beauty-panel">

          <div className="admin-beauty-panel-header">

            <div>
              <span>
                CUSTOMER ACTIVITY
              </span>

              <h2>
                Recent
                <em>
                  enquiries.
                </em>
              </h2>
            </div>

            <Link
              to="/admin/enquiries/beauty"
              className="admin-beauty-view-link"
            >
              View all
              <ArrowIcon />
            </Link>

          </div>

          <div className="admin-beauty-enquiry-list">

            {loading ? (
              <div className="admin-beauty-empty">
                Loading enquiries...
              </div>
            ) : recentEnquiries.length ===
              0 ? (
              <div className="admin-beauty-empty">
                <strong>
                  No enquiries yet
                </strong>

                <span>
                  New customer requests
                  will appear here.
                </span>
              </div>
            ) : (
              recentEnquiries.map(
                (
                  enquiry,
                ) => (
                  <Link
                    key={
                      enquiry.id
                    }
                    to={`/admin/enquiries/beauty?enquiry=${enquiry.id}`}
                    className="admin-beauty-enquiry-row"
                  >

                    <div className="admin-beauty-enquiry-icon">
                      <MessageSquareText
                        size={18}
                      />
                    </div>

                    <div className="admin-beauty-enquiry-info">

                      <strong>
                        #
                        {enquiry.id
                          .slice(
                            0,
                            8,
                          )
                          .toUpperCase()}
                      </strong>

                      <span>
                        {formatDate(
                          enquiry.preferred_date,
                        )}
                        {' · '}
                        {formatTime(
                          enquiry.preferred_time,
                        )}
                      </span>

                    </div>

                    <div className="admin-beauty-enquiry-value">

                      <strong>
                        {formatCurrency(
                          toNumber(
                            enquiry.total_amount,
                          ),
                        )}
                      </strong>

                      <span>
                        {String(
                          enquiry.status ??
                            'New',
                        )}
                      </span>

                    </div>

                    <ChevronRight
                      size={18}
                    />

                  </Link>
                ),
              )
            )}

          </div>

        </div>

      </section>

      {/* =================================================
          ACTIVE OFFERS
      ================================================= */}

      <section className="admin-beauty-offers-section">

        <div className="admin-beauty-panel-header">

          <div>
            <span>
              PROMOTIONS
            </span>

            <h2>
              Active
              <em>
                offers.
              </em>
            </h2>

            <p>
              Promotions currently available
              to your customers.
            </p>
          </div>

          <Link
            to="/admin/offers/beauty"
            className="admin-beauty-view-link"
          >
            View all
            <ArrowIcon />
          </Link>

        </div>

        {activeOffers.length ===
        0 ? (
          <div className="admin-beauty-empty admin-beauty-offer-empty">
            <Sparkles
              size={22}
            />

            <strong>
              No active offers
            </strong>

            <span>
              Create a promotion to
              highlight it here.
            </span>
          </div>
        ) : (
          <div className="admin-beauty-offers-grid">

            {activeOffers.map(
              (
                offer,
              ) => (
                <Link
                  key={
                    offer.id
                  }
                  to={`/admin/offers/beauty?offer=${offer.id}`}
                  className="admin-beauty-offer-card"
                >

                  <div className="admin-beauty-offer-image">

                    {offer.image_url ? (
                      <img
                        src={
                          offer.image_url
                        }
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <Sparkles
                        size={25}
                      />
                    )}

                    <span>
                      ACTIVE
                    </span>

                  </div>

                  <div className="admin-beauty-offer-content">

                    <strong>
                      {offer.title}
                    </strong>

                    <b>
                      {getOfferDiscount(
                        offer,
                      )}
                    </b>

                    <small>
                      {getOfferRemaining(
                        offer.ends_at,
                      )}
                    </small>

                  </div>

                  <ArrowRight
                    size={18}
                  />

                </Link>
              ),
            )}

          </div>
        )}

      </section>

      {/* =================================================
          REVENUE REPORT
      ================================================= */}

      <section className="admin-beauty-revenue-section">

        <div className="admin-beauty-revenue-header">

          <div>

            <span className="admin-beauty-eyebrow">
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
              the complete beauty business
              report.
            </p>

          </div>

          <div className="admin-beauty-revenue-controls">

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
                    event.target
                      .value,
                  )
                }
              >
                {monthOptions.map(
                  (
                    option,
                  ) => (
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
            </label>

            <button
              type="button"
              className="admin-beauty-download-button"
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

        <div className="admin-beauty-revenue-summary">

          <article>

            <span>
              TOTAL REVENUE
            </span>

            <strong>
              {formatCurrency(
                stats.selectedMonthRevenue,
              )}
            </strong>

            <small>
              {
                getMonthLabel(
                  selectedMonth,
                )
              }
            </small>

          </article>

          <article>

            <span>
              BOOKING REVENUE
            </span>

            <strong>
              {formatCurrency(
                stats.selectedMonthBookingRevenue,
              )}
            </strong>

            <small>
              {stats.selectedMonthBookings}
              {' '}
              completed bookings
            </small>

          </article>

          <article>

            <span>
              WALK-IN REVENUE
            </span>

            <strong>
              {formatCurrency(
                stats.selectedMonthWalkInRevenue,
              )}
            </strong>

            <small>
              {stats.selectedMonthWalkIns}
              {' '}
              walk-ins
            </small>

          </article>

        </div>

      </section>

      {/* =================================================
          TOP SERVICES
      ================================================= */}

      <section className="admin-beauty-top-services">

        <div className="admin-beauty-panel-header">

          <div>
            <span>
              SERVICE PERFORMANCE
            </span>

            <h2>
              Top 5
              <em>
                services.
              </em>
            </h2>

            <p>
              Highest-performing services for
              the selected report month.
            </p>
          </div>

          <Link
            to="/admin/services/beauty"
            className="admin-beauty-view-link"
          >
            View all
            <ArrowIcon />
          </Link>

        </div>

        <div className="admin-beauty-top-service-list">

          {topServices.length ===
          0 ? (
            <div className="admin-beauty-empty">
              <strong>
                No service revenue
              </strong>

              <span>
                There are no completed
                transactions for this month.
              </span>
            </div>
          ) : (
            topServices.map(
              (
                service,
                index,
              ) => (
                <Link
                  key={
                    `${service.serviceId}-${index}`
                  }
                  to="/admin/services/beauty"
                  className="admin-beauty-top-service-row"
                >

                  <span className="admin-beauty-top-rank">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div className="admin-beauty-top-image">

                    {service.imageUrl ? (
                      <img
                        src={
                          service.imageUrl
                        }
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <div>
                        W
                      </div>
                    )}

                  </div>

                  <div className="admin-beauty-top-service-info">

                    <strong>
                      {
                        service.serviceName
                      }
                    </strong>

                    <span>
                      {service.bookings}
                      {' '}
                      {service.bookings ===
                      1
                        ? 'booking'
                        : 'bookings'}
                    </span>

                  </div>

                  <div className="admin-beauty-top-service-revenue">

                    <span>
                      REVENUE
                    </span>

                    <strong>
                      {formatCurrency(
                        service.revenue,
                      )}
                    </strong>

                  </div>

                  <ChevronRight
                    size={18}
                  />

                </Link>
              ),
            )
          )}

        </div>

      </section>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="admin-beauty-quick-actions">

        <div className="admin-beauty-panel-header">

          <div>
            <span className="admin-beauty-eyebrow">
              QUICK ACTIONS
            </span>

            <h2>
              Manage
              <em>
                beauty.
              </em>
            </h2>

            <p>
              Jump directly into the area
              you want to manage.
            </p>
          </div>

        </div>

        <div className="admin-beauty-action-grid">

          <Link
            to="/admin/bookings/beauty"
            className="admin-beauty-action-card"
          >
            <div className="admin-beauty-action-icon">
              <CalendarDays
                size={21}
              />
            </div>

            <div>
              <strong>
                Bookings
              </strong>

              <span>
                Manage beauty appointments.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </Link>

          <Link
            to="/admin/enquiries/beauty"
            className="admin-beauty-action-card"
          >
            <div className="admin-beauty-action-icon">
              <MessageSquareText
                size={21}
              />
            </div>

            <div>
              <strong>
                Enquiries
              </strong>

              <span>
                Review customer requests.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </Link>

          <Link
            to="/admin/offers/beauty"
            className="admin-beauty-action-card"
          >
            <div className="admin-beauty-action-icon">
              <Sparkles
                size={21}
              />
            </div>

            <div>
              <strong>
                Offers
              </strong>

              <span>
                Manage beauty promotions.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </Link>

          <Link
            to="/admin/services/beauty"
            className="admin-beauty-action-card"
          >
            <div className="admin-beauty-action-icon">
              <WalletCards
                size={21}
              />
            </div>

            <div>
              <strong>
                Services
              </strong>

              <span>
                Manage categories and
                services.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </Link>

          <Link
            to="/admin/op-customers/beauty"
            className="admin-beauty-action-card"
          >
            <div className="admin-beauty-action-icon">
              <Users
                size={21}
              />
            </div>

            <div>
              <strong>
                Walk-in Customers
              </strong>

              <span>
                Manage OP customers and
                billing.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </Link>

        </div>

      </section>

    </main>
  )
}

export default AdminBeautyDashboard