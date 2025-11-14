import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Globe } from "lucide-react";

interface Church {
  name: string;
  pastor: string;
  location: string;
  phone: string;
  website?: string;
  description: string;
}

const churches: Church[] = [
  {
    name: "Grace Community Church",
    pastor: "Rev. Thomas Anderson",
    location: "123 Faith Avenue, Charlotte, NC",
    phone: "(704) 555-0123",
    website: "gracecommunity.org",
    description: "A vibrant congregation focused on worship, community service, and spiritual growth for all ages."
  },
  {
    name: "Hope Fellowship",
    pastor: "Pastor Jennifer Williams",
    location: "456 Hope Street, Greensboro, NC",
    phone: "(336) 555-0456",
    website: "hopefellowship.org",
    description: "Building a community of faith through authentic relationships and biblical teaching."
  },
  {
    name: "New Life Church",
    pastor: "Rev. Michael Brown",
    location: "789 Renewal Road, Raleigh, NC",
    phone: "(919) 555-0789",
    website: "newlifechurch.org",
    description: "Empowering believers to live transformed lives through the power of the Gospel."
  },
  {
    name: "Faith Baptist Church",
    pastor: "Dr. Patricia Davis",
    location: "321 Worship Way, Durham, NC",
    phone: "(919) 555-0321",
    description: "A traditional Baptist church with a heart for missions and community outreach."
  },
  {
    name: "Cornerstone Church",
    pastor: "Pastor Robert Martinez",
    location: "654 Foundation Drive, Winston-Salem, NC",
    phone: "(336) 555-0654",
    website: "cornerstonechurch.org",
    description: "Building lives on the solid foundation of Christ through worship and discipleship."
  },
  {
    name: "Victory Temple",
    pastor: "Bishop Angela Johnson",
    location: "987 Victory Lane, Fayetteville, NC",
    phone: "(910) 555-0987",
    website: "victorytemple.org",
    description: "A spirit-filled congregation celebrating God's goodness through praise and service."
  }
];

const Churches = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6 text-primary">Our Churches</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  The Piedmont District is home to diverse congregations united in faith and purpose. 
                  Find a church home where you can grow spiritually and serve alongside fellow believers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {churches.map((church, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-2xl text-primary">{church.name}</CardTitle>
                      <CardDescription className="text-base">
                        Led by {church.pastor}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {church.description}
                      </p>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{church.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-accent flex-shrink-0" />
                          <a 
                            href={`tel:${church.phone}`}
                            className="text-foreground hover:text-accent transition-colors"
                          >
                            {church.phone}
                          </a>
                        </div>
                        
                        {church.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-accent flex-shrink-0" />
                            <a 
                              href={`https://${church.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:text-accent/80 transition-colors"
                            >
                              {church.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-16 bg-muted/50 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-primary">
                  Interested in Joining Our District?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  If your church is interested in becoming part of the Piedmont District Convention, 
                  we'd love to connect with you and explore partnership opportunities.
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors font-medium"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Churches;
