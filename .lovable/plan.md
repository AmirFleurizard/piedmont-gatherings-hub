
## Goal

Make the priced events workflow fully functional using **your existing Stripe account**. When someone registers for a paid event, they're sent to a Stripe-hosted checkout. On successful payment, their registration is confirmed and a confirmation email is sent. Free events are unchanged.

## What you'll do (one-time setup)

1. **Provide your Stripe secret key** (`sk_test_...` for testing, or `sk_live_...` for live). Get it from Stripe Dashboard → Developers → API keys. I'll request it via a secure secret prompt.
2. After I deploy the webhook endpoint, **add a webhook in your Stripe Dashboard** pointing at it (I'll give you the exact URL and the events to subscribe to). You'll then paste the **webhook signing secret** (`whsec_...`) back to me via another secure prompt.
3. Optional: enable **Stripe Tax** in your Stripe Dashboard if you want automatic tax calculation. The code will respect that setting.

## What I'll build

### 1. Registration flow changes (`src/pages/EventDetail.tsx`)
- **Free events:** unchanged.
- **Paid events:**
  - Reserve spots, insert the registration as `pending` with `hold_expires_at = now() + 15 minutes`.
  - Call a new edge function `create-event-checkout` that returns a Stripe Checkout URL.
  - Redirect the browser to that URL.
  - Don't send the confirmation email yet — that happens after payment confirms.
- On return to the page with `?status=success` or `?status=cancelled`, show an appropriate toast.

### 2. New edge function: `create-event-checkout`
- Input: `registrationId`.
- Loads the registration + event, validates it's still `pending` and within its hold window.
- Creates a Stripe Checkout Session via your Stripe account using inline `price_data`:
  - `unit_amount = event.price * 100`, `quantity = num_tickets`, currency USD.
  - Product name = `event.title`.
  - `automatic_tax: { enabled: true }` so it works with Stripe Tax if you turn it on (no-op if you don't).
  - 15-minute session expiration to match the hold.
  - Success URL: `/events/{eventId}?registration={id}&status=success`
  - Cancel URL: `/events/{eventId}?registration={id}&status=cancelled`
  - Metadata: `registration_id`, `event_id`.
- Saves the returned `session.id` on `registrations.stripe_session_id`.
- Returns the checkout URL.

### 3. New edge function: `stripe-webhook`
- Public endpoint (no JWT). Verifies the Stripe signature using your webhook signing secret.
- Handles:
  - `checkout.session.completed` → mark registration `payment_status = 'paid'`, `registration_status = 'confirmed'`, store `stripe_payment_intent_id`, clear `hold_expires_at`, then invoke `send-transactional-email` with the existing `registration-confirmation` template (same idempotency key pattern already in use).
  - `checkout.session.expired` and `checkout.session.async_payment_failed` → call `release_event_spots`, mark registration `cancelled`.
- Idempotent on Stripe event ID so duplicate webhook deliveries are safe.

### 4. Safety-net cron
- The `release_expired_holds()` SQL function already exists. Confirm the cron job that calls it every minute is scheduled; if not, schedule it. This guarantees abandoned checkouts free up seats even if the webhook is missed.

## Out of scope

- Free events flow.
- External-registration-URL events.
- Email infrastructure (already migrated).
- Refunds/cancellations UI (can add later).

## Technical details

**Schema:** No migrations needed. `stripe_session_id`, `stripe_payment_intent_id`, `hold_expires_at`, `payment_status`, `registration_status` already exist on `registrations`.

**Secrets to add via secure prompt:**
- `STRIPE_SECRET_KEY` (you provide)
- `STRIPE_WEBHOOK_SECRET` (you provide after the webhook URL exists)

**Webhook events to subscribe to in Stripe Dashboard:**
- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`

**Currency:** USD. Easy to make per-event later.

**Tax:** `automatic_tax.enabled = true` lets Stripe Tax do its thing if you've configured it in your Dashboard. If not configured, Stripe simply doesn't add tax — no error.

**Test mode flow:** Use `sk_test_...` keys + test card `4242 4242 4242 4242` (any future expiry, any CVC) to validate the entire flow before going live. When ready, swap to live keys via the secret update prompt.
