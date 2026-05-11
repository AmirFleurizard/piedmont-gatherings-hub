import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { format } from "https://esm.sh/date-fns@3.6.0";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!signature || !webhookSecret || !stripeKey) {
    return new Response("Missing webhook configuration", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.registration_id;
      if (!registrationId) {
        console.warn("No registration_id in session metadata");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: reg } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("id", registrationId)
        .single();

      if (!reg) return new Response(JSON.stringify({ received: true }), { status: 200 });

      // Idempotency: skip if already paid
      if (reg.payment_status === "paid") {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await supabase
        .from("registrations")
        .update({
          payment_status: "paid",
          registration_status: "confirmed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          hold_expires_at: null,
        })
        .eq("id", registrationId);

      // Send confirmation email
      try {
        const ev = reg.events as any;
        const eventDate = format(
          new Date(ev.event_date),
          "EEEE, MMMM d, yyyy 'at' h:mm a"
        );
        const totalAmount = (session.amount_total ?? 0) / 100;

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "registration-confirmation",
            recipientEmail: reg.attendee_email,
            idempotencyKey: `reg-confirm-${reg.id}`,
            templateData: {
              attendeeName: reg.attendee_name,
              eventTitle: ev.title,
              eventDate,
              eventLocation: ev.location,
              numTickets: reg.num_tickets,
              totalPrice: totalAmount,
              registrationId: reg.id,
            },
          },
        });

        await supabase
          .from("registrations")
          .update({ confirmation_sent: true })
          .eq("id", reg.id);
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.registration_id;
      if (!registrationId) {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: reg } = await supabase
        .from("registrations")
        .select("id, event_id, num_tickets, payment_status")
        .eq("id", registrationId)
        .single();

      if (!reg || reg.payment_status === "paid" || reg.payment_status === "cancelled") {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await supabase.rpc("release_event_spots", {
        _event_id: reg.event_id,
        _num_tickets: reg.num_tickets,
      });

      await supabase
        .from("registrations")
        .update({
          payment_status: "cancelled",
          registration_status: "cancelled",
        })
        .eq("id", registrationId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: "Handler error" }), { status: 500 });
  }
});
