import Image from "next/image";

import { vehicles } from "@/features/catalogue/data";

/**
 * A live, visual multi-select for the configurator's vehicle-mix step -
 * each catalogue vehicle is a large selectable card leading with its real
 * photography, replacing the previous text-only checkbox list. Adapts the
 * "Choicebox" pattern (21st.dev) - selected-tint + a checkmark affordance -
 * onto native <input type="checkbox"> + has-[:checked] CSS so it works
 * inside the configurator's server-rendered GET form with zero client JS.
 * No pricing is shown: HOC pricing stays pending per the data guardrail.
 */
export function VehicleMixSelector({
  selectedSlugs,
}: {
  selectedSlugs: string[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Vehicle mix</legend>
      <p className="mt-2 max-w-[52ch] text-sm leading-6 text-contrast-medium">
        Select any vehicles that fit the service you intend to build - choose as
        many as you like, or continue and refine the mix later. HOC&apos;s confirmed
        pricing and Lagos availability remain pending.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {vehicles.map((vehicle) => {
          const isPhoto = vehicle.imageFit === "cover";
          return (
            <label
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-card border border-contrast-low bg-surface-raised transition-colors duration-[var(--duration-hover)] hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-surface has-[:checked]:ring-2 has-[:checked]:ring-inset has-[:checked]:ring-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[var(--focus)]"
              key={vehicle.slug}
            >
              <input
                className="sr-only"
                defaultChecked={selectedSlugs.includes(vehicle.slug)}
                name="mix"
                type="checkbox"
                value={vehicle.slug}
              />
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <Image
                  alt={`${vehicle.name} electric vehicle`}
                  className={
                    isPhoto
                      ? "object-cover object-[50%_62%]"
                      : "object-contain p-4"
                  }
                  fill
                  quality={90}
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  src={vehicle.image}
                />
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full border border-contrast-low bg-canvas/90 text-transparent backdrop-blur-sm transition-colors group-has-[:checked]:border-primary group-has-[:checked]:bg-primary group-has-[:checked]:text-canvas"
                >
                  <svg fill="none" height="14" viewBox="0 0 20 20" width="14">
                    <path
                      d="M14 7L8.5 12.5L6 10"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold leading-tight">{vehicle.name}</p>
                <p className="mt-1 text-xs text-contrast-medium">{vehicle.category}</p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
