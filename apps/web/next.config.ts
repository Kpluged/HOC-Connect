import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
