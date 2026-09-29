/*src/components/reveal.tsx*/
"use client";

import { type ReactNode } from "react";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/use-gsap-context";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function Reveal({ children, className, delay = 0, y = 32 }: RevealProps) {
  const scope = useGsapContext<HTMLDivElement>((scopeRef, reducedMotion) => {
    if (!scopeRef.current) return;

    if (reducedMotion) {
      gsap.set(scopeRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      scopeRef.current,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: scopeRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );
  });

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}