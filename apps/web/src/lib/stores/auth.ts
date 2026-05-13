"use client";

import { create } from "zustand";
import { pb } from "@/lib/api/client";

type AuthState = {
  isReady: boolean;
  isAuthenticated: boolean;
  init: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  isAuthenticated: pb.authStore.isValid,
  init: () => {
    pb.authStore.onChange(() => {
      set({ isAuthenticated: pb.authStore.isValid });
    });
    set({ isReady: true, isAuthenticated: pb.authStore.isValid });
  },
}));
