import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { AnimatedCounter } from "@/components/animated-counter";
import { STATS } from "@/lib/constants";

export function StatisticsSection() {
  return (
    <section className="bg-[#0A0F1A] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Scale" title="Trusted at Institutional Scale" />

        <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="text-4xl font-semibold tracking-tight text-[#00FF88] sm:text-5xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-[#9CA3AF]">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}