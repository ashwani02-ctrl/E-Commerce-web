"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

type ActionButton = {
  label: string;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  icon?: string;
};

export default function Home() {
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: "Shop all", href: "#" },
    { label: "New & noteworthy", href: "#" },
    { label: "Stores", href: "#" },
  ];

  const actionButtons: ActionButton[] = [
    {
      label: "Log in",
      variant: "secondary",
      className:
        "h-12 px-6 text-base bg-white text-brand-blue border border-border transition-all duration-200 hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
      onClick: () => router.push("/login"),
    },
    {
      label: "Join now",
      variant: "default",
      className:
        "h-12 px-6 text-base bg-[var(--brand-orange)] text-white border border-[var(--brand-orange)] shadow-[0_6px_18px_rgba(255,152,27,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e88a00] hover:shadow-[0_10px_22px_rgba(255,152,27,0.35)] active:translate-y-0",
      onClick: () => router.push("/register"),
    },
    {
      label: "Cart",
      variant: "outline",
      className:
        "h-12 w-12 rounded-xl border border-border bg-white p-0 text-brand-navy transition-all duration-200 hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
      onClick: () => router.push("/cart"),
      icon: "/cart-shopping-fast-svgrepo-com.svg",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto my-8 flex max-w-7xl items-center justify-between rounded-xl border border-border bg-background px-6 py-2 lg:px-10">
        <div className="flex items-center gap-3">
          <img src="/bazzar-logo.svg" alt="Bazzar logo" className="h-18 w-auto cursor-pointer object-contain" />
        </div>

        <nav aria-label="Main navigation">
          <ul className="flex items-center justify-center gap-8 text-sm font-medium text-brand-navy">
            {navItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-[18px] transition-colors hover:text-brand-blue">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {actionButtons.map((button) => (
            <Button
              key={button.label}
              variant={button.variant}
              className={button.className}
              onClick={button.onClick}
            >
              {button.icon ? (
                <img src={button.icon} alt={button.label} className="h-5 w-5" />
              ) : (
                button.label
              )}
            </Button>
          ))}
        </div>
      </header>
    </main>
  );
}
