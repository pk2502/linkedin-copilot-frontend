import api from "@/lib/axios";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/api/auth/register/", payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post("/api/auth/login/", payload);
    // login returns access + refresh but no user — fetch me
    const user = await authService.me(data.access);
    return { ...data, user };
  },

  me: async (token?: string): Promise<AuthUser> => {
    const { data } = await api.get<AuthUser>("/api/auth/me/", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  },
};
