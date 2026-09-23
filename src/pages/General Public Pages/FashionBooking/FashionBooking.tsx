import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import {
  clearFashionCart,
  getFashionCart,
  removeFromFashionCart,
  updateFashionCartQuantity,
} from '../../../lib/fashionCart'

import type { FashionCartItem } from '../../../lib/fashionCart'

import './FashionBooking.css'

/* =========================================================
   TYPES
========================================================= */

type BookingStep = 1 | 2 | 3

type FashionDesign = {
  id: string
  name: string
  description: string | null
  delivery_min_days: number | null
  delivery_max_days: number | null
}

type FashionSize = {
  id: string
  design_id: string
  size: string
  price: number | string
  stock_quantity: number | string
  is_active: boolean
}

type FashionDesignImage = {
  id: string
  design_id: string
  image_url: string
  alt_text: string | null
  display_order: number | null
  is_primary: boolean
}

type FashionOffer = {
  id: string
  title: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number | string
  starts_at: string
  ends_at: string | null
  is_active: boolean
  applies_to_all: boolean
  priority: number | string
}

type CustomerForm = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pincode: string
  notes: string
}

type OrderItem = FashionCartItem & {
  design: FashionDesign
  sizeData: FashionSize
  image: FashionDesignImage | null
  unitPrice: number
  lineTotal: number
}

type RazorpayOrderResponse = {
  success: boolean
  order: {
    id: string
    amount: number
    currency: string
    receipt: string
    status: string
  }
  keyId: string
}

type RazorpayPaymentResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string

  prefill: {
    name: string
    email: string
    contact: string
  }

  notes: {
    order_id: string
    order_number: string
  }

  theme: {
    color: string
  }

  modal?: {
    ondismiss?: () => void
  }

  handler: (
    response: RazorpayPaymentResponse,
  ) => void
}

type RazorpayInstance = {
  open: () => void
}

type RazorpayConstructor = new (
  options: RazorpayOptions,
) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

/* =========================================================
   CONSTANTS
========================================================= */

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PHONE_REGEX =
  /^[6-9]\d{9}$/

const PINCODE_REGEX =
  /^\d{6}$/

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(value)
}

function calculateDiscount(
  amount: number,
  offer: FashionOffer | null,
): number {
  if (!offer) {
    return 0
  }

  const discountValue =
    Number(offer.discount_value)

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0
  ) {
    return 0
  }

  if (
    offer.discount_type ===
    'percentage'
  ) {
    return Math.min(
      amount,
      (amount * discountValue) / 100,
    )
  }

  return Math.min(
    amount,
    discountValue,
  )
}

function getImageForDesign(
  images: FashionDesignImage[],
  designId: string,
): FashionDesignImage | null {
  const designImages =
    images.filter(
      (image) =>
        image.design_id === designId,
    )

  if (!designImages.length) {
    return null
  }

  return (
    designImages.find(
      (image) =>
        image.is_primary,
    ) ??
    [...designImages].sort(
      (a, b) =>
        Number(
          a.display_order ?? 0,
        ) -
        Number(
          b.display_order ?? 0,
        ),
    )[0] ??
    null
  )
}

/* =========================================================
   COMPONENT
========================================================= */

