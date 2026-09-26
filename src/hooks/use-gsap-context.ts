"use client";

import { useEffect, useRef, type RefObject, type DependencyList } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ContextCallback<T extends HTMLElement = HTMLElement> = (
  scope: RefObject<T | null>,
  reducedMotion: boolean
) => void | (() => void);

export function useGsapContext<T extends HTMLElement>(
  callback: ContextCallback<T>,
  deps: DependencyList = []
): RefObject<T | null> {
  const scope = useRef<T>(null);

  useEffect(() => {
    if (!scope.current) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cleanup: void | (() => void);

    const ctx = gsap.context(() => {
      cleanup = callback(scope, reducedMotion);
    }, scope);

    return () => {
      cleanup?.();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}