"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

/**
 * Not a verified Porsche pattern - live inspection of porsche.com found no
 * continuous scroll-linked background crossfade on the pages checked. HOC's
 * own homepage already alternates light/dark "rooms" via [data-room] in
 * packages/design-tokens/src/tokens.css as a hard cut at the section
 * boundary; this turns one boundary into a scroll-driven crossfade instead.
 * Keep these literal values in sync with that file's
 * [data-room="light"|"dark"] --canvas values.
 */
const ROOM_CANVAS = {
  dark: "hsl(225 66.7% 1.2%)",
  light: "#ffffff",
} as const;

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * `before`/`after` render with no background of their own (the caller
 * strips it) - a static 50/50 two-tone gradient is the zero-JS/
 * reduced-motion base layer (correct, if only approximately seam-aligned,
 * with no JS at all), and a scroll-linked flat colour layers on top,
 * replacing it with a precise crossfade once framer-motion is running.
 */
export function RoomTransition({
  after,
  before,
  from,
  to,
}: {
  after: ReactNode;
  before: ReactNode;
  from: keyof typeof ROOM_CANVAS;
  to: keyof typeof ROOM_CANVAS;
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const seamRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    offset: ["start 0.85", "start 0.2"],
    target: seamRef,
  });
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 1],
    [ROOM_CANVAS[from], ROOM_CANVAS[to]],
  );

  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to bottom, ${ROOM_CANVAS[from]} 0 50%, ${ROOM_CANVAS[to]} 50% 100%)`,
        }}
      />
      {prefersReducedMotion ? null : (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundColor }}
        />
      )}
      {before}
      <div aria-hidden="true" className="pointer-events-none h-px" ref={seamRef} />
      {after}
    </div>
  );
}
