import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Globe, Mail } from "lucide-react";

interface Church {
  name: string;
  pastor: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
}

const churches: Church[] = [
  {
    name: "Antioch Christian Church",
    pastor: "Rev. Barry Hylton",
    address: "555 Spencer-Preston Road",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 957-2327",
  },
  {
    name: "Body of Christ Christian Church",
    pastor: "Rev. Dr. Michael Cotton",
    address: "425 Nathan Hunt Dr.",
    city: "High Point, NC 27260",
  },
  {
    name: "Charity Christian Church",
    pastor: "Minister Carl White (Interim)",
    address: "915 Morgan Street",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 632-0957",
  },
  {
    name: "Corinth Christian Church",
    pastor: "VACANT",
    address: "161 Reid Street, P.O. Box 1074",
    city: "Chatham, Virginia 24531",
    phone: "(434) 432-3645",
    // email: "cwhemming@comcast.net",
  },
  {
    name: "Fayette Street Christian Church",
    pastor: "Rev. Calvin D. Curry",
    address: "420 Fayette Street, PO Box 3107",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 632-5906",
  },
  {
    name: "First Christian Church - Concord",
    pastor: "Rev. Steven Mayhan",
    address: "158 Rone Avenue, P.O. Box 1125",
    city: "Concord, NC 28025",
    phone: "(704) 786-6815",
  },
  {
    name: "First Christian Church - Reidsville",
    pastor: "Dr. Jacqueline MeHenry",
    address: "206 Holderby Street, P.O. Box 1025",
    city: "Reidsville, NC 27320",
    phone: "(336) 349-3910",
    // email: "fcblessed1893@gmail.com",
    // website: "www.feccovenant.org",
  },
  {
    name: "First Christian Church - Stuart",
    pastor: "VACANT",
    address: "113 Forest Lane, P.O. Box 1289",
    city: "Stuart, Virginia 24171",
    // website: "disciples.org/congregation/listing/first-christian-church",
  },
  {
    name: "Fresh Harvest Christian Church",
    pastor: "Rev. Leroy Wimbush",
    address: "7379 Woolwine Highway, P.O. Box 21",
    city: "Woolwine, Virginia 24185",
    phone: "(276) 930-4511",
  },
  {
    name: "Iron Belt Christian Church",
    pastor: "Rev. Dr. Kathy Thomas-Grant Itotia",
    address: "336 Iron Belt Ln., P.O. Box 814",
    city: "Stuart, Virginia 24171",
    phone: "(276) 692-5350",
    // email: "PastorKJTG21@gmail.com",
  },
  {
    name: "Jerusalem Christian Church",
    pastor: "Rev. Robert Smith",
    address: "35 Meadow Garden Lane",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 638-6507",
    // email: "jechurch@centurylink.net",
    // website: "www.jerusalemdoc.org",
  },
  {
    name: "Little Bethlehem Christian Church",
    pastor: "Rev. DeJuan Harris",
    address: "110 Piney Fork Church Road, P.O. Box 236",
    city: "Eden, NC 27288",
    phone: "(336) 623-3905",
  },
  {
    name: "Little Salem Christian Church",
    pastor: "Rev. Ronald McRae & Rev. Dr. Linda McRae (Co-Pastor)",
    address: "P.O. Box 336",
    city: "Reidsville, NC 27320",
    phone: "(336) 342-0109",
  },
  {
    name: "Loudon Avenue Christian Church",
    pastor: "Rev. Bill Lee",
    address: "730 Loudon Avenue NW",
    city: "Roanoke, Virginia 24016",
    phone: "(540) 342-8852",
    // website: "www.lacc-dc.org",
  },
  {
    name: "Meadow Christian Church",
    pastor: "Rev. Kenneth Hooker",
    address: "1140 Meadowood Trail",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 957-1940",
    // website: "www.meadowchristianchurchdoc.org",
  },
  {
    name: "Middle Fork Christian Church",
    pastor: "Rev. Anderson Hicks, II",
    address: "2216 East First Street",
    city: "Winston-Salem, NC 27101",
    phone: "(336) 777-0418",
    // email: "middlefork@triad.rr.com",
  },
  {
    name: "Mount Olive East Christian Church",
    pastor: "Rev. Dr. Kenneth Davis",
    address: "3611 Spencer-Preston Road",
    city: "Martinsville, Virginia 24112",
    phone: "(276) 957-3546",
    // email: "moechurch@.comcast.net",
    // website: "www.kimbanet.com/~moe/",
  },
  {
    name: "Mount Pleasant Christian Church",
    pastor: "Rev. Ronald Glover",
    address: "1515 Britton Street",
    city: "Greensboro, NC 27406",
    phone: "(336) 275-7988",
    // email: "mpccd@triad.twebc.com",
    // website: "mtpleasantgreensboro.com",
  },
  {
    name: "Mount Zion Christian Church",
    pastor: "Rev. George Price, Sr.",
    address: "115 Scales Road",
    city: "Floyd, Virginia 24091",
    phone: "(540) 745-5032",
  },
  {
    name: "New Bethel Christian Church",
    pastor: "Rev. Mable Finney",
    address: "9 Brandermill Road",
    city: "Fieldale, Virginia 24089",
    phone: "(276) 673-6130",
    // email: "newbethelcc@yahoo.com",
  },
  {
    name: "Shaw Christian Church",
    pastor: "Rev. Merinda Easley",
    address: "The Boulevard, P.O. Box 68208",
    city: "Eden, NC 27288",
    phone: "(336) 635-2277",
  },
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
                  The Piedmont District Convention is home to diverse congregations united in faith and purpose. Find a
                  church home where you can grow spiritually and serve alongside fellow believers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {churches.map((church, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">{church.name}</CardTitle>
                      <p className="text-muted-foreground">
                        {church.pastor === "VACANT" ? "Pastor: Vacant" : `Pastor: ${church.pastor}`}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                          <span className="text-foreground">
                            {church.address}
                            <br />
                            {church.city}
                          </span>
                        </div>

                        {church.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                            <a
                              href={`tel:${church.phone}`}
                              className="text-foreground hover:text-accent transition-colors"
                            >
                              {church.phone}
                            </a>
                          </div>
                        )}

                        {church.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                            <a
                              href={`mailto:${church.email}`}
                              className="text-accent hover:text-accent/80 transition-colors break-all"
                            >
                              {church.email}
                            </a>
                          </div>
                        )}

                        {church.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-accent flex-shrink-0" />
                            <a
                              href={church.website.startsWith("http") ? church.website : `https://${church.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:text-accent/80 transition-colors break-all"
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
                <h2 className="text-2xl font-bold mb-4 text-primary">Interested in Joining Our District?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  If your church is interested in becoming part of the Piedmont District Convention, we'd love to
                  connect with you and explore partnership opportunities.
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
