import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import communityImage from "@/assets/congregation-worship.jpg";
import worshipImage from "@/assets/choir-singing.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Index = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
            <div className="absolute inset-0 bg-primary/70"></div>
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Welcome to Piedmont Connect</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Uniting our faith community through worship, fellowship, and service
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <a href="/events">
                  View Events <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <a href="/about">Learn More</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-primary">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Piedmont Connect serves as the heart of the{" "}
                <b>Piedmont District Convention, Christian Church (Disciples of Christ)</b>, bringing together churches
                and believers to strengthen our faith, build lasting relationships, and serve our communities with love
                and purpose. We are committed to creating meaningful experiences that inspire spiritual growth and unity
                across generations.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src={communityImage}
                  alt="Congregation in worship"
                  className="rounded-lg shadow-xl aspect-video object-cover w-full"
                />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-6 text-primary">Building Community</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  We believe in the power of community and fellowship. Through our conventions and events, we create
                  spaces where adults of all ages can connect, share their faith journey, and support one another in
                  meaningful ways.
                </p>
                <Button variant="secondary" asChild>
                  <a href="/churches">Explore Our Churches</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Worship Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-4xl font-bold mb-6 text-primary">Worship Together</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Experience transformative worship services that blend traditional values with contemporary expression.
                  Our conventions feature inspiring messages, uplifting music, and opportunities for spiritual renewal
                  and growth.
                </p>
                <Button variant="secondary" asChild>
                  <a href="/about">About Our Convention</a>
                </Button>
              </div>
              <div className="order-1 md:order-2">
                <img
                  src={worshipImage}
                  alt="Choir singing during service"
                  className="rounded-lg shadow-xl aspect-video object-cover w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-primary">Upcoming Events</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join us for inspiring gatherings and meaningful experiences
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {isLoading ? (
                <p className="col-span-3 text-center text-muted-foreground">Loading events...</p>
              ) : events && events.length > 0 ? (
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    date={format(new Date(event.event_date), "MMMM d, yyyy")}
                    location={event.location}
                    description={event.description || ""}
                    imageUrl={event.image_url || worshipImage}
                  />
                ))
              ) : (
                <p className="col-span-3 text-center text-muted-foreground">No upcoming events at this time.</p>
              )}
            </div>

            <div className="text-center mt-12">
              <Button variant="secondary" size="lg" asChild>
                <a href="/events">
                  View All Events <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
