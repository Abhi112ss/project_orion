/*src/components/animated-counter.tsx*/
"use client";

import { useCounter } from "@/hooks/use-counter";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  suffix = "",
  duration = 2000,
}: AnimatedCounterProps) {
  const { value: current, ref } = useCounter({ end: value, duration });

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}