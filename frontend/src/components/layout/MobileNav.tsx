"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Images,
  BookOpen,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Uebersicht", href: "/", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Kalender", href: "/calendar", icon: CalendarDays },
  { label: "Galerie", href: "/gallery", icon: Images },
  { label: "Wiki", href: "/wiki", icon: BookOpen },
];

const adminItem: NavItem = {
  label: "Admin",
  href: "/admin",
  icon: Shield,
};

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mobileNavOpen, closeMobileNav } = useUIStore();

  const isAdmin = user?.role === "admin" || user?.role === "vorstand";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // Close mobile nav on route change
  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  // Prevent body scroll when open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  if (!mobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeMobileNav}
      />

      {/* Drawer */}
      <nav className="absolute inset-y-0 left-0 w-72 bg-dark-charcoal shadow-lg">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link
            href="/"
            onClick={closeMobileNav}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="TKD Torgau"
              className="h-9 w-9 rounded-full"
            />
            <span className="text-sm font-bold font-heading text-white">
              TKD Torgau
            </span>
          </Link>

          <button
            onClick={closeMobileNav}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Navigation schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <div className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-white/10" />
              {(() => {
                const Icon = adminItem.icon;
                const active = isActive(adminItem.href);
                return (
                  <Link
                    href={adminItem.href}
                    onClick={closeMobileNav}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{adminItem.label}</span>
                  </Link>
                );
              })()}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
