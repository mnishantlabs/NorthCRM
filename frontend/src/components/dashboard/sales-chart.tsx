import { AreaChart as AreaChartIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/utils/format"
import type { SalesData } from "@/types"

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 12 }

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: SalesData; value: number }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-md">
      <p className="text-xs font-semibold">{data.month}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{formatCurrency(data.revenue)}</span>{" "}
        revenue
      </p>
    </div>
  )
}

export function SalesChart({ data }: { data: SalesData[] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<AreaChartIcon className="h-8 w-8 text-muted-foreground" />}
        title="No sales data"
        description="Monthly revenue trends will appear here once deals are closed."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={70}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#salesGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
