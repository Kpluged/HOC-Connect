"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotion.matches) {
      return;
    }

    const lenis = new Lenis({
      anchors: true,
      autoRaf: true,
      smoothWheel: true,
    });

    return () => lenis.destroy();
  }, []);

  return children;
}
