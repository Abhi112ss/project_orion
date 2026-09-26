"use client";

import { useGsapContext } from "@/hooks/use-gsap-context";
import gsap from "gsap";
import { SectionHeading } from "@/components/section-heading";
import { BarChart3, Users2, ListChecks, FileBarChart } from "lucide-react";

const PANELS = [
  { icon: BarChart3, label: "Analytics", value: "Live" },
  { icon: Users2, label: "Applications", value: "2,847" },
  { icon: ListChecks, label: "Placement Pipeline", value: "6 Stages" },
  { icon: FileBarChart, label: "Reports", value: "Auto-generated" },
];

export function ProductShowcaseSection() {
  const scope = useGsapContext<HTMLDivElement>((root, reducedMotion) => {
    if (!root.current || reducedMotion) return;

    gsap.fromTo(
      "[data-showcase-panel]",
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      }
    );

    gsap.to("[data-showcase-frame]", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  });

  return (
    <section ref={scope} className="bg-[#030712] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Product"
          title="One Platform. Full Visibility."
          description="From application to offer, see every stage of the placement pipeline in real time."
        />

        <div
          data-showcase-frame
          className="mt-16 rounded-3xl border border-white/10 bg-[#111827] p-3 shadow-2xl shadow-black/40 sm:p-5"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-6 sm:p-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PANELS.map((panel) => (
                <div
                  key={panel.label}
                  data-showcase-panel
                  className="rounded-xl border border-white/10 bg-[#111827] p-5"
                >
                  <panel.icon className="size-5 text-[#00FF88]" strokeWidth={1.75} />
                  <p className="mt-4 text-xs uppercase tracking-wide text-[#9CA3AF]">
                    {panel.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#F9FAFB]">
                    {panel.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              data-showcase-panel
              className="mt-6 flex h-48 items-end gap-2 rounded-xl border border-white/10 bg-[#111827] p-6"
            >
              {[30, 55, 40, 70, 50, 85, 65, 90, 60, 75].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-t-sm bg-[#00FF88]/70"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}