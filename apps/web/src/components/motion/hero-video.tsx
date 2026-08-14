"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

export function HeroVideo({
  className,
  poster,
  src,
}: {
  className?: string;
  poster?: string;
  src: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    function sync() {
      if (!video) return;
      if (media.matches) {
        video.pause();
      } else {
        video.muted = true;
        video.play().catch(() => {});
      }
    }

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={cn("h-full w-full object-cover", className)}
      loop
      muted
      playsInline
      poster={poster}
      preload="auto"
      ref={videoRef}
      src={src}
      tabIndex={-1}
    />
  );
}
