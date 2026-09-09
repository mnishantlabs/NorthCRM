import { Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/shared/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BUSINESS_STATUSES, STATUS_LABELS } from "@/utils/constants"
import { useUsers } from "@/hooks/use-users"
import { useExportBusinesses } from "@/hooks/use-businesses"
import { useAuthStore } from "@/store/auth-store"
import type { BusinessFilters } from "@/services/business.service"

interface BusinessFiltersProps {
  filters: BusinessFilters
  onFilterChange: (patch: Partial<BusinessFilters>) => void
  onReset: () => void
}

export function BusinessFiltersBar({
  filters,
  onFilterChange,
  onReset,
}: BusinessFiltersProps) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  const { data: usersData } = useUsers()
  const exportBusinesses = useExportBusinesses()
  const agents = usersData?.items ?? []

  const hasActiveFilters =
    !!filters.search ||
    !!filters.status ||
    !!filters.assigned_agent ||
    !!filters.category

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={filters.search ?? ""}
            onChange={(search) => onFilterChange({ search })}
            placeholder="Search businesses..."
            className="lg:col-span-2"
          />
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              onFilterChange({ status: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BUSINESS_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin ? (
            <Select
              value={filters.assigned_agent ?? "all"}
              onValueChange={(value) =>
                onFilterChange({
                  assigned_agent: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={filters.category ?? ""}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              placeholder="Category..."
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportBusinesses(filters)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Input
                value={filters.category ?? ""}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                placeholder="Category..."
                className="h-8 w-40 text-sm"
              />
            </>
          ) : null}
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
