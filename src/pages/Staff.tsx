import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface StaffMember {
  name: string;
  role: string;
  bio: string;
  email: string;
}

const staffMembers: StaffMember[] = [
  {
    name: "Rev. Dr. James Mitchell",
    role: "District Superintendent",
    bio: "Rev. Dr. Mitchell brings over 30 years of ministry experience to the Piedmont District. His passion for unity and spiritual growth has strengthened our community of churches and inspired countless believers.",
    email: "jmitchell@piedmontconnect.org"
  },
  {
    name: "Pastor Sarah Johnson",
    role: "Convention Coordinator",
    bio: "Pastor Johnson oversees all convention planning and event coordination. Her attention to detail and heart for hospitality ensure that every gathering is meaningful and welcoming.",
    email: "sjohnson@piedmontconnect.org"
  },
  {
    name: "Minister David Chen",
    role: "Youth & Young Adult Director",
    bio: "Minister Chen leads our initiatives to engage and empower young adults in their faith journey. His innovative approach connects traditional faith with contemporary culture.",
    email: "dchen@piedmontconnect.org"
  },
  {
    name: "Rev. Maria Rodriguez",
    role: "Community Outreach Director",
    bio: "Rev. Rodriguez coordinates our district-wide community service initiatives. Her dedication to servant leadership has made a lasting impact on our local communities.",
    email: "mrodriguez@piedmontconnect.org"
  },
  {
    name: "Deacon Robert Washington",
    role: "Worship Arts Director",
    bio: "Deacon Washington leads worship coordination for our conventions and special events. His musical gifts and spiritual sensitivity create powerful worship experiences.",
    email: "rwashington@piedmontconnect.org"
  },
  {
    name: "Dr. Emily Anderson",
    role: "Education & Training Director",
    bio: "Dr. Anderson develops and oversees leadership training programs and educational workshops for church leaders across the district.",
    email: "eanderson@piedmontconnect.org"
  }
];

const Staff = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6 text-primary">Our Leadership Team</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Meet the dedicated leaders serving our district with passion, wisdom, and commitment 
                  to advancing God's kingdom.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {staffMembers.map((member, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-3xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <CardTitle className="text-center text-xl">{member.name}</CardTitle>
                      <CardDescription className="text-center text-secondary font-semibold">
                        {member.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                        {member.bio}
                      </p>
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Staff;
