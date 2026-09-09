import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LogOut, Menu, Search, Settings, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { GlobalSearchDialog } from "@/components/shared/global-search"
import { useAuthStore } from "@/store/auth-store"
import { useUIStore } from "@/store/ui-store"

const pageTitles: { match: string; title: string }[] = [
  { match: "/users", title: "Users" },
  { match: "/businesses", title: "Businesses" },
  { match: "/calls", title: "Call Logs" },
  { match: "/follow-ups", title: "Follow-ups" },
  { match: "/deals", title: "Deals" },
  { match: "/analytics", title: "Analytics" },
  { match: "/settings", title: "Settings" },
]

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/businesses") && pathname !== "/businesses")
    return "Business Details"
  const match = pageTitles.find((item) => pathname.startsWith(item.match))
  if (match) return match.title
  return "CRM"
}

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openGlobalSearch = useUIStore((s) => s.openGlobalSearch)

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="hidden text-muted-foreground sm:inline">CRM</span>
        <span className="hidden text-muted-foreground sm:inline">/</span>
        <h2 className="truncate text-sm font-semibold">{pageTitle}</h2>
      </div>

      <Button
        variant="outline"
        className="hidden gap-2 text-muted-foreground sm:inline-flex"
        onClick={openGlobalSearch}
      >
        <Search className="h-4 w-4" />
        Search…
        <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={openGlobalSearch}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate">{user?.name ?? "User"}</span>
              <span className="text-xs font-normal capitalize text-muted-foreground">
                {user?.role ?? "agent"}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <UserRound className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GlobalSearchDialog />
    </header>
  )
}