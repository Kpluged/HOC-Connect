import { withSentryConfig } from "@sentry/nextjs";
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

// Source-map upload only runs when SENTRY_AUTH_TOKEN is set (CI/Vercel), so
// local builds and deploys without it never fail. Org/project come from env too.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
});
