import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleMobileNav: () => {
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen }));
  },

  closeMobileNav: () => {
    set({ mobileNavOpen: false });
  },
}));
