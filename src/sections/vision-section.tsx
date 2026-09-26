import { Reveal } from "@/components/reveal";

export function VisionSection() {
  return (
    <section className="bg-[#030712] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#00FF88]">
            Our Vision
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-balance text-3xl font-semibold leading-tight tracking-tight text-[#F9FAFB] sm:text-4xl md:text-5xl">
            We believe placement operations should be intelligent, not
            manual.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 text-balance text-lg text-[#9CA3AF]">
            ORION exists to transform how institutions run placements —
            replacing fragmented spreadsheets and manual coordination with a
            single, intelligent system that scales with every student,
            recruiter, and drive.
          </p>
        </Reveal>
      </div>
    </section>
  );
}