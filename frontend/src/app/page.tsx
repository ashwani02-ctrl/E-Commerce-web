"use client"

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Homepage from "./_components/landing-page/homepage";

type NavItem = {
  label: string;
  href: string;
};

const buyerMenuItems = [
  { label: "My Profile", href: "/profile" },
  { label: "My Orders", href: "/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Saved Addresses", href: "/addresses" },
  { label: "Account Settings", href: "/settings" },
];

const sellerMenuItems = [
  { label: "My Store", href: "/seller/store" },
  { label: "Seller Dashboard", href: "/seller" },
  { label: "Manage Products", href: "/seller/products" },
  { label: "Manage Orders", href: "/seller/orders" },
  { label: "Store Settings", href: "/seller/settings" },
];

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Shop all", href: "#" },
    { label: "New & noteworthy", href: "#" },
    { label: "Stores", href: "#" },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A";
  };

  const handleMenuClick = async (href?: string) => {
    if (href) {
      router.push(href);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  const menuItems = user?.role === "seller" ? sellerMenuItems : buyerMenuItems;

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

          {!user ? (
            <>
              <Button
                variant="secondary"
                className="h-12 px-6 text-base bg-white text-brand-blue border border-border transition-all duration-200 hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
                onClick={() => router.push("/login")}
              >
                Log in
              </Button>
              <Button
                variant="default"
                className="h-12 px-6 text-base bg-[var(--brand-orange)] text-white border border-[var(--brand-orange)] shadow-[0_6px_18px_rgba(255,152,27,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e88a00] hover:shadow-[0_10px_22px_rgba(255,152,27,0.35)] active:translate-y-0"
                onClick={() => router.push("/register")}
              >
                Join now
              </Button>
            </>
          ) : (
            <div className="relative flex items-center gap-4">
              {user.role === "buyer" ? (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-brand-navy">Welcome back,</span>
                    <span className="font-semibold text-brand-blue">{user.name.split(" ")[0]}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe7ff] text-2xl font-semibold text-brand-navy shadow-sm ring-1 ring-black/5"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    {getInitials(user.name)}
                  </button>


                </>
              ) : (
                <>
                  {/* <button
                    type="button"
                    className="flex items-center gap-3 rounded-full bg-transparent px-2 py-1 text-brand-navy"
                    onClick={() => router.push("/seller")}
                  >
                    <span className="text-lg font-medium">Seller Dashboard</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe7ff] text-2xl font-semibold text-brand-navy shadow-sm ring-1 ring-black/5"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    {getInitials(user.name)}
                  </button> */}
                </>
              )}



              {isMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 rounded-2xl border border-border bg-background p-2 shadow-xl">
                  {user?.role === "buyer" ? (
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfe7ff] text-lg font-semibold text-brand-navy">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-brand-navy">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Buyer account
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleMenuClick(item.href)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium text-brand-navy transition hover:bg-muted"
                      >
                        <span className="text-lg">{item.label === "My Profile" ? "👤" : item.label === "My Orders" ? "📦" : item.label === "Wishlist" ? "♡" : item.label === "Saved Addresses" ? "📍" : item.label === "Account Settings" ? "⚙️" : item.label === "My Store" ? "🏪" : item.label === "Seller Dashboard" ? "🏠" : item.label === "Manage Products" ? "🛍️" : item.label === "Manage Orders" ? "📋" : item.label === "Store Settings" ? "⚙️" : "•"}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}

                    <div className="my-2 border-t border-border" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium text-red-500 transition hover:bg-red-50"
                    >
                      <span className="text-lg">↩</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <Button
            type="button"
            aria-label="Go to cart"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-white text-brand-navy transition hover:border-brand-blue/40 hover:bg-brand-blue/5"
            onClick={() => router.push("/cart")}
          >
            <img src="/cart-shopping-fast-svgrepo-com.svg" alt="Cart" className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 lg:px-10">
        <Homepage/>
      </section>
    </main>
  );
}
