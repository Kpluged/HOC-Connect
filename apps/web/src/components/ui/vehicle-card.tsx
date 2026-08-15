import Image from "next/image";
import Link from "next/link";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";

export function VehicleCard({
  detail,
  href,
  image,
  imageFit = "contain",
  name,
  status = "Pricing pending",
}: {
  detail: string;
  href: string;
  image: string;
  /**
   * "contain" = isolated product-plate cutout on the neutral surface (house
   * treatment). "cover" = full-scene manufacturer photography, bled
   * edge-to-edge; desaturated at rest so varied source lighting/backgrounds
   * still read as one calm system, full colour revealed on hover.
   */
  imageFit?: "contain" | "cover";
  name: string;
  status?: string;
}) {
  const isPhoto = imageFit === "cover";

  return (
    <article>
      <Link className="group block" href={href}>
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden bg-surface",
            !isPhoto && "p-5 sm:p-7",
          )}
        >
          <Image
            alt={isPhoto ? `${name} electric vehicle` : `${name} electric vehicle placeholder`}
            className={cn(
              "transition-[transform,filter] duration-500 ease-[var(--ease-engineered)] group-hover:scale-[1.025]",
              isPhoto
                ? "object-cover object-[50%_62%] saturate-[0.35] contrast-[1.05] group-hover:saturate-100"
                : "object-contain p-3",
            )}
            fill
            quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={image}
          />
          {isPhoto ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/8"
            />
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-4 pt-4">
          <div>
            <h3 className="text-lg font-semibold group-hover:underline group-hover:underline-offset-4">
              {name}
            </h3>
            <p className="mt-1 text-sm text-contrast-medium">{detail}</p>
          </div>
          <Chip>{status}</Chip>
        </div>
      </Link>
    </article>
  );
}
