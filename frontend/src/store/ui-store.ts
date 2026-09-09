import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface UIState {
  sidebarOpen: boolean
  theme: Theme
  globalSearchOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  openGlobalSearch: () => void
  closeGlobalSearch: () => void
}

const STORAGE_KEY = "crm-ui"

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: Theme } }
      if (parsed?.state?.theme === "dark" || parsed?.state?.theme === "light") {
        return parsed.state.theme
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

applyTheme(getInitialTheme())

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: getInitialTheme(),
      globalSearchOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () =>
        set((s) => {
          const theme: Theme = s.theme === "dark" ? "light" : "dark"
          applyTheme(theme)
          return { theme }
        }),
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      openGlobalSearch: () => set({ globalSearchOpen: true }),
      closeGlobalSearch: () => set({ globalSearchOpen: false }),
    }),
    {
      name: STORAGE_KEY,
    },
  ),
)