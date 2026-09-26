import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/sections/hero-section";
import { TrustSection } from "@/sections/trust-section";
import { MadeForSection } from "@/sections/made-for-section";
import { FeaturesSection } from "@/sections/features-section";
import { WhyOrionSection } from "@/sections/why-orion-section";
import { ProductShowcaseSection } from "@/sections/product-showcase-section";
import { StatisticsSection } from "@/sections/statistics-section";
import { VisionSection } from "@/sections/vision-section";
import { CtaSection } from "@/sections/cta-section";
import { Footer } from "@/sections/footer";

export const metadata: Metadata = {
  title: "ORION — AI-Powered Placement & Recruitment Management",
  description:
    "ORION unifies placement drives, recruiter management, student tracking, and analytics into one AI-powered platform built for modern institutions.",
  openGraph: {
    title: "ORION — AI-Powered Placement & Recruitment Management",
    description:
      "The AI-powered operating system for campus placements and recruitment.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="relative bg-[#030712] text-[#F9FAFB]">
        <HeroSection />
        <TrustSection />
        <MadeForSection />
        <FeaturesSection />
        <WhyOrionSection />
        <ProductShowcaseSection />
        <StatisticsSection />
        <VisionSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}