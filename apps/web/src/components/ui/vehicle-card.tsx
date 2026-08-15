import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { buildSpecs } from "@/features/catalogue/build-specs";
import { cn } from "@/lib/cn";

export function VehicleCard({
  bodyType,
  detail,
  href,
  image,
  imageFit = "contain",
  manufacturer,
  name,
  secondaryHref,
  secondaryLabel = "Configure",
  segment,
  specs,
  status = "Pricing pending",
}: {
  /** Metadata pill - one of the body-type/segment/manufacturer trio below. */
  bodyType?: string;
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
  manufacturer?: string;
  name: string;
  /**
   * Presence of secondaryHref switches the card from "whole card is one
   * link" to an expanded mode with metadata pills, a compact spec row, and
   * a dual-CTA footer (primary -> href, secondary -> secondaryHref).
   */
  secondaryHref?: string;
  secondaryLabel?: string;
  segment?: string;
  specs?: ReturnType<typeof buildSpecs>;
  status?: string;
}) {
  const isPhoto = imageFit === "cover";

  const media = (
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
  );

  if (!secondaryHref) {
    return (
      <article>
        <Link className="group block" href={href}>
          {media}
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

  const pills = [bodyType, segment, manufacturer].filter(Boolean);

  return (
    <article>
      <Link className="group block" href={href}>
        {media}
      </Link>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={href}>
              <h3 className="text-lg font-semibold hover:underline hover:underline-offset-4">
                {name}
              </h3>
            </Link>
            <p className="mt-1 text-sm text-contrast-medium">{detail}</p>
          </div>
          <Chip>{status}</Chip>
        </div>
        {pills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <Chip key={pill} variant="neutral">
                {pill}
              </Chip>
            ))}
          </div>
        ) : null}
        {specs && specs.length > 0 ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-contrast-low pt-4">
            {specs.slice(0, 2).map((spec) => (
              <div key={spec.label}>
                <dt className="text-xs text-contrast-medium">{spec.label}</dt>
                <dd className="text-sm font-semibold">
                  {spec.value}
                  <span className="ml-1 text-xs font-normal text-contrast-medium">{spec.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={href} variant="solid">
            Explore in detail
          </ButtonLink>
          <ButtonLink href={secondaryHref} variant="outline">
            {secondaryLabel}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
