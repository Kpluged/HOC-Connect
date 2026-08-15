"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { getBodyType, listBodyTypes } from "@/features/catalogue/body-type";
import { buildSpecs } from "@/features/catalogue/build-specs";
import { vehicles } from "@/features/catalogue/data";

const ease = [0.16, 1, 0.3, 1] as const;

const bodyTypes = listBodyTypes(vehicles);

/**
 * Porsche's own "Change model" panel switches between body-style variants
 * of one nameplate (Cayenne SUV/Coupe/Electric...). HOC's catalogue has no
 * model-family concept - every vehicle is a distinct model - so this
 * adapts the same trigger -> overlay -> filtered-card-list interaction into
 * a catalogue-wide cross-shop by body type instead.
 */
export function ChangeModelPanel({ currentSlug }: { currentSlug: string }) {
  const currentVehicle = vehicles.find((vehicle) => vehicle.slug === currentSlug);
  const currentBodyType = currentVehicle
    ? getBodyType(currentVehicle.category)
    : bodyTypes[0];

  const [isOpen, setIsOpen] = useState(false);
  const [activeBodyType, setActiveBodyType] = useState(currentBodyType);
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
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
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

  function open(bodyType?: string) {
    setActiveBodyType(bodyType ?? currentBodyType);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const activeVehicles = vehicles.filter(
    (vehicle) => getBodyType(vehicle.category) === activeBodyType,
  );

  return (
    <>
      <div className="page-shell flex items-center gap-3 overflow-x-auto py-6">
        <div className="flex gap-2">
          {bodyTypes.map((bodyType) => (
            <button
              className={`menu-control inline-flex min-h-10 shrink-0 items-center rounded-control border px-4 text-sm font-semibold transition-colors ${
                bodyType === currentBodyType
                  ? "border-primary bg-primary text-canvas"
                  : "border-contrast-low bg-transparent text-contrast-high hover:bg-contrast-lower"
              }`}
              key={bodyType}
              onClick={() => open(bodyType)}
              type="button"
            >
              {bodyType}
            </button>
          ))}
        </div>
        <Button className="ml-auto shrink-0" onClick={() => open()} ref={triggerRef} variant="solid">
          Change model
        </Button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-canvas text-primary"
            data-room="light"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <div
              aria-label="Change model"
              aria-modal="true"
              className="relative min-h-dvh"
              ref={panelRef}
              role="dialog"
            >
              <button
                aria-label="Close"
                className="menu-control fixed right-5 top-5 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-canvas transition-transform hover:scale-105"
                onClick={close}
                ref={closeRef}
                type="button"
              >
                <CloseIcon />
              </button>

              <div className="grid min-h-dvh lg:grid-cols-[28vw_1fr]">
                <motion.section
                  animate={{ x: 0 }}
                  className="flex flex-col gap-2 border-b border-contrast-low bg-surface px-6 py-24 sm:px-10 lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-28"
                  exit={{ x: "-100%" }}
                  initial={{ x: "-100%" }}
                  transition={{ duration: 0.38, ease }}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">
                    Select a body type
                  </p>
                  <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {bodyTypes.map((bodyType) => {
                      const count = vehicles.filter(
                        (vehicle) => getBodyType(vehicle.category) === bodyType,
                      ).length;
                      return (
                        <button
                          aria-pressed={activeBodyType === bodyType}
                          className={`menu-control flex min-h-14 shrink-0 items-center justify-between gap-4 rounded-card px-5 text-left transition-colors ${
                            activeBodyType === bodyType ? "bg-canvas font-semibold" : "hover:bg-canvas"
                          }`}
                          key={bodyType}
                          onClick={() => setActiveBodyType(bodyType)}
                          type="button"
                        >
                          {bodyType}
                          <span className="text-xs text-contrast-medium">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>

                <motion.section
                  animate={{ x: 0 }}
                  className="px-6 py-10 sm:px-10 lg:h-full lg:overflow-y-auto lg:px-12 lg:py-16"
                  exit={{ x: "-100%" }}
                  initial={{ x: "-100%" }}
                  transition={{ delay: 0.05, duration: 0.42, ease }}
                >
                  <p className="text-3xl font-semibold tracking-[-0.03em]">{activeBodyType}</p>
                  <p className="mt-2 text-sm text-contrast-medium">
                    {activeVehicles.length} available model{activeVehicles.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2">
                    {activeVehicles.map((vehicle) => (
                      <VehicleCard
                        bodyType={activeBodyType}
                        detail={vehicle.category}
                        href={`/vehicles/${vehicle.slug}`}
                        image={vehicle.image}
                        imageFit={vehicle.imageFit}
                        key={vehicle.slug}
                        manufacturer={vehicle.manufacturer}
                        name={vehicle.name}
                        secondaryHref={`/configure/city?vehicle=${vehicle.slug}`}
                        segment={vehicle.segment}
                        specs={buildSpecs(vehicle)}
                      />
                    ))}
                  </div>
                </motion.section>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
