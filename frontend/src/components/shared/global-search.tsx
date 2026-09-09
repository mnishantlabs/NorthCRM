import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  Building2,
  CalendarClock,
  HandCoins,
  LayoutDashboard,
  Loader2,
  Phone,
  Search,
  Settings,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useUIStore } from "@/store/ui-store"
import { getBusinesses, type BusinessFilters } from "@/services/business.service"
import { useDebounce } from "@/hooks/use-debounce"
import { StatusBadge } from "@/components/shared/status-badge"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/calls", label: "Call Logs", icon: Phone },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { to: "/deals", label: "Deals", icon: HandCoins },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function GlobalSearchDialog() {
  const open = useUIStore((s) => s.globalSearchOpen)
  const openGlobalSearch = useUIStore((s) => s.openGlobalSearch)
  const closeGlobalSearch = useUIStore((s) => s.closeGlobalSearch)
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  const searchResult = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async (): Promise<{ id: string; business_name: string; phone: string | null; category: string | null; status: string }[] | null> => {
      if (!debouncedQuery.trim()) return null
      const filters: BusinessFilters = {
        search: debouncedQuery,
        per_page: 6,
        sort_by: "created_at",
        sort_order: "desc",
      }
      const res = await getBusinesses(filters)
      return res.items.map((b) => ({
        id: b.id,
        business_name: b.business_name,
        phone: b.phone,
        category: b.category,
        status: b.status,
      }))
    },
    enabled: open && debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        const store = useUIStore.getState()
        if (store.globalSearchOpen) {
          store.closeGlobalSearch()
        } else {
          store.openGlobalSearch()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) setQuery("")
  }, [open])

  const trimmed = query.trim()

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? openGlobalSearch() : closeGlobalSearch())}
    >
      <DialogContent className="top-[18%] overflow-hidden p-0 sm:max-w-lg">
        <Command className="rounded-lg border shadow-md" shouldFilter={false}>
          <CommandInput
            placeholder="Search businesses, phone, email, owner…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList>
            {trimmed === "" ? (
              <>
                <CommandGroup heading="Navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.to}
                        value={item.to}
                        onSelect={() => {
                          closeGlobalSearch()
                          navigate(item.to)
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            ) : searchResult.isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching businesses…
              </div>
            ) : searchResult.data && searchResult.data.length > 0 ? (
              <>
                <CommandGroup heading="Businesses">
                  {searchResult.data.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={b.id}
                      onSelect={() => {
                        closeGlobalSearch()
                        navigate(`/businesses/${b.id}`)
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{b.business_name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {b.category ? (
                            <span className="text-xs text-muted-foreground">
                              {b.category}
                            </span>
                          ) : null}
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandItem
                  value="view-all"
                  onSelect={() => {
                    closeGlobalSearch()
                    navigate(`/businesses?search=${encodeURIComponent(trimmed)}`)
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  View all in businesses
                </CommandItem>
              </>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}