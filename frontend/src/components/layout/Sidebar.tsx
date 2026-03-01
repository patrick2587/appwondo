"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Images,
  BookOpen,
  Shield,
  PanelLeftClose,
  PanelLeft,
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

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const isAdmin = user?.role === "admin" || user?.role === "vorstand";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-dark-charcoal transition-all duration-200",
        sidebarOpen ? "w-60" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-3">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <img
            src="/logo.png"
            alt="TKD Torgau"
            className="h-9 w-9 shrink-0 rounded-full"
          />
          {sidebarOpen && (
            <span className="text-sm font-bold font-heading text-white whitespace-nowrap">
              TKD Torgau
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
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
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                  title={!sidebarOpen ? adminItem.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{adminItem.label}</span>}
                </Link>
              );
            })()}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={sidebarOpen ? "Seitenleiste einklappen" : "Seitenleiste ausklappen"}
        >
          {sidebarOpen ? (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span>Einklappen</span>
            </>
          ) : (
            <PanelLeft className="h-5 w-5 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
