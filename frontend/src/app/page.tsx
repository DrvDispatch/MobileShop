import { Navbar, Hero, Footer, PromotionalBanner } from "@/components/landing";
import { FeaturedProducts } from "@/components/storefront";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <PromotionalBanner />
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <Footer />
    </main>
  );
}
