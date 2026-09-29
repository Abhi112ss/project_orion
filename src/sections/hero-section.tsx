/*src/sections/hero-section.tsx*/
"use client";

import { Button } from "@/components/ui/button";
import { useGsapContext } from "@/hooks/use-gsap-context";
import gsap from "gsap";
import { Play, ArrowRight } from "lucide-react";


export function HeroSection() {
  const scope = useGsapContext<HTMLDivElement>((_scope, reducedMotion) => {
    if (!scope.current) return;

    if (reducedMotion) {
      gsap.set("[data-hero-reveal], [data-hero-visual], [data-hero-bar]", {
        opacity: 1,
        y: 0,
        scale: 1,
        scaleY: 1,
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      "[data-hero-reveal]",
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }
    )
      .fromTo(
        "[data-hero-visual]",
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1 },
        "-=0.6"
      )
      .fromTo(
        "[data-hero-bar]",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.8, stagger: 0.08, transformOrigin: "bottom" },
        "-=0.5"
      );
  });

  return (
    <section
      ref={scope}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-6 pb-20 pt-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.08),transparent_60%)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span
          data-hero-reveal
          className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[#9CA3AF]"
        >
          AI-Powered Placement Intelligence
        </span>

        <h1
          data-hero-reveal
          className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-[#F9FAFB] sm:text-6xl md:text-7xl"
        >
          The Operating System for
          <span className="block text-[#00FF88]">Campus Placements</span>
        </h1>

        <p
          data-hero-reveal
          className="mt-6 max-w-2xl text-balance text-lg text-[#9CA3AF] sm:text-xl"
        >
          ORION unifies placement drives, recruiter management, student
          tracking, and analytics into one AI-powered platform built for
          modern institutions.
        </p>

        <div data-hero-reveal className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">
            <Play className="size-4" />
            Watch Demo
          </Button>
        </div>
      </div>

      <div
        data-hero-visual
        className="relative mt-20 w-full max-w-5xl rounded-2xl border border-white/10 bg-[#111827]/60 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6"
      >
        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  const bars: number[] = [40, 65, 50, 80, 60, 95, 70];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-[#0B1220] p-5 md:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[#F9FAFB]">Placement Pipeline</p>
          <span className="text-xs text-[#9CA3AF]">This Semester</span>
        </div>
        <div className="flex h-40 items-end gap-3">
          {bars.map((h, i) => (
            <div
              key={i}
              data-hero-bar
              style={{ height: `${h}%` }}
              className="flex-1 rounded-t-md bg-linear-to-t from-[#00FF88]/20 to-[#00FF88]"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/10 bg-[#0B1220] p-5">
          <p className="text-xs text-[#9CA3AF]">Students Placed</p>
          <p className="mt-2 text-2xl font-semibold text-[#F9FAFB]">3,214</p>
          <p className="mt-1 text-xs text-[#00FF88]">+12.4% this month</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0B1220] p-5">
          <p className="text-xs text-[#9CA3AF]">Active Recruiters</p>
          <p className="mt-2 text-2xl font-semibold text-[#F9FAFB]">148</p>
          <p className="mt-1 text-xs text-[#00FF88]">+8 new this week</p>
        </div>
      </div>
    </div>
  );
}