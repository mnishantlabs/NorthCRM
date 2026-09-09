import { useNavigate } from "react-router-dom"
import { ArrowLeft, Globe, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BUSINESS_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/utils/constants"
import { useUpdateBusinessStatus } from "@/hooks/use-businesses"
import { formatPhone } from "@/utils/format"
import type { BusinessType } from "@/types"
import { cn } from "@/utils/cn"

interface BusinessDetailHeaderProps {
  business: BusinessType
}

export function BusinessDetailHeader({ business }: BusinessDetailHeaderProps) {
  const navigate = useNavigate()
  const updateStatus = useUpdateBusinessStatus()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{business.business_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {business.category ? (
                <span className="inline-flex rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">
                  {business.category}
                </span>
              ) : null}
              <StatusBadge status={business.status} />
            </div>
          </div>
        </div>

        <Select
          value={business.status}
          onValueChange={(status) =>
            updateStatus.mutate({
              id: business.id,
              status: status as BusinessType["status"],
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                    STATUS_COLORS[status],
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {business.phone ? (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{formatPhone(business.phone)}</span>
          </a>
        ) : null}
        {business.email ? (
          <a
            href={`mailto:${business.email}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{business.email}</span>
          </a>
        ) : null}
        {business.website ? (
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{business.website}</span>
          </a>
        ) : null}
        {business.address || business.city ? (
          <a
            href={business.google_maps_url ?? undefined}
            target={business.google_maps_url ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {[business.address, business.city, business.state].filter(Boolean).join(", ") ||
                business.country}
            </span>
          </a>
        ) : null}
      </div>
    </div>
  )
}
