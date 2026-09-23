import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const razorpayKeySecret =
  Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? "";

const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

async function generateSignature(
  orderId: string,
  paymentId: string,
): Promise<string> {
  const encoder = new TextEncoder();

  const keyData =
    encoder.encode(razorpayKeySecret);

  const messageData =
    encoder.encode(
      `${orderId}|${paymentId}`,
    );

  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

  const signatureBuffer =
    await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData,
    );

  return Array.from(
    new Uint8Array(signatureBuffer),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

export default {
  async fetch(
    req: Request,
  ): Promise<Response> {

    if (req.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers: corsHeaders,
        },
      );
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Method not allowed",
        },
        405,
      );
    }

    if (!razorpayKeySecret) {
      return jsonResponse(
        {
          error:
            "Razorpay secret is not configured.",
        },
        500,
      );
    }

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

    try {

      const body =
        await req.json();

      const orderId =
        typeof body?.order_id ===
        "string"
          ? body.order_id.trim()
          : "";

      const razorpayOrderId =
        typeof body?.razorpay_order_id ===
        "string"
          ? body.razorpay_order_id.trim()
          : "";

      const razorpayPaymentId =
        typeof body?.razorpay_payment_id ===
        "string"
          ? body.razorpay_payment_id.trim()
          : "";

      const razorpaySignature =
        typeof body?.razorpay_signature ===
        "string"
          ? body.razorpay_signature.trim()
          : "";

      if (
        !orderId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return jsonResponse(
          {
            error:
              "Missing Razorpay payment details.",
          },
          400,
        );
      }


      /*
       * 1. Verify Razorpay signature.
       */

      const expectedSignature =
        await generateSignature(
          razorpayOrderId,
          razorpayPaymentId,
        );

      if (
        expectedSignature !==
        razorpaySignature
      ) {
        return jsonResponse(
          {
            error:
              "Invalid Razorpay payment signature.",
          },
          400,
        );
      }


      /*
       * 2. Create privileged Supabase client.
       */

      const supabase =
        createClient(
          supabaseUrl,
          supabaseServiceRoleKey,
        );


      /*
       * 3. Finalize payment.
       *
       * This PostgreSQL function atomically:
       *
       * - validates stock
       * - reduces stock
       * - marks payment paid
       * - confirms order
       *
       * If anything fails, PostgreSQL rolls
       * the entire transaction back.
       */

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "finalize_fashion_payment",
          {
            p_order_id:
              orderId,

            p_razorpay_order_id:
              razorpayOrderId,

            p_razorpay_payment_id:
              razorpayPaymentId,

            p_razorpay_signature:
              razorpaySignature,
          },
        );


      if (error) {

        console.error(
          "Finalize fashion payment error:",
          error,
        );

        return jsonResponse(
          {
            error:
              error.message ||
              "Unable to finalize payment.",
          },
          400,
        );
      }


      if (!data?.success) {
        return jsonResponse(
          {
            error:
              "Payment could not be finalized.",
          },
          400,
        );
      }


      /* =====================================================
         MARK RAZORPAY PAYMENT AS PAID
      ===================================================== */

      const {
        error: paymentUpdateError,
      } = await supabase
        .from("fashion_order_payments")
        .update({
          status: "paid",
          transaction_reference:
            razorpayPaymentId,
          razorpay_payment_id:
            razorpayPaymentId,
          razorpay_signature:
            razorpaySignature,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "order_id",
          orderId,
        )
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        );


      if (paymentUpdateError) {
        console.error(
          "Failed to update fashion payment status:",
          paymentUpdateError,
        );

        return jsonResponse(
          {
            error:
              "Payment was verified, but the payment record could not be updated.",
          },
          500,
        );
      }


      return jsonResponse({
        success: true,

        message:
          data.already_processed
            ? "Payment already finalized."
            : "Payment verified and stock updated successfully.",

        payment: {
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
        },

        alreadyProcessed:
          Boolean(
            data.already_processed,
          ),
      });

    } catch (error) {

      console.error(
        "Verify Razorpay payment error:",
        error,
      );

      return jsonResponse(
        {
          error:
            "Unable to verify Razorpay payment.",
        },
        500,
      );
    }
  },
};