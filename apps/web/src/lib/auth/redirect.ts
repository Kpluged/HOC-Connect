/**
 * Only ever redirect to a same-origin relative path carried through
 * ?redirectTo= - prevents an open-redirect via a crafted external URL.
 */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback = "/account",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