function FashionBooking() {
  const navigate = useNavigate()

  const [
    currentStep,
    setCurrentStep,
  ] =
    useState<BookingStep>(1)

  const [
    cartItems,
    setCartItems,
  ] =
    useState<FashionCartItem[]>([])

  const [
    designs,
    setDesigns,
  ] =
    useState<FashionDesign[]>([])

  const [
    sizes,
    setSizes,
  ] =
    useState<FashionSize[]>([])

  const [
    designImages,
    setDesignImages,
  ] =
    useState<FashionDesignImage[]>([])

  const [
    offers,
    setOffers,
  ] =
    useState<FashionOffer[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  const [
    completedOrderNumber,
    setCompletedOrderNumber,
  ] =
    useState('')

  const [copiedRef, setCopiedRef] =
    useState(false)

  const [
    form,
    setForm,
  ] =
    useState<CustomerForm>({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      pincode: '',
      notes: '',
    })

  /* =========================================================
     LOAD CART
  ========================================================= */

  useEffect(() => {
    setCartItems(
      getFashionCart(),
    )
  }, [])

  /* =========================================================
     LOAD PRODUCT DATA
  ========================================================= */

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const currentCart =
          getFashionCart()

        setCartItems(
          currentCart,
        )

        if (
          currentCart.length === 0
        ) {
          setLoading(false)
          return
        }

        const designIds = [
          ...new Set(
            currentCart
              .map(
                (item) =>
                  item.designId,
              )
              .filter(Boolean),
          ),
        ]

        const sizeIds = [
          ...new Set(
            currentCart
              .map(
                (item) =>
                  item.designSizeId,
              )
              .filter(Boolean),
          ),
        ]

        const [
          designsResult,
          sizesResult,
          imagesResult,
          offersResult,
        ] = await Promise.all([
          supabase
            .from(
              'fashion_designs',
            )
            .select(
              `
                id,
                name,
                description,
                delivery_min_days,
                delivery_max_days
              `,
            )
            .in(
              'id',
              designIds,
            ),

          supabase
            .from(
              'fashion_design_sizes',
            )
            .select(
              `
                id,
                design_id,
                size,
                price,
                stock_quantity,
                is_active
              `,
            )
            .in(
              'id',
              sizeIds,
            ),

          supabase
            .from(
              'fashion_design_images',
            )
            .select(
              `
                id,
                design_id,
                image_url,
                alt_text,
                display_order,
                is_primary
              `,
            )
            .in(
              'design_id',
              designIds,
            )
            .order(
              'is_primary',
              {
                ascending: false,
              },
            )
            .order(
              'display_order',
              {
                ascending: true,
              },
            ),

          supabase
            .from(
              'fashion_offers',
            )
            .select(
              `
                id,
                title,
                discount_type,
                discount_value,
                starts_at,
                ends_at,
                is_active,
                applies_to_all,
                priority
              `,
            )
            .eq(
              'is_active',
              true,
            ),
        ])

        if (
          designsResult.error
        ) {
          throw designsResult.error
        }

        if (
          sizesResult.error
        ) {
          throw sizesResult.error
        }

        if (
          imagesResult.error
        ) {
          throw imagesResult.error
        }

        if (
          offersResult.error
        ) {
          throw offersResult.error
        }

        if (!active) {
          return
        }

        setDesigns(
          designsResult.data ??
            [],
        )

        setSizes(
          sizesResult.data ??
            [],
        )

        setDesignImages(
          imagesResult.data ??
            [],
        )

        setOffers(
          offersResult.data ??
            [],
        )
      } catch (loadError) {
        console.error(
          'Fashion booking load error:',
          loadError,
        )

        if (active) {
          setError(
            'Unable to load your fashion order. Please refresh and try again.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [])

  /* =========================================================
     ACTIVE OFFER
  ========================================================= */

  const activeOffer =
    useMemo(() => {
      const now =
        Date.now()

      return (
        offers
          .filter(
            (offer) => {
              const startsAt =
                new Date(
                  offer.starts_at,
                ).getTime()

              const endsAt =
                offer.ends_at
                  ? new Date(
                      offer.ends_at,
                    ).getTime()
                  : null

              return (
                offer.is_active &&
                startsAt <= now &&
                (
                  endsAt === null ||
                  endsAt >= now
                )
              )
            },
          )
          .sort(
            (a, b) =>
              Number(
                b.priority,
              ) -
              Number(
                a.priority,
              ),
          )[0] ?? null
      )
    }, [offers])

  /* =========================================================
     BUILD ORDER ITEMS
  ========================================================= */

  const orderItems =
    useMemo<OrderItem[]>(() => {
      return cartItems
        .map((item) => {
          const design =
            designs.find(
              (entry) =>
                entry.id ===
                item.designId,
            )

          const sizeData =
            sizes.find(
              (entry) =>
                entry.id ===
                item.designSizeId,
            )

          if (
            !design ||
            !sizeData
          ) {
            return null
          }

          const unitPrice =
            Number(
              sizeData.price,
            )

          return {
            ...item,
            design,
            sizeData,
            image:
              getImageForDesign(
                designImages,
                item.designId,
              ),
            unitPrice,
            lineTotal:
              unitPrice *
              item.quantity,
          }
        })
        .filter(
          (
            item,
          ): item is OrderItem =>
            item !== null,
        )
    }, [
      cartItems,
      designs,
      sizes,
      designImages,
    ])

  /* =========================================================
     TOTALS
  ========================================================= */

  const subtotal =
    useMemo(
      () =>
        orderItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.lineTotal,
          0,
        ),
      [orderItems],
    )

  const discountAmount =
    useMemo(
      () =>
        calculateDiscount(
          subtotal,
          activeOffer,
        ),
      [
        subtotal,
        activeOffer,
      ],
    )

  const totalAmount =
    Math.max(
      0,
      subtotal -
        discountAmount,
    )

  /* =========================================================
     FORM UPDATE
  ========================================================= */

  function updateForm(
    field: keyof CustomerForm,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateDelivery(): boolean {
    setError('')

    if (
      form.name.trim().length <
      2
    ) {
      setError(
        'Please enter your full name.',
      )
      return false
    }

    if (
      !EMAIL_REGEX.test(
        form.email.trim(),
      )
    ) {
      setError(
        'Please enter a valid email address.',
      )
      return false
    }

    if (
      !PHONE_REGEX.test(
        form.phone.trim(),
      )
    ) {
      setError(
        'Please enter a valid 10-digit Indian mobile number.',
      )
      return false
    }

    if (
      form.address.trim()
        .length < 8
    ) {
      setError(
        'Please enter your complete delivery address.',
      )
      return false
    }

    if (
      form.city.trim().length <
      2
    ) {
      setError(
        'Please enter your city.',
      )
      return false
    }

    if (
      !PINCODE_REGEX.test(
        form.pincode.trim(),
      )
    ) {
      setError(
        'Please enter a valid 6-digit pincode.',
      )
      return false
    }

    return true
  }

  /* =========================================================
     STEP NAVIGATION
  ========================================================= */

  function goToStep(
    step: BookingStep,
  ) {
    setError('')

    if (step === 2) {
      if (!orderItems.length) {
        setError(
          'Your cart is empty.',
        )
        return
      }
    }

    if (step === 3) {
      if (
        !validateDelivery()
      ) {
        return
      }
    }

    setCurrentStep(step)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =========================================================
     QUANTITY
  ========================================================= */

  function handleQuantityChange(
    item: FashionCartItem,
    quantity: number,
  ) {
    if (
      quantity <
      1
    ) {
      return
    }

    const size =
      sizes.find(
        (entry) =>
          entry.id ===
          item.designSizeId,
      )

    if (size) {
      const stock =
        Number(
          size.stock_quantity,
        )

      if (
        Number.isFinite(stock) &&
        stock > 0 &&
        quantity > stock
      ) {
        setError(
          `Only ${stock} item${
            stock === 1
              ? ''
              : 's'
          } available for ${size.size}.`,
        )
        return
      }
    }

    const updated =
      updateFashionCartQuantity(
        item.designId,
        item.designSizeId,
        quantity,
      )

    setCartItems(
      updated,
    )
  }

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  function handleRemoveItem(
    item: FashionCartItem,
  ) {
    const updated =
      removeFromFashionCart(
        item.designId,
        item.designSizeId,
      )

    setCartItems(
      updated,
    )

    setError('')
  }

  /* =========================================================
     CREATE RAZORPAY ORDER
  ========================================================= */

  async function createRazorpayOrder(
    amountInRupees: number,
    receipt: string,
  ): Promise<RazorpayOrderResponse> {
    const amountInPaise =
      Math.round(
        amountInRupees *
          100,
      )

    if (
      !Number.isInteger(
        amountInPaise,
      ) ||
      amountInPaise <= 0
    ) {
      throw new Error(
        'Invalid payment amount.',
      )
    }

    const {
      data,
      error: functionError,
    } =
      await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount:
              amountInPaise,
            receipt,
          },
        },
      )

    if (functionError) {
      console.error(
        'Create Razorpay order error:',
        functionError,
      )

      throw new Error(
        'Unable to start Razorpay payment.',
      )
    }

    if (
      !data?.success ||
      !data?.order?.id ||
      !data?.keyId
    ) {
      throw new Error(
        data?.error ??
          'Invalid Razorpay order response.',
      )
    }

    return data as RazorpayOrderResponse
  }

  /* =========================================================
     VERIFY RAZORPAY PAYMENT
  ========================================================= */

  async function verifyRazorpayPayment(
    payment: RazorpayPaymentResponse,
    orderId: string,
  ) {
    const {
      data,
      error: functionError,
    } =
      await supabase.functions.invoke(
        'verify-fashion-payment',
        {
          body: {
            order_id:
              orderId,

            razorpay_order_id:
              payment.razorpay_order_id,

            razorpay_payment_id:
              payment.razorpay_payment_id,

            razorpay_signature:
              payment.razorpay_signature,
          },
        },
      )

    if (functionError) {
      console.error(
        'Verify Razorpay payment error:',
        functionError,
      )

      throw new Error(
        'Payment verification failed.',
      )
    }

    if (!data?.success) {
      throw new Error(
        data?.error ??
          'Payment verification failed.',
      )
    }

    return data
  }

  /* =========================================================
     OPEN RAZORPAY
  ========================================================= */

  function openRazorpayCheckout(
    razorpayOrder: RazorpayOrderResponse,
    orderId: string,
    orderNumber: string,
  ) {
    if (
      !window.Razorpay
    ) {
      throw new Error(
        'Razorpay Checkout could not be loaded. Please refresh the page and try again.',
      )
    }

    const options: RazorpayOptions =
      {
        key:
          razorpayOrder.keyId,

        amount:
          razorpayOrder.order.amount,

        currency:
          razorpayOrder.order.currency,

        name:
          'WildFloral',

        description:
          `Fashion Order ${orderNumber}`,

        order_id:
          razorpayOrder.order.id,

        prefill: {
          name:
            form.name.trim(),
          email:
            form.email.trim(),
          contact:
            form.phone.trim(),
        },

        notes: {
          order_id:
            orderId,
          order_number:
            orderNumber,
        },

        theme: {
          color:
            '#7c3aed',
        },

        modal: {
            ondismiss:
              () => {
                setSubmitting(false)

                setError(
                  'Payment was cancelled. No completed order was created.',
                )
              },
          },

        handler:
          async (
            response,
          ) => {
            try {
              setError('')
              setSubmitting(
                true,
              )

              await verifyRazorpayPayment(
                response,
                orderId,
              )

              setSuccess(
                'Payment completed successfully.',
              )

               setCompletedOrderNumber(
                orderNumber,
              )

              clearFashionCart()

              setCartItems(
                [],
              )

              setCurrentStep(
                3,
              )

              window.scrollTo({
                top: 0,
                behavior:
                  'smooth',
              })
            } catch (
              verificationError
            ) {
              console.error(
                'Razorpay verification error:',
                verificationError,
              )

              setError(
                verificationError instanceof
                  Error
                  ? verificationError.message
                  : 'Payment verification failed. Please contact support.',
              )
            } finally {
              setSubmitting(
                false,
              )
            }
          },
      }

    const razorpay =
      new window.Razorpay(
        options,
      )

    razorpay.open()
  }

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  async function handlePlaceOrder(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (
      submitting ||
      success
    ) {
      return
    }

    setError('')
    setSubmitting(
      true,
    )

    let createdOrderId:
      | string
      | null = null

    try {
      if (
        !orderItems.length
      ) {
        throw new Error(
          'Your fashion cart is empty.',
        )
      }

      if (
        !validateDelivery()
      ) {
        setSubmitting(
          false,
        )
        return
      }

      if (
        totalAmount <= 0
      ) {
        throw new Error(
          'Invalid order amount.',
        )
      }

      const {
        data: authData,
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
        userError ||
        !authData.user
      ) {
        navigate(
          '/login?redirect=/fashion-booking',
        )
        return
      }

      const user =
        authData.user

      /* -----------------------------------------
         FINAL STOCK VALIDATION
      ----------------------------------------- */

      const latestSizeIds =
        orderItems.map(
          (item) =>
            item.designSizeId,
        )

      const {
        data: latestSizes,
        error: stockError,
      } =
        await supabase
          .from(
            'fashion_design_sizes',
          )
          .select(
            'id, stock_quantity, is_active, price',
          )
          .in(
            'id',
            latestSizeIds,
          )

      if (stockError) {
        throw stockError
      }

      for (
        const item of orderItems
      ) {
        const latest =
          latestSizes?.find(
            (size) =>
              size.id ===
              item.designSizeId,
          )

        if (
          !latest ||
          !latest.is_active
        ) {
          throw new Error(
            `${item.design.name} (${item.size}) is no longer available.`,
          )
        }

        const stock =
          Number(
            latest.stock_quantity,
          )

        if (
          Number.isFinite(stock) &&
          stock <
            item.quantity
        ) {
          throw new Error(
            `Only ${stock} ${
              item.size
            } item${
              stock === 1
                ? ''
                : 's'
            } remain for ${item.design.name}.`,
          )
        }

        const databasePrice =
          Number(
            latest.price,
          )

        if (
          databasePrice !==
          item.unitPrice
        ) {
          throw new Error(
            `The price of ${item.design.name} has changed. Please refresh your cart.`,
          )
        }
      }

      /* -----------------------------------------
         CREATE ORDER
      ----------------------------------------- */

      const orderNumber =
        `WF-${Date.now()}-${Math.floor(
          Math.random() * 1000,
        )
          .toString()
          .padStart(
            3,
            '0',
          )}`

      const {
        data: order,
        error: orderError,
      } =
        await supabase
          .from(
            'fashion_orders',
          )
          .insert({
            order_number:
              orderNumber,

            customer_id:
              user.id,

            customer_name:
              form.name.trim(),

            customer_email:
              form.email.trim(),

            customer_phone:
              form.phone.trim(),

            subtotal,

            discount_amount:
              discountAmount,

            total_amount:
              totalAmount,

            status:
              'pending',

            shipping_address:
              form.address.trim(),

            shipping_city:
              form.city.trim(),

            shipping_pincode:
              form.pincode.trim(),

            notes:
              form.notes.trim() ||
              null,
          })
          .select(
            'id, order_number',
          )
          .single()

      if (
        orderError ||
        !order
      ) {
        console.error(
          'fashion_orders insert error:',
          orderError,
        )

        throw (
          orderError ??
          new Error(
            'Unable to create your fashion order.',
          )
        )
      }

      createdOrderId =
        order.id

      /* -----------------------------------------
         CREATE ORDER ITEMS
      ----------------------------------------- */

      const itemsPayload =
        orderItems.map(
          (item) => ({
            order_id:
              order.id,

            design_id:
              item.designId,

            design_size_id:
              item.designSizeId,

            design_name:
              item.design.name,

            size:
              item.size,

            quantity:
              item.quantity,

            unit_price:
              item.unitPrice,

            discount_amount:
              0,

            final_price:
              item.lineTotal,
          }),
        )

      const {
        error: itemsError,
      } =
        await supabase
          .from(
            'fashion_order_items',
          )
          .insert(
            itemsPayload,
          )

      if (itemsError) {
        console.error(
          'fashion_order_items insert error:',
          itemsError,
        )

        throw itemsError
      }

      /* -----------------------------------------
         CREATE RAZORPAY ORDER
      ----------------------------------------- */

      const razorpayOrder =
        await createRazorpayOrder(
          totalAmount,
          orderNumber,
        )

      /* -----------------------------------------
         CREATE PAYMENT RECORD
      ----------------------------------------- */

      const {
        error: paymentError,
      } =
        await supabase
          .from(
            'fashion_order_payments',
          )
          .insert({
            order_id:
              order.id,

            payment_method:
              'razorpay',

            amount:
              totalAmount,

            status:
              'pending',

            razorpay_order_id:
              razorpayOrder.order.id,
          })

      if (paymentError) {
        console.error(
          'fashion_order_payments insert error:',
          paymentError,
        )

        throw (
          paymentError ??
          new Error(
            'Unable to create payment record.',
          )
        )
      }

      /* -----------------------------------------
         OPEN CHECKOUT
      ----------------------------------------- */

      openRazorpayCheckout(
        razorpayOrder,
        order.id,
        order.order_number,
      )
    } catch (submitError) {
      console.error(
        'Fashion order submission error:',
        submitError,
      )

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Unable to start payment. Please try again.',
      )

      setSubmitting(
        false,
      )

      void createdOrderId
    }
  }

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (
    !loading &&
    cartItems.length ===
      0 &&
    !success
  ) {
    return (
      <main className="fashion-booking-page">
        <section className="fashion-booking-empty">
          <div className="fashion-empty-mark">
            WF
          </div>

          <span className="fashion-empty-eyebrow">
            WILDFLORAL FASHION
          </span>

          <h1>
            Your Cart Is Empty
          </h1>

          <p>
            Explore our fashion
            collection and add
            something beautiful
            before continuing to
            checkout.
          </p>

          <button
            type="button"
            className="fashion-primary-button"
            onClick={() =>
              navigate(
                '/fashion',
              )
            }
          >
            Explore Collection
            <span>→</span>
          </button>
        </section>
      </main>
    )
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="fashion-booking-page">
        <section className="fashion-loading-screen">
          <div className="fashion-loader" />
          <span>
            Preparing your
            fashion checkout...
          </span>
        </section>
      </main>
    )
  }

  /* =========================================================
     SUCCESS
  ========================================================= */

  if (success) {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' • ' + new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    return (
      <main className="fashion-booking-page">
        <section className="fashion-success-screen">
          {/* TOP CELEBRATION GRAPHIC */}
          <div className="fashion-success-hero-graphic">
            <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="35" r="4" fill="#F59E0B" />
              <rect x="145" y="25" width="8" height="8" rx="2" fill="#8B5CF6" transform="rotate(25 145 25)" />
              <rect x="35" y="85" width="7" height="7" rx="1.5" fill="#3B82F6" transform="rotate(-15 35 85)" />
              <circle cx="155" cy="75" r="3.5" fill="#10B981" />
              <polygon points="80,10 84,18 76,18" fill="#EC4899" />
              <polygon points="105,15 110,22 101,23" fill="#F59E0B" />
              <rect x="130" y="105" width="6" height="6" rx="1" fill="#3B82F6" />
              
              <path d="M90 25C90 25 125 32 125 65C125 95 90 115 90 115C90 115 55 95 55 65C55 32 90 25 90 25Z" fill="#10B981" />
              <path d="M75 66L85 76L105 54" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="fashion-success-title">
            Order Confirmed
          </h1>

          <p className="fashion-success-subtitle">
            Your fashion order has been successfully placed & confirmed
          </p>

          <div className="fashion-reference-container">
            <span className="fashion-reference-label">Order Reference</span>
            <div className="fashion-reference-box">
              <div className="fashion-reference-number-row">
                <strong className="fashion-reference-code">
                  {completedOrderNumber || 'WF-' + Date.now()}
                </strong>
                <button
                  type="button"
                  className="fashion-copy-icon-btn"
                  onClick={() => {
                    if (completedOrderNumber) {
                      navigator.clipboard.writeText(completedOrderNumber)
                      setCopiedRef(true)
                      setTimeout(() => setCopiedRef(false), 2000)
                    }
                  }}
                  title="Copy reference number"
                  aria-label="Copy reference number"
                >
                  {copiedRef ? '✓' : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
              <span className="fashion-reference-timestamp">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="fashion-info-banner">
            <div className="fashion-info-icon">
              ⓘ
            </div>
            <p className="fashion-info-text">
              Use this order reference to track your fashion order status anytime in the <strong>‘My Orders’</strong> section.
            </p>
          </div>

          <div className="fashion-success-actions-group">
            <button
              type="button"
              className="fashion-btn-primary-navy"
              onClick={() => navigate('/account/bookings/fashion')}
            >
              Go to My Orders
            </button>

            <button
              type="button"
              className="fashion-btn-secondary-outline"
              onClick={() => navigate('/fashion')}
            >
              Continue Shopping
            </button>
          </div>
        </section>
      </main>
    )
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <main className="fashion-booking-page">
      <header className="fashion-booking-header">
        <div className="fashion-header-inner">
          <button
            type="button"
            className="fashion-back-button"
            onClick={() =>
              navigate(
                '/fashion',
              )
            }
          >
            <span>←</span>
            Back to Collection
          </button>

          <div className="fashion-header-copy">
            <span>
              WILDFLORAL
              <b> / </b>
              FASHION STUDIO
            </span>

            <h1>
              Complete Your
              <em> Order</em>
            </h1>

            <p>
              A refined checkout
              experience for your
              WildFloral fashion
              purchase.
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <nav
        className="fashion-progress"
        aria-label="Checkout progress"
      >
        <button
          type="button"
          className={`fashion-progress-step ${
            currentStep === 1
              ? 'active'
              : ''
          } ${
            currentStep > 1
              ? 'completed'
              : ''
          }`}
          onClick={() =>
            goToStep(1)
          }
        >
          <span>01</span>

          <div>
            <strong>
              Your Order
            </strong>

            <small>
              Review items
            </small>
          </div>
        </button>

        <div
          className={`fashion-progress-line ${
            currentStep > 1
              ? 'filled'
              : ''
          }`}
        />

        <button
          type="button"
          className={`fashion-progress-step ${
            currentStep === 2
              ? 'active'
              : ''
          } ${
            currentStep > 2
              ? 'completed'
              : ''
          }`}
          onClick={() => {
            if (
              currentStep >=
              2
            ) {
              goToStep(2)
            }
          }}
        >
          <span>02</span>

          <div>
            <strong>
              Delivery
            </strong>

            <small>
              Your details
            </small>
          </div>
        </button>

        <div
          className={`fashion-progress-line ${
            currentStep > 2
              ? 'filled'
              : ''
          }`}
        />

        <button
          type="button"
          className={`fashion-progress-step ${
            currentStep === 3
              ? 'active'
              : ''
          }`}
          onClick={() => {
            if (
              currentStep >=
              3
            ) {
              goToStep(3)
            }
          }}
        >
          <span>03</span>

          <div>
            <strong>
              Payment
            </strong>

            <small>
              Razorpay
            </small>
          </div>
        </button>
      </nav>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="fashion-alert fashion-alert-error"
          role="alert"
        >
          <span>!</span>

          <p>{error}</p>

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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="fashion-booking-shell">
        <div className="fashion-booking-layout">
          <div className="fashion-booking-main">

            {/* =================================================
                STEP 1
            ================================================= */}

            {currentStep === 1 && (
              <section className="fashion-step-panel">
                <div className="fashion-section-heading">
                  <div className="fashion-section-number">
                    01
                  </div>

                  <div>
                    <span>
                      YOUR SELECTION
                    </span>

                    <h2>
                      Review Your
                      <em> Pieces</em>
                    </h2>

                    <p>
                      Check your
                      selected designs,
                      sizes and
                      quantities before
                      continuing.
                    </p>
                  </div>
                </div>

                <div className="fashion-items-list">
                  {orderItems.map(
                    (item) => (
                      <article
                        className="fashion-item-card"
                        key={`${item.designId}-${item.designSizeId}`}
                      >
                        <div className="fashion-item-image">
                          {item.image ? (
                            <img
                              src={
                                item.image
                                  .image_url
                              }
                              alt={
                                item.image
                                  .alt_text ??
                                item.design
                                  .name
                              }
                            />
                          ) : (
                            <div className="fashion-item-placeholder">
                              WF
                            </div>
                          )}
                        </div>

                        <div className="fashion-item-info">
                          <span>
                            FASHION
                          </span>

                          <h3>
                            {
                              item
                                .design
                                .name
                            }
                          </h3>

                          <p>
                            {item.design
                              .description ??
                              'Designed with care for your personal style.'}
                          </p>

                          <div className="fashion-item-meta">
                            <span>
                              Size{' '}
                              <strong>
                                {
                                  item.size
                                }
                              </strong>
                            </span>

                            <span>
                              {formatPrice(
                                item.unitPrice,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="fashion-item-actions">
                          <div className="fashion-quantity">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item,
                                  item.quantity -
                                    1,
                                )
                              }
                              disabled={
                                item.quantity <=
                                1
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>

                            <strong>
                              {
                                item.quantity
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item,
                                  item.quantity +
                                    1,
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <strong className="fashion-item-total">
                            {formatPrice(
                              item.lineTotal,
                            )}
                          </strong>

                          <button
                            type="button"
                            className="fashion-remove-button"
                            onClick={() =>
                              handleRemoveItem(
                                item,
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>

                {activeOffer && (
                  <div className="fashion-offer-banner">
                    <span>✦</span>

                    <div>
                      <strong>
                        {
                          activeOffer.title
                        }
                      </strong>

                      <p>
                        Your available
                        offer has been
                        applied to this
                        order.
                      </p>
                    </div>

                    <b>
                      -
                      {formatPrice(
                        discountAmount,
                      )}
                    </b>
                  </div>
                )}

                <div className="fashion-step-actions">
                  <button
                    type="button"
                    className="fashion-primary-button"
                    onClick={() =>
                      goToStep(2)
                    }
                  >
                    Continue to
                    Delivery
                    <span>→</span>
                  </button>
                </div>
              </section>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {currentStep === 2 && (
              <section className="fashion-step-panel">
                <div className="fashion-section-heading">
                  <div className="fashion-section-number">
                    02
                  </div>

                  <div>
                    <span>
                      DELIVERY DETAILS
                    </span>

                    <h2>
                      Where Should We
                      <em> Deliver?</em>
                    </h2>

                    <p>
                      Enter accurate
                      contact and
                      delivery details
                      for your order.
                    </p>
                  </div>
                </div>

                <form
                  className="fashion-form"
                  onSubmit={(
                    event,
                  ) => {
                    event.preventDefault()

                    if (
                      validateDelivery()
                    ) {
                      goToStep(
                        3,
                      )
                    }
                  }}
                >
                  <div className="fashion-form-grid">
                    <label>
                      <span>
                        Full Name
                      </span>

                      <input
                        type="text"
                        value={
                          form.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'name',
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Your full name"
                        autoComplete="name"
                        maxLength={100}
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Email Address
                      </span>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'email',
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        maxLength={150}
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Mobile Number
                      </span>

                      <input
                        type="tel"
                        value={
                          form.phone
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'phone',
                            event
                              .target
                              .value
                              .replace(
                                /\D/g,
                                '',
                              )
                              .slice(
                                0,
                                10,
                              ),
                          )
                        }
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        inputMode="numeric"
                        required
                      />
                    </label>

                    <label>
                      <span>
                        City
                      </span>

                      <input
                        type="text"
                        value={
                          form.city
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'city',
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Your city"
                        autoComplete="address-level2"
                        maxLength={80}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    <span>
                      Delivery Address
                    </span>

                    <textarea
                      value={
                        form.address
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'address',
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="House / Flat, Street, Area, Landmark"
                      autoComplete="street-address"
                      maxLength={500}
                      rows={4}
                      required
                    />
                  </label>

                  <label>
                    <span>
                      Pincode
                    </span>

                    <input
                      type="text"
                      value={
                        form.pincode
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'pincode',
                          event
                            .target
                            .value
                            .replace(
                              /\D/g,
                              '',
                            )
                            .slice(
                              0,
                              6,
                            ),
                        )
                      }
                      placeholder="6-digit pincode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      required
                    />
                  </label>

                  <label>
                    <span>
                      Order Notes
                      <small>
                        Optional
                      </small>
                    </span>

                    <textarea
                      value={
                        form.notes
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'notes',
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Any special instructions for your order?"
                      maxLength={500}
                      rows={3}
                    />
                  </label>

                  <div className="fashion-delivery-note">
                    <span>✓</span>

                    <div>
                      <strong>
                        Carefully prepared
                        for you
                      </strong>

                      <p>
                        Delivery timing
                        depends on the
                        selected design
                        and availability.
                      </p>
                    </div>
                  </div>

                  <div className="fashion-step-actions fashion-step-actions-split">
                    <button
                      type="button"
                      className="fashion-secondary-button"
                      onClick={() =>
                        goToStep(1)
                      }
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      className="fashion-primary-button"
                    >
                      Continue to
                      Payment
                      <span>→</span>
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* =================================================
                STEP 3
            ================================================= */}

            {currentStep === 3 && (
              <form
                className="fashion-step-panel"
                onSubmit={handlePlaceOrder}
              >
                <div className="fashion-section-heading">
                  <div className="fashion-section-number">
                    03
                  </div>

                  <div>
                    <span>
                      SECURE ONLINE PAYMENT
                    </span>

                    <h2>
                      Complete Your
                      <em> Payment</em>
                    </h2>

                    <p>
                      Review your delivery details and complete your payment securely via Razorpay.
                    </p>
                  </div>
                </div>

                {/* NO COD NOTICE */}
                <div className="fashion-no-cod-banner">
                  <div className="fashion-no-cod-badge">
                    <span>⚡</span> Online Payment Only
                  </div>
                  <p>
                    <strong>Cash on Delivery (COD) is NOT available.</strong> All WildFloral fashion purchases require online payment completion via UPI, Card, or Net Banking.
                  </p>
                </div>

                {/* DELIVERY & CONTACT RECAP */}
                <div className="fashion-delivery-recap-box">
                  <div className="fashion-recap-header">
                    <div>
                      <span>DELIVERY & CONTACT RECAP</span>
                      <h4>{form.name}</h4>
                    </div>
                    <button
                      type="button"
                      className="fashion-recap-edit-btn"
                      onClick={() => goToStep(2)}
                    >
                      Edit Details
                    </button>
                  </div>
                  <div className="fashion-recap-grid">
                    <div>
                      <small>Contact Info</small>
                      <p>{form.phone}</p>
                      <p>{form.email}</p>
                    </div>
                    <div>
                      <small>Shipping Address</small>
                      <p>{form.address}</p>
                      <p>{form.city}, {form.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* RAZORPAY PAYMENT METHOD */}
                <div className="fashion-razorpay-card">
                  <div className="fashion-razorpay-brand">
                    ₹
                  </div>

                  <div>
                    <span>
                      SECURE GATEWAY
                    </span>

                    <h3>
                      Pay with Razorpay
                    </h3>

                    <p>
                      Supports Instant UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking & Wallets.
                    </p>

                    <div className="fashion-payment-methods-pills">
                      <span>UPI</span>
                      <span>Cards</span>
                      <span>NetBanking</span>
                      <span>Wallets</span>
                    </div>
                  </div>

                  <div className="fashion-secure-pill">
                    <span>🔒</span>
                    256-bit SSL
                  </div>
                </div>

                {/* TOTAL PAYABLE */}
                <div className="fashion-payment-total-card">
                  <div>
                    <span>
                      Total Amount Payable
                    </span>

                    <strong>
                      {formatPrice(
                        totalAmount,
                      )}
                    </strong>
                  </div>

                  <small>
                    INR · Includes all applicable taxes & instant order verification
                  </small>
                </div>

                <div className="fashion-payment-consent">
                  <span>🔒</span>

                  <p>
                    By clicking Pay, your payment will be securely processed through Razorpay. Successful payments immediately confirm your order.
                  </p>
                </div>

                <div className="fashion-step-actions fashion-step-actions-split">
                  <button
                    type="button"
                    className="fashion-secondary-button"
                    onClick={() =>
                      goToStep(2)
                    }
                    disabled={
                      submitting
                    }
                  >
                    ← Back to Delivery
                  </button>

                  <button
                    type="submit"
                    className="fashion-primary-button fashion-pay-button"
                    disabled={
                      submitting
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="fashion-button-spinner" />
                        Opening Gateway...
                      </>
                    ) : (
                      <>
                        Pay{' '}
                        {formatPrice(
                          totalAmount,
                        )}
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <aside className="fashion-order-sidebar">
            <div className="fashion-summary-card">
              <div className="fashion-summary-heading">
                <div>
                  <span>
                    YOUR ORDER
                  </span>

                  <h2>
                    Summary
                  </h2>
                </div>

                <span className="fashion-summary-count">
                  {
                    orderItems.length
                  }
                </span>
              </div>

              <div className="fashion-summary-items">
                {orderItems.map(
                  (item) => (
                    <div
                      className="fashion-summary-item"
                      key={`${item.designId}-${item.designSizeId}`}
                    >
                      <div className="fashion-summary-thumb">
                        {item.image ? (
                          <img
                            src={
                              item.image
                                .image_url
                            }
                            alt=""
                          />
                        ) : (
                          'WF'
                        )}
                      </div>

                      <div>
                        <strong>
                          {
                            item.design
                              .name
                          }
                        </strong>

                        <span>
                          Size{' '}
                          {item.size}
                          {' · '}
                          Qty{' '}
                          {
                            item.quantity
                          }
                        </span>
                      </div>

                      <b>
                        {formatPrice(
                          item.lineTotal,
                        )}
                      </b>
                    </div>
                  ),
                )}
              </div>

              <div className="fashion-summary-divider" />

              <div className="fashion-summary-lines">
                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      subtotal,
                    )}
                  </strong>
                </div>

                {discountAmount >
                  0 && (
                  <div className="discount">
                    <span>
                      Discount
                    </span>

                    <strong>
                      -
                      {formatPrice(
                        discountAmount,
                      )}
                    </strong>
                  </div>
                )}

                <div className="fashion-summary-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPrice(
                      totalAmount,
                    )}
                  </strong>
                </div>
              </div>

              <div className="fashion-summary-secure">
                <span>✓</span>

                <p>
                  Secure payment
                  powered by
                  Razorpay
                </p>
              </div>
            </div>

            <div className="fashion-sidebar-note">
              <span>
                ✦
              </span>

              <div>
                <strong>
                  WildFloral
                  Fashion Studio
                </strong>

                <p>
                  Designed around
                  your personal style,
                  crafted with care.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default FashionBooking