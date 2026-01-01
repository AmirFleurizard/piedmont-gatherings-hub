import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import worshipImage from "@/assets/worship.jpg";
import { z } from "zod";

// Zod schema for registration validation
const registrationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z.string()
    .trim()
    .regex(/^[+\d\s()\-]*$/, "Invalid phone number format")
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  numTickets: z.number()
    .int("Number of tickets must be a whole number")
    .min(1, "At least 1 ticket is required")
    .max(10, "Maximum 10 tickets per registration"),
});

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    numTickets: 1,
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, churches(name)")
        .eq("id", eventId)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      // Validate form data with zod schema
      const validationResult = registrationSchema.safeParse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        numTickets: formData.numTickets,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0] || "Validation failed";
        throw new Error(firstError);
      }

      const validatedData = validationResult.data;

      // First reserve the spots
      const { data: reserved, error: reserveError } = await supabase.rpc(
        "reserve_event_spots",
        {
          _event_id: eventId!,
          _num_tickets: validatedData.numTickets,
        }
      );

      if (reserveError) throw reserveError;
      if (!reserved) {
        throw new Error("Not enough spots available");
      }

      // Create the registration with validated data
      const { data: registrationData, error: insertError } = await supabase
        .from("registrations")
        .insert({
          event_id: eventId!,
          attendee_name: validatedData.name,
          attendee_email: validatedData.email,
          attendee_phone: validatedData.phone || null,
          num_tickets: validatedData.numTickets,
          total_amount: event?.is_free ? 0 : (event?.price || 0) * validatedData.numTickets,
          payment_status: event?.is_free ? "free" : "pending",
          registration_status: event?.is_free ? "confirmed" : "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        // Release the spots if registration failed
        await supabase.rpc("release_event_spots", {
          _event_id: eventId!,
          _num_tickets: validatedData.numTickets,
        });
        throw insertError;
      }

      // Send confirmation email (don't fail registration if email fails)
      try {
        const totalPrice = event?.is_free ? 0 : (event?.price || 0) * validatedData.numTickets;
        const eventDate = format(new Date(event!.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a");
        
        const emailResponse = await supabase.functions.invoke("send-registration-confirmation", {
          body: {
            attendeeName: validatedData.name,
            attendeeEmail: validatedData.email,
            eventTitle: event!.title,
            eventDate: eventDate,
            eventLocation: event!.location,
            numTickets: validatedData.numTickets,
            totalPrice: totalPrice,
            registrationId: registrationData.id,
          },
        });

        if (emailResponse.error) {
          console.error("Failed to send confirmation email:", emailResponse.error);
        } else {
          // Update confirmation_sent flag
          await supabase
            .from("registrations")
            .update({ confirmation_sent: true })
            .eq("id", registrationData.id);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      return registrationData;
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: event?.is_free
          ? "You're all set! A confirmation email has been sent to your inbox."
          : "Your registration is pending. Payment processing will be available soon.",
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    await registerMutation.mutateAsync();
    setIsRegistering(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button onClick={() => navigate("/events")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const spotsAvailable = event.has_unlimited_capacity || event.spots_remaining > 0;
  const hasExternalRegistration = !!event.external_registration_url;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/events")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={event.image_url || worshipImage}
                  alt={event.title}
                  className="w-full h-auto"
                />
              </div>

              <h1 className="text-4xl font-bold text-primary mb-4">{event.title}</h1>

              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  {event.end_date && (
                    <> - {format(new Date(event.end_date), "MMMM d, yyyy 'at' h:mm a")}</>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {event.location}
                </span>
                {!event.has_unlimited_capacity && (
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {event.spots_remaining} of {event.capacity} spots remaining
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {event.is_free ? "Free" : `$${event.price}`}
                </span>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold text-primary mb-4">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description || "Join us for this upcoming event!"}
                </p>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Hosted by <strong className="text-foreground">{(event as any).churches?.name}</strong>
                </p>
              </div>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Register for this Event</CardTitle>
                  <CardDescription>
                    {event.has_unlimited_capacity
                      ? "Open registration"
                      : spotsAvailable
                      ? `${event.spots_remaining} spots remaining`
                      : "This event is fully booked"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasExternalRegistration ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Registration for this event is handled externally.
                      </p>
                      <Button
                        className="w-full"
                        size="lg"
                        asChild
                      >
                        <a 
                          href={event.external_registration_url!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Register Now
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ) : spotsAvailable ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>

                      {!event.has_unlimited_capacity && (
                        <div className="space-y-2">
                          <Label htmlFor="numTickets">Number of Tickets</Label>
                          <Input
                            id="numTickets"
                            type="number"
                            min={1}
                            max={Math.min(10, event.spots_remaining)}
                            value={formData.numTickets}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                numTickets: parseInt(e.target.value) || 1,
                              })
                            }
                            required
                          />
                        </div>
                      )}

                      {!event.is_free && (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Price per ticket:</span>
                            <span>${event.price}</span>
                          </div>
                          <div className="flex justify-between font-bold mt-2">
                            <span>Total:</span>
                            <span>
                              ${((event.price || 0) * formData.numTickets).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isRegistering}
                      >
                        {isRegistering && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {event.is_free ? "Register Now" : "Continue to Payment"}
                      </Button>

                      {!event.is_free && (
                        <p className="text-xs text-muted-foreground text-center">
                          Payment processing will be available soon.
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        This event is fully booked.
                      </p>
                      <Button variant="outline" onClick={() => navigate("/events")}>
                        Browse Other Events
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
