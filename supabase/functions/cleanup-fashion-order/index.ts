/// <reference types="@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? "";

const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const razorpayKeyId =
  Deno.env.get("RAZORPAY_KEY_ID") ?? "";

const razorpayKeySecret =
  Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

/* =========================================================
   CHECK RAZORPAY PAYMENT STATUS
========================================================= */

async function getRazorpayPayments(
  razorpayOrderId: string,
): Promise<{
  success: boolean;
  payments: Array<{
    id?: string;
    status?: string;
    amount?: number;
    order_id?: string;
  }>;
}> {
  const credentials = btoa(
    `${razorpayKeyId}:${razorpayKeySecret}`,
  );

  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${encodeURIComponent(
      razorpayOrderId,
    )}/payments`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Basic ${credentials}`,
        Accept:
          "application/json",
      },
    },
  );

  if (!response.ok) {
    const responseText =
      await response.text();

    console.error(
      "Razorpay payment lookup failed:",
      {
        status: response.status,
        response: responseText,
      },
    );

    return {
      success: false,
      payments: [],
    };
  }

  const data =
    await response.json();

  return {
    success: true,
    payments:
      Array.isArray(data?.items)
        ? data.items
        : [],
  };
}

/* =========================================================
   CHECK WHETHER A SUCCESSFUL PAYMENT EXISTS
========================================================= */

function hasSuccessfulPayment(
  payments: Array<{
    id?: string;
    status?: string;
    amount?: number;
    order_id?: string;
  }>,
): boolean {
  return payments.some(
    (payment) =>
      payment.status === "captured" ||
      payment.status === "authorized",
  );
}

/* =========================================================
   MAIN FUNCTION
========================================================= */

