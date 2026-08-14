import Link from "next/link";

import { BrandLockup } from "@/components/ui/brand-lockup";

const footerLinks = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/configure/city", label: "Configure" },
  { href: "/how-it-works", label: "How it works" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-contrast-low bg-canvas">
      <div className="page-shell grid gap-12 py-12 md:grid-cols-2 md:items-end">
        <div>
          <BrandLockup />
          <p className="mt-5 max-w-[42ch] text-sm leading-6 text-contrast-medium">
            Vehicle details, commercial terms, and market availability remain subject
            to confirmation by HOC.
          </p>
        </div>
        <nav aria-label="Footer" className="md:justify-self-end">
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link className="underline-offset-4 hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
