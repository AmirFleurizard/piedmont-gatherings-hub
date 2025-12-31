import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import communityImage from "@/assets/community.jpg";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-8 text-primary text-center">About Us</h1>

              <div className="mb-12">
                <img src={communityImage} alt="Our community" className="w-full rounded-lg shadow-xl mb-8" />
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold mb-6 text-primary">Who We Are</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Piedmont Connect is the digital hub of the Piedmont District Convention of the Church, serving as a
                  vital connection point for our diverse community of faith. We bring together churches, ministries, and
                  believers from across the district to foster unity, spiritual growth, and meaningful fellowship.
                </p>

                <h2 className="text-3xl font-bold mb-6 mt-12 text-primary">Our History</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  For over 50 years, the Piedmont District Convention has been a cornerstone of faith in our region.
                  What began as a small gathering of churches has grown into a vibrant network of congregations
                  committed to spreading the Gospel and serving our communities. Our conventions have become annual
                  traditions where thousands gather to worship, learn, and be inspired.
                </p>

                <h2 className="text-3xl font-bold mb-6 mt-12 text-primary">Our Mission</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Our mission, as the Piedmont District Convention, being empowered by the Holy Spirit, is to inform,
                  educate, equip, and thoroughly furnish each church to serve all communities. To live the good news,
                  preach the good news, and share the good news from our doorsteps to the uttermost parts of the world.
                </p>

                <div className="bg-muted/50 p-8 rounded-lg mt-12">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Our Core Values</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Faith:</strong> Grounded in biblical truth and centered on
                      Jesus Christ
                    </li>
                    <li>
                      <strong className="text-foreground">Unity:</strong> Bringing together diverse congregations in
                      purpose and fellowship
                    </li>
                    <li>
                      <strong className="text-foreground">Service:</strong> Committed to serving our communities with
                      love and compassion
                    </li>
                    <li>
                      <strong className="text-foreground">Growth:</strong> Fostering spiritual development and
                      leadership excellence
                    </li>
                  </ul>
                </div>

                <h2 className="text-3xl font-bold mb-6 mt-12 text-primary">Looking Forward</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  As we continue to grow and adapt to serve our community, we remain committed to our foundational
                  values while embracing new ways to connect and inspire. Whether you're a long-time member or new to
                  our community, we invite you to join us in this journey of faith and fellowship.
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

export default About;
