"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render the portal if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <WebSocketProvider>
      <div className="flex h-screen overflow-hidden bg-bg-page">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile navigation drawer */}
        <MobileNav />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>

      <ToastContainer />
    </WebSocketProvider>
  );
}
