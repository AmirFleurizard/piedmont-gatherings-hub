import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import worshipImage from "@/assets/worship.jpg";
import communityImage from "@/assets/community.jpg";

const Events = () => {
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
                  Join us for inspiring gatherings, meaningful worship, and opportunities to grow 
                  in faith together. All events are open to adults ages 18 and up.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                <EventCard
                  title="Spring Faith Convention"
                  date="March 15-17, 2025"
                  location="Grace Community Center"
                  description="Join us for three days of worship, fellowship, and spiritual renewal as we gather together in faith and celebration."
                  imageUrl={worshipImage}
                />
                <EventCard
                  title="Youth Leadership Summit"
                  date="April 22, 2025"
                  location="Hope Church"
                  description="Empowering young adults to lead with faith and purpose in their communities and churches through workshops and mentorship."
                  imageUrl={communityImage}
                />
                <EventCard
                  title="Community Outreach Day"
                  date="May 10, 2025"
                  location="Various Locations"
                  description="Serving our community together through acts of kindness, compassion, and Christian love. Multiple service projects available."
                  imageUrl={communityImage}
                />
                <EventCard
                  title="Summer Bible Conference"
                  date="June 20-23, 2025"
                  location="Cornerstone Church"
                  description="Deep dive into scripture with renowned Bible teachers and engaging workshops for spiritual growth and understanding."
                  imageUrl={worshipImage}
                />
                <EventCard
                  title="Women's Empowerment Retreat"
                  date="July 14-16, 2025"
                  location="Mountain View Retreat Center"
                  description="A weekend dedicated to spiritual renewal, encouragement, and building meaningful connections among women of faith."
                  imageUrl={communityImage}
                />
                <EventCard
                  title="Men's Leadership Conference"
                  date="August 5-6, 2025"
                  location="Victory Temple"
                  description="Equipping men to lead with integrity, purpose, and faith in their families, churches, and communities."
                  imageUrl={worshipImage}
                />
                <EventCard
                  title="Fall Revival Services"
                  date="September 15-17, 2025"
                  location="New Life Church"
                  description="Three nights of powerful worship and inspiring preaching to renew your spirit and strengthen your faith."
                  imageUrl={worshipImage}
                />
                <EventCard
                  title="Ministry Training Workshop"
                  date="October 12, 2025"
                  location="Faith Baptist Church"
                  description="Practical training for ministry leaders covering outreach strategies, discipleship, and effective church leadership."
                  imageUrl={communityImage}
                />
                <EventCard
                  title="Annual Thanksgiving Service"
                  date="November 24, 2025"
                  location="Hope Fellowship"
                  description="Join our district-wide celebration of gratitude with special music, testimonies, and a powerful message of thanksgiving."
                  imageUrl={worshipImage}
                />
              </div>

              <div className="bg-secondary/10 border-2 border-secondary p-8 rounded-lg">
                <h2 className="text-3xl font-bold mb-4 text-primary text-center">
                  Registration Information
                </h2>
                <p className="text-muted-foreground mb-6 text-center max-w-3xl mx-auto leading-relaxed">
                  Most events require advance registration to help us prepare adequate seating, materials, 
                  and refreshments. Registration typically opens 6-8 weeks before each event. Some events 
                  may have limited capacity and will be filled on a first-come, first-served basis.
                </p>
                <div className="bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-primary">Registration Requirements</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• All participants must be 18 years of age or older</li>
                    <li>• Online registration closes 48 hours before event start</li>
                    <li>• Confirmation email will be sent within 24 hours of registration</li>
                    <li>• Some events may require a registration fee to cover materials and meals</li>
                    <li>• Cancellation policy varies by event - check individual event details</li>
                  </ul>
                </div>
                <div className="text-center mt-8">
                  <p className="text-foreground mb-4">
                    Questions about registration? Contact our events team:
                  </p>
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
