/*src/sections/why-orion-section.tsx*/
import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { WHY_ORION } from "@/lib/constants";

export function WhyOrionSection() {
  return (
    <section id="why-orion" className="bg-[#0A0F1A] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why Orion"
          title="Built for Everyone in the Placement Cycle"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {WHY_ORION.map((col, i) => (
            <Reveal key={col.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-white/10 bg-[#111827] p-8">
                <h3 className="text-xl font-semibold text-[#F9FAFB]">
                  {col.title}
                </h3>
                <ul className="mt-6 flex flex-col gap-4">
                  {col.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#00FF88]" />
                      <span className="text-sm text-[#9CA3AF]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}