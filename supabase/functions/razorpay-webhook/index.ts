import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================================
   ENVIRONMENT
========================================================= */

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? "";

const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const razorpayWebhookSecret =
  Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";


/* =========================================================
   SUPABASE ADMIN CLIENT
========================================================= */

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);


/* =========================================================
   RESPONSE
========================================================= */

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}


/* =========================================================
   HMAC SHA-256
========================================================= */

async function generateHmac(
  payload: string,
  secret: string,
): Promise<string> {

  const encoder =
    new TextEncoder();

  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
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
      encoder.encode(payload),
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


/* =========================================================
   TIMING SAFE STRING COMPARISON
========================================================= */

function timingSafeEqual(
  a: string,
  b: string,
): boolean {

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}


/* =========================================================
   WEBHOOK
========================================================= */

export default {

  async fetch(
    req: Request,
  ): Promise<Response> {

    /* =====================================================
       1. METHOD
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
       2. ENVIRONMENT VALIDATION
    ===================================================== */

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey ||
      !razorpayWebhookSecret
    ) {

      console.error(
        "Razorpay webhook environment variables are missing.",
      );

      return jsonResponse(
        {
          error:
            "Webhook configuration error.",
        },
        500,
      );
    }


    try {

      /* ===================================================
         3. READ RAW BODY

         IMPORTANT:
         Razorpay webhook signature must be calculated
         from the ORIGINAL raw request body.
      =================================================== */

      const rawBody =
        await req.text();


      /* ===================================================
         4. READ RAZORPAY HEADERS
      =================================================== */

      const signature =
        req.headers.get(
          "x-razorpay-signature",
        );

      const eventId =
        req.headers.get(
          "x-razorpay-event-id",
        );


      if (!signature) {

        console.error(
          "Missing Razorpay webhook signature.",
        );

        return jsonResponse(
          {
            error:
              "Missing webhook signature.",
          },
          400,
        );
      }


      if (!eventId) {

        console.error(
          "Missing Razorpay webhook event ID.",
        );

        return jsonResponse(
          {
            error:
              "Missing webhook event ID.",
          },
          400,
        );
      }


      /* ===================================================
         5. VERIFY WEBHOOK SIGNATURE
      =================================================== */

      const expectedSignature =
        await generateHmac(
          rawBody,
          razorpayWebhookSecret,
        );


      if (
        !timingSafeEqual(
          expectedSignature,
          signature,
        )
      ) {

        console.error(
          "Invalid Razorpay webhook signature.",
        );

        return jsonResponse(
          {
            error:
              "Invalid webhook signature.",
          },
          400,
        );
      }


      /* ===================================================
         6. PARSE PAYLOAD
      =================================================== */

      let payload: any;

      try {

        payload =
          JSON.parse(rawBody);

      } catch {

        return jsonResponse(
          {
            error:
              "Invalid JSON payload.",
          },
          400,
        );
      }


      const eventType =
        payload?.event;


      if (
        typeof eventType !==
        "string"
      ) {

        return jsonResponse(
          {
            error:
              "Invalid webhook event.",
          },
          400,
        );
      }


      /* ===================================================
         7. CHECK EXISTING WEBHOOK EVENT
         
         We check BEFORE processing so duplicate Razorpay
         deliveries do not repeat business logic.
      =================================================== */

      const {
        data: existingEvent,
        error: existingEventError,
      } = await supabase
        .from(
          "razorpay_webhook_events",
        )
        .select(
          "id, processed",
        )
        .eq(
          "razorpay_event_id",
          eventId,
        )
        .maybeSingle();


      if (existingEventError) {

        console.error(
          "Failed to check webhook event:",
          existingEventError,
        );

        return jsonResponse(
          {
            error:
              "Unable to check webhook event.",
          },
          500,
        );
      }


      /* ===================================================
         8. ALREADY PROCESSED
      =================================================== */

      if (
        existingEvent?.processed === true
      ) {

        return jsonResponse({
          success: true,

          alreadyProcessed: true,

          event:
            eventType,
        });
      }


      /* ===================================================
         9. CREATE WEBHOOK EVENT RECORD
         
         If this is the first delivery, create the record.
      =================================================== */

      if (!existingEvent) {

        const {
          error:
            eventInsertError,
        } = await supabase
          .from(
            "razorpay_webhook_events",
          )
          .insert({
            razorpay_event_id:
              eventId,

            event_type:
              eventType,

            payload,

            processed:
              false,
          });


        if (
          eventInsertError &&
          eventInsertError.code !==
            "23505"
        ) {

          console.error(
            "Webhook event insert failed:",
            eventInsertError,
          );

          return jsonResponse(
            {
              error:
                "Unable to record webhook event.",
            },
            500,
          );
        }
      }


      /* ===================================================
         10. PAYMENT FAILED
      =================================================== */

      if (
        eventType ===
        "payment.failed"
      ) {

        const payment =
          payload?.payload
            ?.payment
            ?.entity;


        const razorpayOrderId =
          payment?.order_id;


        const razorpayPaymentId =
          payment?.id;


        if (
          typeof razorpayOrderId ===
          "string"
        ) {

          const {
            error:
              paymentUpdateError,
          } = await supabase
            .from(
              "fashion_order_payments",
            )
            .update({

              status:
                "rejected",

              razorpay_payment_id:
                typeof razorpayPaymentId ===
                "string"
                  ? razorpayPaymentId
                  : null,

              updated_at:
                new Date().toISOString(),

            })
            .eq(
              "razorpay_order_id",
              razorpayOrderId,
            )
            .in(
              "status",
              [
                "pending",
                "submitted",
                "verified",
              ],
            );


          if (
            paymentUpdateError
          ) {

            console.error(
              "Failed to update failed payment:",
              paymentUpdateError,
            );

            return jsonResponse(
              {
                error:
                  "Unable to update failed payment.",
              },
              500,
            );
          }
        }


        /* -----------------------------------------------
           Mark webhook processed
        ----------------------------------------------- */

        const {
          error:
            failedEventUpdateError,
        } = await supabase
          .from(
            "razorpay_webhook_events",
          )
          .update({
            processed:
              true,
          })
          .eq(
            "razorpay_event_id",
            eventId,
          );


        if (
          failedEventUpdateError
        ) {

          console.error(
            "Failed to mark failed webhook as processed:",
            failedEventUpdateError,
          );

          return jsonResponse(
            {
              error:
                "Failed payment was updated but webhook state could not be recorded.",
            },
            500,
          );
        }


        return jsonResponse({
          success: true,

          event:
            eventType,
        });
      }


      /* ===================================================
         11. IGNORE OTHER EVENTS
      =================================================== */

      if (
        eventType !==
        "payment.captured"
      ) {

        return jsonResponse({
          success: true,

          ignored: true,

          event:
            eventType,
        });
      }


      /* ===================================================
         12. GET PAYMENT ENTITY
      =================================================== */

      const payment =
        payload?.payload
          ?.payment
          ?.entity;


      if (!payment) {

        return jsonResponse(
          {
            error:
              "Payment entity missing.",
          },
          400,
        );
      }


      const razorpayPaymentId =
        payment.id;


      const razorpayOrderId =
        payment.order_id;


      const razorpayAmount =
        Number(
          payment.amount,
        );


      const razorpayCurrency =
        payment.currency;


      const paymentStatus =
        payment.status;


      const captured =
        payment.captured === true;


      if (
        typeof razorpayPaymentId !==
          "string" ||
        typeof razorpayOrderId !==
          "string"
      ) {

        return jsonResponse(
          {
            error:
              "Invalid Razorpay payment identifiers.",
          },
          400,
        );
      }


      /* ===================================================
         13. FIND FASHION PAYMENT
      =================================================== */

      const {
        data:
          fashionPayment,
        error:
          fashionPaymentError,
      } = await supabase
        .from(
          "fashion_order_payments",
        )
        .select(
          `
            id,
            order_id,
            amount,
            status,
            razorpay_order_id,
            razorpay_payment_id
          `,
        )
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        )
        .maybeSingle();


      if (
        fashionPaymentError
      ) {

        console.error(
          "Fashion payment lookup failed:",
          fashionPaymentError,
        );

        return jsonResponse(
          {
            error:
              "Unable to find fashion payment.",
          },
          500,
        );
      }


      if (!fashionPayment) {

        console.error(
          "Fashion payment not found:",
          razorpayOrderId,
        );

        return jsonResponse(
          {
            error:
              "Fashion payment record not found.",
          },
          400,
        );
      }


      /* ===================================================
         14. VERIFY PAYMENT AMOUNT
         
         fashion_order_payments.amount = RUPEES
         Razorpay payment.amount = PAISE
      =================================================== */

      const expectedAmount =
        Math.round(
          Number(
            fashionPayment.amount,
          ) * 100,
        );


      if (
        expectedAmount !==
        razorpayAmount
      ) {

        console.error(
          "Payment amount mismatch:",
          {
            expectedAmount,
            razorpayAmount,
            razorpayOrderId,
          },
        );

        return jsonResponse(
          {
            error:
              "Payment amount mismatch.",
          },
          400,
        );
      }


      /* ===================================================
         15. VERIFY CURRENCY
      =================================================== */

      if (
        razorpayCurrency !==
        "INR"
      ) {

        console.error(
          "Payment currency mismatch:",
          razorpayCurrency,
        );

        return jsonResponse(
          {
            error:
              "Payment currency mismatch.",
          },
          400,
        );
      }


      /* ===================================================
         16. VERIFY CAPTURED PAYMENT
      =================================================== */

      if (
        paymentStatus !==
          "captured" ||
        !captured
      ) {

        console.error(
          "Payment is not captured.",
        );

        return jsonResponse(
          {
            error:
              "Payment is not captured.",
          },
          400,
        );
      }


      /* ===================================================
         17. FINALIZE PAYMENT ATOMICALLY
         
         PostgreSQL function handles:
         
         - payment locking
         - order locking
         - stock validation
         - stock reduction
         - payment update
         - order confirmation
         - idempotency
      =================================================== */

      const {
        data:
          finalizeData,
        error:
          finalizeError,
      } = await supabase.rpc(
        "finalize_fashion_payment",
        {
          p_order_id:
            fashionPayment.order_id,

          p_razorpay_order_id:
            razorpayOrderId,

          p_razorpay_payment_id:
            razorpayPaymentId,

          /*
           * The webhook has its own HMAC signature.
           *
           * This is NOT the Razorpay Checkout
           * payment signature.
           *
           * The database function accepts NULL
           * for webhook processing.
           */
          p_razorpay_signature:
            null,
        },
      );


      if (
        finalizeError
      ) {

        console.error(
          "Finalize fashion payment failed:",
          {
            message:
              finalizeError.message,

            details:
              finalizeError.details,

            hint:
              finalizeError.hint,

            code:
              finalizeError.code,
          },
        );

        /*
         * Return 500 so Razorpay retries.
         */
        return jsonResponse(
          {
            success: false,

            error:
              "Payment received but order finalization failed.",
          },
          500,
        );
      }


      if (
        !finalizeData?.success
      ) {

        console.error(
          "Fashion payment was not finalized:",
          finalizeData,
        );

        return jsonResponse(
          {
            success: false,

            error:
              "Payment could not be finalized.",
          },
          500,
        );
      }


      /* ===================================================
         18. MARK WEBHOOK PROCESSED
      =================================================== */

      const {
        error:
          eventUpdateError,
      } = await supabase
        .from(
          "razorpay_webhook_events",
        )
        .update({
          processed:
            true,
        })
        .eq(
          "razorpay_event_id",
          eventId,
        );


      if (
        eventUpdateError
      ) {

        console.error(
          "Failed to mark webhook as processed:",
          eventUpdateError,
        );

        /*
         * Payment itself is already finalized.
         * Return 500 so Razorpay retries.
         *
         * The database payment function is idempotent,
         * so the retry will not reduce stock twice.
         */
        return jsonResponse(
          {
            error:
              "Payment finalized but webhook state could not be recorded.",
          },
          500,
        );
      }


      /* ===================================================
         19. SUCCESS
      =================================================== */

      return jsonResponse({

        success:
          true,

        event:
          eventType,

        alreadyProcessed:
          Boolean(
            finalizeData
              .already_processed,
          ),

        payment_id:
          razorpayPaymentId,

        razorpay_order_id:
          razorpayOrderId,

        fashion_order_id:
          fashionPayment.order_id,

      });


    } catch (error) {

      console.error(
        "Razorpay webhook error:",
        error,
      );

      /*
       * Returning 500 allows Razorpay to retry
       * temporary failures.
       */

      return jsonResponse(
        {
          error:
            "Webhook processing failed.",
        },
        500,
      );
    }
  },
};