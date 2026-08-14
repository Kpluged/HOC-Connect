import type { Metadata } from "next";
import { Inter, Mr_Dafoe } from "next/font/google";

import { LenisProvider } from "@/components/providers/lenis-provider";

import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700"],
});

const hocWordmark = Mr_Dafoe({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-hoc-wordmark",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "HOC Connect",
    template: "%s · HOC Connect",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${hocWordmark.variable}`}>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
