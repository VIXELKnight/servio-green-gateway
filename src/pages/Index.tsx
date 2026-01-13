import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <Pricing />
        <Contact />
      </main>
      <Footer />
      <SupportWidget />
    </div>
  );
};

export default Index;
