"use client";

import { useRouter } from "next/navigation";
import { Menu, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleMobileNav } = useUIStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const userMenuItems: DropdownItem[] = [
    {
      label: "Einstellungen",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => router.push("/settings"),
    },
    {
      label: "Abmelden",
      icon: <LogOut className="h-4 w-4" />,
      onClick: handleLogout,
      destructive: true,
    },
  ];

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      {/* Left: Hamburger (mobile) + logo/title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileNav}
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-light-gray hover:text-text-primary md:hidden"
          aria-label="Navigation oeffnen"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <img src="/logo.png" alt="TKD Torgau" className="h-8 w-8 rounded-full" />
          <span className="text-sm font-bold font-heading text-text-primary">
            TKD Torgau
          </span>
        </div>
      </div>

      {/* Right: User avatar dropdown */}
      {user && (
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-light-gray">
              <Avatar name={user.display_name} size="sm" />
              <span className="hidden text-sm font-medium text-text-primary sm:block">
                {user.display_name}
              </span>
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      )}
    </header>
  );
}
