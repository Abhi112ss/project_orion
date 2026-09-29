/*src/sections/features-section.tsx*/
import {
  CalendarClock,
  Users,
  UserCheck,
  BarChart3,
  Workflow,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: CalendarClock,
    title: "Placement Drive Management",
    description:
      "Plan, schedule, and manage end-to-end placement drives with zero manual overhead.",
  },
  {
    icon: Users,
    title: "Recruiter Management",
    description:
      "Centralize recruiter communication, requirements, and hiring pipelines in one place.",
  },
  {
    icon: UserCheck,
    title: "Student Tracking",
    description:
      "Track every student's eligibility, applications, and placement status in real time.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Turn placement data into actionable insight with live, institution-wide analytics.",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    description:
      "Eliminate repetitive coordination work with rule-based automation across departments.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description:
      "Let AI surface eligible candidates, resume signals, and placement trends automatically.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#030712] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Platform"
          title="Everything Placement Teams Need"
          description="A complete toolkit that replaces spreadsheets, emails, and manual coordination."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-white/10 bg-[#111827] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF88]/30 hover:bg-[#131c2c]">
                <div className="mb-5 flex size-11 items-center justify-center rounded-lg bg-[#00FF88]/10 text-[#00FF88] transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-[#F9FAFB]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}