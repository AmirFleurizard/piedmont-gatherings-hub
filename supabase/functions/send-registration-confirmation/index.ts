import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationConfirmationRequest {
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  numTickets: number;
  totalPrice?: number;
  registrationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      attendeeName,
      attendeeEmail,
      eventTitle,
      eventDate,
      eventLocation,
      numTickets,
      totalPrice,
      registrationId,
    }: RegistrationConfirmationRequest = await req.json();

    console.log("Sending confirmation email to:", attendeeEmail);
    console.log("Event:", eventTitle);
    console.log("Registration ID:", registrationId);

    const priceSection = totalPrice && totalPrice > 0
      ? `<p style="margin: 8px 0;"><strong>Total Paid:</strong> $${totalPrice.toFixed(2)}</p>`
      : `<p style="margin: 8px 0;"><strong>Price:</strong> Free</p>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Event Registration <onboarding@resend.dev>",
        to: [attendeeEmail],
        subject: `Registration Confirmed: ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Registration Confirmed! 🎉</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${attendeeName}</strong>,</p>
                
                <p style="margin-bottom: 20px;">Thank you for registering! Your spot has been confirmed for the following event:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 20px;">${eventTitle}</h2>
                  <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
                  <p style="margin: 8px 0;"><strong>📍 Location:</strong> ${eventLocation}</p>
                  <p style="margin: 8px 0;"><strong>🎟️ Tickets:</strong> ${numTickets}</p>
                  ${priceSection}
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 14px;"><strong>Confirmation ID:</strong> ${registrationId.slice(0, 8).toUpperCase()}</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Please save this for your records.</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">If you have any questions, please don't hesitate to reach out.</p>
                
                <p style="margin-top: 30px; color: #666;">See you there!</p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-confirmation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
