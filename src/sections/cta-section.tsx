import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section id="cta" className="bg-[#030712] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827] px-8 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.12),transparent_60%)]"
            />
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#F9FAFB] sm:text-4xl">
              Ready to modernize your placement operations?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-[#9CA3AF]">
              Join institutions using ORION to run faster, smarter, and more
              transparent placement drives.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button variant="outline" size="lg">
                Request Demo
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}