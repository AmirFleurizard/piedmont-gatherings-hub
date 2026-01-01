import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import worshipImage from "@/assets/worship.jpg";

const Events = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, churches(name)")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6 text-primary">Upcoming Events</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Join us for inspiring gatherings, meaningful worship, and opportunities to grow in faith together.
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : events?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No upcoming events at this time.</p>
                  <p className="text-muted-foreground">Check back soon for new events!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {events?.map((event) => (
                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 overflow-hidden">
                        <img
                          src={event.image_url || worshipImage}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="flex flex-col gap-1 mt-2">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.event_date), "MMMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-2">
                          {event.description || "Join us for this upcoming event!"}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-secondary font-medium">
                            {event.is_free ? "Free" : `$${event.price}`}
                          </span>
                          <span className="text-muted-foreground">{event.spots_remaining} spots left</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to={`/events/${event.id}`}>Register Now</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              <div className="bg-secondary/10 border-2 border-secondary p-8 rounded-lg">
                <h2 className="text-3xl font-bold mb-4 text-primary text-center">Registration Information</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-3xl mx-auto leading-relaxed">
                  Most events require advance registration to help us prepare adequate seating, materials, and
                  refreshments.
                </p>
                <div className="text-center">
                  <p className="text-foreground mb-4">Questions about registration? Contact our events team:</p>
                  <a
                    href="mailto:events@piedmontconnect.org"
                    className="text-accent hover:text-accent/80 transition-colors font-medium"
                  >
                    events@piedmontconnect.org
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
