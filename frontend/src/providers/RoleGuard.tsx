"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { homePathForRole, useAuth } from "./AuthProvider";
import type { Role } from "@/types/api";

/**
 * Wrap a layout in this to keep other roles out of those pages.
 * It only improves what the user sees: the backend still checks the role on every request.
 */
export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = user !== null && roles.includes(user.role);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (!allowed) {
      router.replace(homePathForRole(user.role));
    }
  }, [isLoading, user, allowed, pathname, router]);

  if (isLoading || !allowed) {
    return (
      <div role="status" className="p-8 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}