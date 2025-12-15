import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 md:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 15, 2025</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website. They help the website remember your preferences and improve your browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Servio uses cookies for the following purposes:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and security.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings to enhance your experience.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website to improve our services.</li>
                <li><strong>Performance Cookies:</strong> Collect information about how you use our website to optimize performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Types of Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left text-foreground">Cookie Name</th>
                      <th className="border border-border p-3 text-left text-foreground">Purpose</th>
                      <th className="border border-border p-3 text-left text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 text-muted-foreground">session_id</td>
                      <td className="border border-border p-3 text-muted-foreground">Maintains user session</td>
                      <td className="border border-border p-3 text-muted-foreground">Session</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-muted-foreground">auth_token</td>
                      <td className="border border-border p-3 text-muted-foreground">Authentication</td>
                      <td className="border border-border p-3 text-muted-foreground">7 days</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-muted-foreground">preferences</td>
                      <td className="border border-border p-3 text-muted-foreground">User preferences</td>
                      <td className="border border-border p-3 text-muted-foreground">1 year</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-muted-foreground">analytics_id</td>
                      <td className="border border-border p-3 text-muted-foreground">Usage analytics</td>
                      <td className="border border-border p-3 text-muted-foreground">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services that set their own cookies, including payment processors (Stripe) and analytics providers. These cookies are governed by the respective third party's privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Browser settings: Most browsers allow you to block or delete cookies</li>
                <li>Opt-out tools: Many analytics providers offer opt-out mechanisms</li>
                <li>Our cookie settings: Use our cookie preferences center when available</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Note: Disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at privacy@servio.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
