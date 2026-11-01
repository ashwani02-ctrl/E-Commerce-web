import type { Role } from "@/types/api";
 
// Shared by the browser code (AuthProvider) and by proxy.ts, so it must stay free of React.
 
export const ROLE_COOKIE = "bazaar_role";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // same 7 days as the login token
 
export const isRole = (value: unknown): value is Role =>
  value === "buyer" || value === "seller" || value === "admin";
 
/** Where each role lands after logging in */
export const homePathForRole = (role: Role): string => {
  if (role === "seller") return "/seller/orders";
  if (role === "admin") return "/admin/products";
  return "/";
};
 
/**
 * Reads ?next=/some/page from the address bar (browser only).
 * Only same-site paths are accepted, so a link can't redirect to another website.
 */
export const getSafeNext = (): string | null => {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
};
 
/**
 * The role cookie only lets proxy.ts redirect people before a page loads.
 * It is not a login: it holds no token, anyone can edit it, and the backend
 * never trusts it. Real access is decided by the token on every API request.
 */
export function setRoleCookie(role: Role): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ROLE_COOKIE}=${role}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
 
export function clearRoleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}