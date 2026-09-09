import { format } from "date-fns"
import { BarChart as BarChartIcon } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { EmptyState } from "@/components/shared/empty-state"
import type { CallsPerDay } from "@/types"

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 12 }

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: CallsPerDay; value: number }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-md">
      <p className="text-xs font-semibold">{format(new Date(data.date), "MMM d, yyyy")}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{data.count}</span> calls
      </p>
    </div>
  )
}

export function CallsChart({ data }: { data: CallsPerDay[] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<BarChartIcon className="h-8 w-8 text-muted-foreground" />}
        title="No call data"
        description="Calls per day for the last 30 days will appear here once calls are logged."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => format(new Date(value), "MMM d")}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
