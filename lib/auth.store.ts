import { create } from "zustand";
import { AuthUser, authService } from "@/lib/auth";
import { setTokens, clearTokens } from "@/lib/axios";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, access: string, refresh: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, access, refresh) => {
    setTokens(access, refresh);
    set({ user, accessToken: access, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const access = localStorage.getItem("access_token");
    if (!access) return;
    set({ accessToken: access, isAuthenticated: true });
    // Restore user from API
    try {
      const user = await authService.me();
      set({ user });
    } catch {
      // Token invalid — clear
      clearTokens();
      set({ accessToken: null, isAuthenticated: false });
    }
  },
}));
