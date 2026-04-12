

## Problem
Resend free tier restricts email delivery to only the account owner's email. The edge function logs confirm 403 errors for any other recipient.

## Recommended Solution: Switch to Lovable's built-in email system

This removes the Resend dependency entirely and lets confirmation emails reach any address.

### Steps

1. **Set up email domain** — Configure a sender domain via the email setup dialog (requires DNS records at the user's domain provider).

2. **Set up email infrastructure** — Create the database tables, queues, and cron job for reliable email delivery with retries.

3. **Scaffold transactional email system** — Creates the `send-transactional-email` Edge Function and template structure.

4. **Create a registration confirmation template** — Build a React Email component in `_shared/transactional-email-templates/` matching the current email design (event title, date, location, tickets, confirmation ID).

5. **Update EventDetail.tsx** — Replace the `supabase.functions.invoke("send-registration-confirmation", ...)` call with a call to `send-transactional-email` using the new template name and passing the same data via `templateData`.

6. **Create unsubscribe page** — Required by the transactional email system for compliance.

7. **Deploy edge functions** — Deploy `send-transactional-email` and related functions.

8. **Clean up old Resend function** — Optionally remove the `send-registration-confirmation` edge function since it will no longer be used.

### Technical Details
- The current `send-registration-confirmation` edge function calls the Resend API directly
- The new system uses Lovable's email queue with automatic retries, suppression handling, and unsubscribe support
- The `RESEND_API_KEY` secret can be removed after migration if no other functions use Resend (need to check `send-contact-email` and `send-user-invite`)

