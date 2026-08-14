import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  transpilePackages: [
    "@hoc/contracts",
    "@hoc/design-tokens",
    "@hoc/integrations",
  ],
};

export default nextConfig;
