import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions cap the request body at 1MB by default; driver photo uploads
  // (a multipart body of up to a ~10MB image plus overhead) need more headroom.
  // Kept just above the driver-photos bucket's 10MB object limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  images: {
    qualities: [75, 90],
  },
  serverExternalPackages: ["postgres"],
  transpilePackages: [
    "@hoc/config",
    "@hoc/contracts",
    "@hoc/db",
    "@hoc/design-tokens",
    "@hoc/integrations",
  ],
};

export default nextConfig;
