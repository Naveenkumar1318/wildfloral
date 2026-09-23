import "@supabase/functions-js/edge-runtime.d.ts";

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

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error: "Method not allowed",
        },
        405,
      );
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return jsonResponse(
        {
          error:
            "Razorpay credentials are not configured.",
        },
        500,
      );
    }

    try {
      const body = await req.json();

      const amount = Number(body?.amount);

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        return jsonResponse(
          {
            error:
              "Amount must be a positive integer in paise.",
          },
          400,
        );
      }

      const receipt =
        typeof body?.receipt === "string" &&
        body.receipt.trim()
          ? body.receipt.trim()
          : `fashion_${Date.now()}`;

      const auth = btoa(
        `${razorpayKeyId}:${razorpayKeySecret}`,
      );

      const razorpayResponse = await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "INR",
            receipt,
          }),
        },
      );

      const razorpayData =
        await razorpayResponse.json();

      if (!razorpayResponse.ok) {
        console.error(
          "Razorpay order creation failed:",
          razorpayData,
        );

        return jsonResponse(
          {
            error:
              "Failed to create Razorpay order.",
          },
          razorpayResponse.status,
        );
      }

      return jsonResponse({
        success: true,
        order: {
          id: razorpayData.id,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          receipt: razorpayData.receipt,
          status: razorpayData.status,
        },
        keyId: razorpayKeyId,
      });
    } catch (error) {
      console.error(
        "Create Razorpay order error:",
        error,
      );

      return jsonResponse(
        {
          error:
            "Unable to create Razorpay order.",
        },
        500,
      );
    }
  },
};