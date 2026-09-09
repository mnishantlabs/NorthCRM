import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Trophy } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNumber } from "@/utils/format"
import type { AgentPerformance } from "@/types"

const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#ec4899"]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: AgentPerformance }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-md">
      <p className="text-xs font-semibold">{data.agent_name}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{data.calls_count}</span> calls
      </p>
    </div>
  )
}

export function AgentPerformanceChart({ data }: { data: AgentPerformance[] }) {
  const sorted = data
    ? [...data].sort((a, b) => b.calls_count - a.calls_count)
    : []

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-8 w-8 text-muted-foreground" />}
        title="No agent data"
        description="Agent performance will appear once agents start logging calls."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="agent_name"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
        <Bar dataKey="calls_count" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {sorted.map((entry, index) => (
            <Cell key={entry.agent_id} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
          <LabelList
            dataKey="calls_count"
            position="right"
            formatter={(value: number) => formatNumber(value)}
            style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
