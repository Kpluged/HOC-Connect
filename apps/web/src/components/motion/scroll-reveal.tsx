"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { opacity: 0, y: 28 },
        {
          duration: 0.7,
          ease: "power3.out",
          opacity: 1,
          scrollTrigger: { once: true, start: "top 88%", trigger: root.current },
          y: 0,
        },
      );
    }, root);

    return () => context.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
