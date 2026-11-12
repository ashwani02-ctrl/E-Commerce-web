import { RoleGuard } from "@/providers/RoleGuard";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["buyer"]}>
    {children}
  </RoleGuard>;
}