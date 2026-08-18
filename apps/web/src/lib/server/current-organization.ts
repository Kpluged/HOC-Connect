import "server-only";
import { getServerCaller } from "@/server/trpc/caller";

/**
 * First-managed-organization only, no multi-org switcher this pass -
 * matches Milestone 8's own documented scope trim. Called independently
 * by the (owner) layout (for gating) and by each /space page (for its
 * own queries) rather than threaded through React context - Server
 * Actions/Components in this codebase never rely on layout-injected
 * data, matching the existing (admin)/(commerce) route groups.
 */
export async function getCurrentManagedOrganization() {
  const caller = await getServerCaller();
  const managed = await caller.organizations.listManaged();
  return managed[0]?.organization ?? null;
}
