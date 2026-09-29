/*src/sections/trust-section.tsx*/
import { Reveal } from "@/components/reveal";

const ROLES = ["Students", "Recruiters", "Placement Officers", "Coordinators"];

export function TrustSection() {
  return (
    <section className="border-y border-white/5 bg-[#030712] py-14">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-sm text-[#9CA3AF]">
            Built for modern institutions and placement teams.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {ROLES.map((role) => (
              <span
                key={role}
                className="text-sm font-medium uppercase tracking-wider text-[#9CA3AF]/70"
              >
                {role}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}