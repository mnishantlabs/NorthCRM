import type { ReactNode } from "react"
import { Phone, CalendarClock, Handshake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDateTime, formatCurrency } from "@/utils/format"
import { STATUS_LABELS, DEAL_STATUS_LABELS, FOLLOWUP_STATUS_LABELS } from "@/utils/constants"
import { Activity } from "lucide-react"
import type { CallLogType, FollowUpType, DealType } from "@/types"

interface BusinessTimelineProps {
  callLogs?: CallLogType[]
  followUps?: FollowUpType[]
  deals?: DealType[]
}

type TimelineItem = {
  key: string
  type: "call" | "followup" | "deal"
  date: string
  title: string
  description?: string
  icon: ReactNode
}

export function BusinessTimeline({ callLogs, followUps, deals }: BusinessTimelineProps) {
  const items: TimelineItem[] = [
    ...(callLogs ?? []).map((call) => ({
      key: `call-${call.id}`,
      type: "call" as const,
      date: call.call_date ?? call.created_at,
      title: `Call logged by ${call.agent?.name ?? "Unknown agent"}`,
      description: `${STATUS_LABELS[call.call_result] ?? call.call_result}${
        call.duration ? ` — ${call.duration} min` : ""
      }${call.notes ? `\n${call.notes}` : ""}`,
      icon: <Phone className="h-4 w-4" />,
    })),
    ...(followUps ?? []).map((fu) => ({
      key: `followup-${fu.id}`,
      type: "followup" as const,
      date: fu.followup_date,
      title: `Follow-up ${FOLLOWUP_STATUS_LABELS[fu.status] ?? fu.status}`,
      description: fu.notes ?? undefined,
      icon: <CalendarClock className="h-4 w-4" />,
    })),
    ...(deals ?? []).map((deal) => ({
      key: `deal-${deal.id}`,
      type: "deal" as const,
      date: deal.created_at,
      title: `Deal ${DEAL_STATUS_LABELS[deal.status] ?? deal.status}`,
      description: deal.estimated_value
        ? `Estimated value ${formatCurrency(deal.estimated_value)}${
            deal.closing_probability != null
              ? ` — ${deal.closing_probability}% probability`
              : ""
          }`
        : undefined,
      icon: <Handshake className="h-4 w-4" />,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-8 w-8 text-muted-foreground" />}
        title="No activity yet"
        description="Calls, follow-ups and deals for this business will appear here."
      />
    )
  }

  return (
    <div className="relative space-y-4 border-l-2 border-border pl-6">
      {items.map((item) => (
        <div key={item.key} className="relative">
          <span
            className={`absolute -left-[34px] top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm ${
              item.type === "call"
                ? "bg-blue-500/10 text-blue-500"
                : item.type === "followup"
                  ? "bg-purple-500/10 text-purple-500"
                  : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {item.icon}
          </span>
          <Card className="shadow-sm">
            <CardContent className="space-y-1 pt-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(item.date)}
                </p>
              </div>
              {item.description ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
