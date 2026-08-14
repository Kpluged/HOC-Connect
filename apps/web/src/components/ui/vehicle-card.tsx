import Image from "next/image";
import Link from "next/link";

import { Chip } from "@/components/ui/chip";

export function VehicleCard({
  detail,
  href,
  image,
  name,
  status = "Specifications pending",
}: {
  detail: string;
  href: string;
  image: string;
  name: string;
  status?: string;
}) {
  return (
    <article>
      <Link className="group block" href={href}>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface p-5 sm:p-7">
          <Image
            alt={`${name} electric vehicle placeholder`}
            className="object-contain p-3 transition-transform duration-500 ease-[var(--ease-engineered)] group-hover:scale-[1.025]"
            fill
            quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={image}
          />
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
