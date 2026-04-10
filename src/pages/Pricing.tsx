import { Navbar } from "@/components/landing/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Pricing = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-20">
      <PricingSection />
    </div>
    <Footer />
  </div>
);

export default Pricing;
