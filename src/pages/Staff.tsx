import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffMember {
  name: string;
  role: string;
}

interface Ministry {
  name: string;
  leader: string;
}

const officers: StaffMember[] = [
  { name: "Rev. Kara Fleurizard", role: "Moderator" },
  { name: "Rev. Kenneth Hooker", role: "Moderator Elect" },
  { name: "VACANT", role: "Vice Moderator" },
  { name: "Sister Melodie Ferguson", role: "Secretary" },
  { name: "Jennifer Wimbush", role: "Assistant Secretary" },
  { name: "Deacon Mildred Preston", role: "Treasurer" },
  { name: "Sister Agnes Zigler", role: "Financial Secretary" },
];

const trustees: StaffMember[] = [
  { name: "Elder Louis Preston", role: "Trustee" },
  { name: "Mauri Wimbush", role: "Trustee" },
  { name: "Merinda Easley", role: "Trustee" },
];

const membersAtLarge: StaffMember[] = [
  { name: "Deacon Doris Davis", role: "Member at Large" },
  { name: "Rev. Kathy Thomas", role: "Member at Large" },
  { name: "Sister Vanessa Milner", role: "Member at Large" },
];

const ministries: Ministry[] = [
  { name: "Disciples Women Ministries", leader: "Rev. Deborah Clark" },
  { name: "Christian Men Fellowship", leader: "Deacon Nathan Robinson" },
  { name: "Christian Youth Fellowship (VA)", leader: "Sister Wendy Kellam" },
  { name: "Christian Youth Fellowship (NC)", leader: "Sister Myra Stafford" },
  { name: "Usher's Fellowship", leader: "Sister Tawiana Callaway-Burns" },
  { name: "Minister's Fellowship", leader: "Rev. Dr. Jackie McHenry" },
  { name: "Long Range Planning", leader: "Rev. Kenny Hooker" },
  { name: "Goode-Finney", leader: "Rev. Leory Wimbush" },
  { name: "Hubbard Walker", leader: "Sister Joann Washington" },
  { name: "Spencer-Thomas", leader: "Elder Allen Watkins" },
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
                  Meet the dedicated leaders serving the Piedmont District Convention with passion, wisdom, and
                  commitment to advancing God's kingdom.
                </p>
              </div>

              {/* Officers */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8 text-primary text-center">District Officers</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {officers.map((member, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {member.name === "VACANT"
                            ? "?"
                            : member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                        </div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <p className="text-secondary font-semibold">{member.role}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Trustees */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8 text-primary text-center">Trustees</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {trustees.map((member, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <p className="text-secondary font-semibold">{member.role}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Members at Large */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8 text-primary text-center">Members at Large</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {membersAtLarge.map((member, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <p className="text-secondary font-semibold">{member.role}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Ministries */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-primary text-center">Ministry Leaders</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {ministries.map((ministry, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <h3 className="font-bold text-lg text-foreground mb-2">{ministry.name}</h3>
                        <p className="text-muted-foreground">{ministry.leader}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* District Office */}
              <div className="mt-12 bg-muted/50 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-primary">District Office</h2>
                <p className="text-muted-foreground">
                  3300 Wentworth St.
                  <br />
                  Reidsville, NC
                </p>
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
