import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartPie } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { STATUS_LABELS } from "@/utils/constants"
import { formatNumber } from "@/utils/format"
import type { LeadStatus } from "@/types"

const STATUS_HEX: Record<string, string> = {
  new: "#3b82f6",
  called: "#6b7280",
  busy: "#f97316",
  interested: "#22c55e",
  not_interested: "#ef4444",
  no_answer: "#eab308",
  callback: "#a855f7",
  meeting_scheduled: "#6366f1",
  proposal_sent: "#06b6d4",
  closed_won: "#10b981",
  closed_lost: "#f43f5e",
  spam: "#64748b",
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; originalStatus: string } }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-md">
      <p className="text-xs font-semibold">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{data.value}</span> leads
      </p>
    </div>
  )
}

export function LeadStatusChart({ data }: { data: LeadStatus[] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<ChartPie className="h-8 w-8 text-muted-foreground" />}
        title="No lead data"
        description="Lead status distribution will appear once leads are tracked."
      />
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)

  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] ?? item.status,
    originalStatus: item.status,
    value: item.count,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="70%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={STATUS_HEX[entry.originalStatus] ?? "#94a3b8"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{formatNumber(total)}</span>
          <span className="text-xs text-muted-foreground">Total Leads</span>
        </div>
      </div>

      <div className="space-y-2">
        {chartData.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"
          return (
            <div key={item.originalStatus} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: STATUS_HEX[item.originalStatus] ?? "#94a3b8",
                }}
              />
              <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
              <span className="font-medium">{formatNumber(item.value)}</span>
              <span className="w-12 text-right tabular-nums">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
