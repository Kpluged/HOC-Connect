"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { CloseIcon, FleetIcon, MenuIcon, PersonIcon } from "@/components/ui/icons";
import { vehicles } from "@/features/catalogue/data";

const navigation = [
  { key: "vehicles", label: "Vehicles" },
  { key: "configure", label: "Configure a fleet" },
  { key: "process", label: "How it works" },
] as const;

type NavigationKey = (typeof navigation)[number]["key"];

const configurationSteps = ["City", "Fleet size", "Vehicle mix", "Livery", "Package", "Review"];
const operatingStages = ["Discover", "Configure & apply", "Approve & provision", "Operate & earn"];
const ease = [0.16, 1, 0.3, 1] as const;

function SecondaryPanel({ active, close }: { active: NavigationKey; close: () => void }) {
  if (active === "vehicles") {
    return (
      <div className="p-6 sm:p-8 lg:px-10 lg:pb-10 lg:pt-20">
        <p className="mb-7 text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">Models</p>
        <div className="grid gap-4">
          {vehicles.map((vehicle, index) => (
            <Link
              className={`group block rounded-card p-5 transition-colors ${index === 0 ? "bg-canvas" : "hover:bg-canvas"}`}
              href={`/vehicles/${vehicle.slug}`}
              key={vehicle.slug}
              onClick={close}
            >
              <p className="text-xl font-semibold">{vehicle.name}</p>
              <div className="relative mt-2 aspect-[2/1]">
                <Image
                  alt={`${vehicle.name} electric vehicle`}
                  className="object-contain transition-transform duration-500 ease-[var(--ease-engineered)] group-hover:translate-x-1"
                  fill
                  quality={90}
                  sizes="(min-width: 1024px) 28vw, 80vw"
                  src={vehicle.image}
                />
              </div>
              <span className="inline-flex rounded-control bg-surface px-3 py-1 text-xs">Electric</span>
            </Link>
          ))}
        </div>
        <Link className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline" href="/vehicles" onClick={close}>
          View the complete catalogue
        </Link>
      </div>
    );
  }

  if (active === "configure") {
    return (
      <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">Fleet configurator</p>
        <h2 className="mt-5 max-w-[11ch] text-4xl font-semibold leading-[0.95] tracking-[-0.045em]">Six decisions. One reviewable path.</h2>
        <ol className="mt-12 divide-y divide-contrast-low border-y border-contrast-low">
          {configurationSteps.map((step, index) => (
            <li className="flex min-h-14 items-center gap-5 text-sm" key={step}>
              <span className="tabular-nums text-xs text-contrast-medium">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-semibold">{step}</span>
            </li>
          ))}
        </ol>
        <Link className="mt-8 inline-flex min-h-13 items-center justify-center rounded-control bg-signal px-6 text-sm font-semibold text-on-signal" href="/configure/city" onClick={close}>
          Begin configuration
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">The operating loop</p>
      <ol className="mt-8 grid gap-3">
        {operatingStages.map((stage, index) => (
          <li className="rounded-card bg-canvas p-5" key={stage}>
            <span className="tabular-nums text-xs text-contrast-medium">0{index + 1}</span>
            <p className="mt-8 text-lg font-semibold">{stage}</p>
          </li>
        ))}
      </ol>
      <Link className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline" href="/how-it-works" onClick={close}>
        See the complete journey
      </Link>
    </div>
  );
}

export function OverlayNav({
  isSignedIn = false,
  managesOrg = false,
  tone = "default",
}: {
  isSignedIn?: boolean;
  managesOrg?: boolean;
  tone?: "default" | "inverse";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<NavigationKey>("vehicles");
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        variant={tone === "inverse" ? "glass" : "outline"}
      >
        <MenuIcon />
        Menu
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-[#07090c] text-primary lg:overflow-hidden"
            data-room="light"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 hidden overflow-hidden lg:block"
              initial={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.7, ease }}
            >
              <Image alt="Electric fleet atmosphere" className="scale-110 object-cover blur-xl saturate-50" fill loading="eager" quality={90} sizes="40vw" src="/vehicles/lineup-02.jpg" />
              <div className="absolute inset-0 bg-[#07090c]/70" />
            </motion.div>

            <div aria-label="Main navigation" aria-modal="true" className="relative min-h-dvh lg:h-full lg:min-h-0" ref={panelRef} role="dialog">
              <button
                aria-label="Close menu"
                className="menu-control fixed right-5 top-5 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-canvas transition-transform hover:scale-105 lg:left-[calc(65vw+1.5rem)] lg:right-auto lg:bg-white/16 lg:text-white lg:backdrop-blur-md"
                onClick={close}
                ref={closeRef}
                type="button"
              >
                <CloseIcon />
              </button>

              <div className="grid min-h-dvh lg:h-full lg:min-h-0 lg:grid-cols-[34vw_31vw_1fr]">
                <motion.section
                  animate={{ x: 0 }}
                  className="flex min-h-[48dvh] flex-col bg-canvas px-6 pb-8 pt-24 sm:px-10 lg:h-full lg:min-h-0 lg:px-[clamp(2.5rem,5vw,5rem)] lg:py-[clamp(4rem,10vh,7rem)]"
                  exit={{ x: "-100%" }}
                  initial={{ x: "-100%" }}
                  transition={{ duration: 0.38, ease }}
                >
                  <nav aria-label="Primary">
                    <ul className="grid gap-2">
                      {navigation.map((item) => (
                        <li key={item.key}>
                          <button
                            aria-pressed={active === item.key}
                            className={`menu-control flex min-h-16 w-full items-center justify-between rounded-card px-5 text-left text-lg transition-colors ${active === item.key ? "bg-surface font-semibold" : "hover:bg-surface"}`}
                            onClick={() => setActive(item.key)}
                            type="button"
                          >
                            {item.label}
                            <span aria-hidden="true">›</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="mt-auto grid gap-2">
                    <Link
                      className="menu-control flex min-h-14 items-center justify-between rounded-card bg-surface px-5 text-left text-base font-semibold"
                      href={isSignedIn ? "/account" : "/auth/sign-in"}
                      onClick={close}
                    >
                      <span className="inline-flex items-center gap-3">
                        <PersonIcon className="size-5" />
                        {isSignedIn ? "Your account" : "Sign in"}
                      </span>
                      <span aria-hidden="true">›</span>
                    </Link>
                    {managesOrg ? (
                      <Link
                        className="menu-control flex min-h-14 items-center justify-between rounded-card bg-surface px-5 text-left text-base font-semibold"
                        href="/space"
                        onClick={close}
                      >
                        <span className="inline-flex items-center gap-3">
                          <FleetIcon className="size-5" />
                          Owner Space
                        </span>
                        <span aria-hidden="true">›</span>
                      </Link>
                    ) : null}
                    {isSignedIn ? (
                      <form action="/auth/sign-out" method="post">
                        <button
                          className="menu-control flex min-h-11 w-full items-center px-5 text-left text-sm text-contrast-medium hover:text-primary"
                          onClick={close}
                          type="submit"
                        >
                          Sign out
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <Link aria-label="HOC Elite Wheels home" className="inline-flex min-h-12 items-center justify-between rounded-card px-5 hover:bg-surface" href="/" onClick={close}>
                    <span className="inline-flex items-baseline gap-2">
                      <BrandWordmark className="text-[1.55rem] leading-none tracking-[-0.04em]" />
                      <span className="text-sm font-semibold">home</span>
                    </span>
                    <span aria-hidden="true">›</span>
                  </Link>
                </motion.section>

                <motion.section
                  aria-label="Menu details"
                  animate={{ x: 0 }}
                  className="menu-scroll-region min-h-[52dvh] bg-surface outline-none lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
                  data-lenis-prevent
                  exit={{ x: "-100%" }}
                  initial={{ x: "-100%" }}
                  role="region"
                  tabIndex={0}
                  transition={{ delay: 0.05, duration: 0.42, ease }}
                >
                  <SecondaryPanel active={active} close={close} />
                </motion.section>

                <div aria-hidden="true" className="hidden lg:block" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
