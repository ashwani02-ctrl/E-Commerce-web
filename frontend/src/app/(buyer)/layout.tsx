import { RoleGuard } from "@/providers/RoleGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["buyer"]}>{children}</RoleGuard>;
}