export default {
  async fetch(
    req: Request,
  ): Promise<Response> {

    /* =====================================================
       CORS
    ===================================================== */

    if (req.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers: corsHeaders,
        },
      );
    }

    /* =====================================================
       POST ONLY
    ===================================================== */

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Method not allowed",
        },
        405,
      );
    }

    /* =====================================================
       SERVER CREDENTIALS
    ===================================================== */

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Supabase server credentials are not configured.",
        },
        500,
      );
    }

    /* =====================================================
       RAZORPAY CREDENTIALS
    ===================================================== */

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return jsonResponse(
        {
          error:
            "Razorpay credentials are not configured.",
        },
        500,
      );
    }

    try {

      /* ===================================================
         READ REQUEST
      =================================================== */

      const body =
        await req.json();

      const orderId =
        typeof body?.order_id ===
        "string"
          ? body.order_id.trim()
          : "";

      if (!orderId) {
        return jsonResponse(
          {
            error:
              "Fashion order ID is required.",
          },
          400,
        );
      }

      /* ===================================================
         SUPABASE ADMIN CLIENT
      =================================================== */

      const supabase =
        createClient(
          supabaseUrl,
          supabaseServiceRoleKey,
        );

      /* ===================================================
         FIND FASHION ORDER
      =================================================== */

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("fashion_orders")
        .select(
          "id, status, total_amount",
        )
        .eq(
          "id",
          orderId,
        )
        .maybeSingle();

      if (orderError) {

        console.error(
          "Failed to find fashion order:",
          orderError,
        );

        return jsonResponse(
          {
            success: false,
            deleted: false,
            error:
              "Unable to find fashion order.",
          },
          500,
        );
      }

      /* ===================================================
         ORDER ALREADY DELETED
      =================================================== */

      if (!order) {
        return jsonResponse({
          success: true,
          deleted: false,
          message:
            "Fashion order does not exist.",
        });
      }

      /* ===================================================
         NEVER DELETE CONFIRMED ORDER
      =================================================== */

      if (
        order.status ===
        "confirmed"
      ) {
        return jsonResponse(
          {
            success: false,
            deleted: false,
            error:
              "Confirmed fashion orders cannot be deleted.",
          },
          409,
        );
      }

      /* ===================================================
         FIND PAYMENT RECORD
      =================================================== */

      const {
        data: payment,
        error: paymentError,
      } = await supabase
        .from(
          "fashion_order_payments",
        )
        .select(
          [
            "id",
            "status",
            "razorpay_order_id",
            "razorpay_payment_id",
            "amount",
          ].join(", "),
        )
        .eq(
          "order_id",
          orderId,
        )
        .eq(
          "payment_method",
          "razorpay",
        )
        .maybeSingle();

      if (paymentError) {

        console.error(
          "Failed to find fashion payment:",
          paymentError,
        );

        return jsonResponse(
          {
            success: false,
            deleted: false,
            error:
              "Unable to verify fashion payment record.",
          },
          500,
        );
      }

      /* ===================================================
         NO PAYMENT RECORD
         
         The order was created but payment was never
         successfully created.
      =================================================== */

      if (!payment) {

        const {
          error: deleteError,
        } = await supabase
          .from(
            "fashion_orders",
          )
          .delete()
          .eq(
            "id",
            orderId,
          )
          .neq(
            "status",
            "confirmed",
          );

        if (deleteError) {

          console.error(
            "Failed to delete fashion order:",
            deleteError,
          );

          return jsonResponse(
            {
              success: false,
              deleted: false,
              error:
                "Unable to clean up fashion order.",
            },
            500,
          );
        }

        return jsonResponse({
          success: true,
          deleted: true,
          orderId,
          reason:
            "No payment record existed.",
        });
      }

      /* ===================================================
         LOCAL PAYMENT ALREADY PAID
      =================================================== */

      if (
        payment.status ===
        "paid"
      ) {
        return jsonResponse(
          {
            success: false,
            deleted: false,
            error:
              "Payment is already marked as paid.",
          },
          409,
        );
      }

      /* ===================================================
         PAYMENT ID EXISTS

         A Razorpay payment ID by itself does NOT mean that
         money was successfully captured.

         The actual Razorpay payment status must be checked
         below.

         Therefore:
         - captured / authorized -> keep the order
         - failed / no successful payment -> delete the
           incomplete local order
      =================================================== */

      /* ===================================================
         NO RAZORPAY ORDER ID
      =================================================== */

      if (
        !payment.razorpay_order_id
      ) {

        const {
          error: deleteError,
        } = await supabase
          .from(
            "fashion_orders",
          )
          .delete()
          .eq(
            "id",
            orderId,
          )
          .neq(
            "status",
            "confirmed",
          );

        if (deleteError) {

          console.error(
            "Failed to delete fashion order:",
            deleteError,
          );

          return jsonResponse(
            {
              success: false,
              deleted: false,
              error:
                "Unable to clean up fashion order.",
            },
            500,
          );
        }

        return jsonResponse({
          success: true,
          deleted: true,
          orderId,
          reason:
            "No Razorpay order existed.",
        });
      }

      /* ===================================================
         CHECK RAZORPAY PAYMENTS
         
         IMPORTANT:
         
         We do NOT use the Razorpay order status
         "attempted" to decide whether payment happened.
         
         Instead, we inspect the actual payments
         belonging to the Razorpay order.
      =================================================== */

      const razorpayResult =
        await getRazorpayPayments(
          payment.razorpay_order_id,
        );

      /* ===================================================
         RAZORPAY API COULD NOT BE VERIFIED
         
         Fail safe.
      =================================================== */

      if (
        !razorpayResult.success
      ) {

        return jsonResponse({
          success: true,
          deleted: false,
          orderId,
          razorpayOrderId:
            payment.razorpay_order_id,
          message:
            "Unable to verify Razorpay payments. Order was not deleted.",
        });
      }

      /* ===================================================
         CHECK ACTUAL PAYMENT
      =================================================== */

      const successfulPayment =
        razorpayResult.payments.find(
          (razorpayPayment) =>
            razorpayPayment.status ===
              "captured" ||
            razorpayPayment.status ===
              "authorized",
        );

      /* ===================================================
         SUCCESSFUL PAYMENT EXISTS
         
         NEVER DELETE.
      =================================================== */

      if (
        successfulPayment
      ) {

        console.warn(
          "Successful Razorpay payment exists. Keeping order:",
          {
            orderId,
            razorpayOrderId:
              payment.razorpay_order_id,
            razorpayPaymentId:
              successfulPayment.id ??
              null,
            razorpayStatus:
              successfulPayment.status ??
              null,
          },
        );

        return jsonResponse(
          {
            success: false,
            deleted: false,
            orderId,
            razorpayOrderId:
              payment.razorpay_order_id,
            razorpayPaymentId:
              successfulPayment.id ??
              null,
            error:
              "A successful Razorpay payment exists. Order was not deleted.",
          },
          409,
        );
      }

      /* ===================================================
         NO SUCCESSFUL PAYMENT
         
         User cancelled/closed checkout or payment failed.
         
         Since there is no captured/authorized payment,
         the temporary local order can be removed.
         
         fashion_order_payments and fashion_order_items
         are automatically deleted because their foreign
         keys use ON DELETE CASCADE.
      =================================================== */

      const {
        error: deleteError,
      } = await supabase
        .from(
          "fashion_orders",
        )
        .delete()
        .eq(
          "id",
          orderId,
        )
        .neq(
          "status",
          "confirmed",
        );

      if (deleteError) {

        console.error(
          "Failed to delete incomplete fashion order:",
          deleteError,
        );

        return jsonResponse(
          {
            success: false,
            deleted: false,
            error:
              "Unable to clean up incomplete fashion order.",
          },
          500,
        );
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      return jsonResponse({
        success: true,
        deleted: true,
        orderId,
        razorpayOrderId:
          payment.razorpay_order_id,
        reason:
          "No successful Razorpay payment was found. Incomplete order was cleaned up.",
      });

    } catch (error) {

      console.error(
        "Cleanup fashion order error:",
        error,
      );

      /* ===================================================
         FAIL SAFE
         
         Never delete when an unexpected error occurs.
      =================================================== */

      return jsonResponse(
        {
          success: false,
          deleted: false,
          error:
            "Unable to safely verify payment status. Order was not deleted.",
        },
        500,
      );
    }
  },
};