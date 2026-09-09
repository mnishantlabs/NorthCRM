import { Link } from "react-router-dom"
import { CalendarClock } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { formatDateTime, relativeTime } from "@/utils/format"
import type { FollowUpType } from "@/types"

export function UpcomingFollowups({ items }: { items: FollowUpType[] }) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="h-8 w-8 text-muted-foreground" />}
        title="No upcoming follow-ups"
        description="Follow-ups scheduled for the next few days will appear here."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/follow-ups">Manage follow-ups</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <ul className="divide-y">
        {items.map((item) => {
          const businessName = item.business_name ?? item.business?.business_name ?? "Business"
          const agentName = item.agent_name ?? item.agent?.name
          return (
            <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  to={`/businesses/${item.business_id}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {businessName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {agentName ? `${agentName} · ` : ""}
                  {formatDateTime(item.followup_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <span className="text-xs text-muted-foreground">
                  {relativeTime(item.followup_date)}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex justify-end border-t pt-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/follow-ups">View all</Link>
        </Button>
      </div>
    </div>
  )
}
