import { create } from "zustand";
import { isAxiosError } from "axios";
import { AuthUser, authService } from "@/lib/auth";
import { setTokens, clearTokens } from "@/lib/axios";
import { ensureSessionCookie, getAccessToken } from "@/lib/tokens";

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
    const access = getAccessToken();
    if (!access) return;
    // Migrates sessions created before the ac_session cookie existed.
    ensureSessionCookie();
    set({ accessToken: access, isAuthenticated: true });
    // Restore user from API
    try {
      const user = await authService.me();
      set({ user });
    } catch (err) {
      // A 401 here means the refresh also failed (the axios interceptor has
      // already tried). Network errors keep the session.
      if (isAxiosError(err) && err.response?.status === 401) {
        clearTokens();
        set({ accessToken: null, isAuthenticated: false });
      }
    }
  },
}));
