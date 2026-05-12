import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId, origin } = await req.json();
    if (!registrationId || typeof registrationId !== "string") {
      return new Response(JSON.stringify({ error: "registrationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single();

    if (regError || !reg) {
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reg.payment_status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Registration is not pending payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reg.hold_expires_at && new Date(reg.hold_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Hold expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = reg.events as any;
    const unitAmount = Math.round(Number(event.price) * 100);
    if (!unitAmount || unitAmount < 50) {
      return new Response(JSON.stringify({ error: "Invalid event price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-11-20.acacia",
    });

    const baseUrl = origin || req.headers.get("origin") || "";
    const successUrl = `${baseUrl}/events/${event.id}?registration=${reg.id}&status=success`;
    const cancelUrl = `${baseUrl}/events/${event.id}?registration=${reg.id}&status=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: reg.num_tickets,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: event.title,
              description: event.description?.slice(0, 200) ?? undefined,
            },
            tax_behavior: "exclusive",
          },
        },
      ],
      automatic_tax: { enabled: true },
      customer_email: reg.attendee_email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Stripe min 30 min
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        registration_id: reg.id,
        event_id: event.id,
      },
    });

    await supabase
      .from("registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", reg.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-event-checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
