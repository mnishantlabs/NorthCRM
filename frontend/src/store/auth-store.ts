import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserType } from "@/types"

interface AuthState {
  user: UserType | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  setAuth: (accessToken: string, refreshToken: string, user: UserType | null) => void
  setUser: (user: UserType | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      setAuth: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isLoading: false }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false }),
    }),
    {
      name: "crm-auth",
    },
  ),
)