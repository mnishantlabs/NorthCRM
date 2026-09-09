import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  CheckCircle2,
  HandCoins,
  IndianRupee,
  RefreshCw,
  Users,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { StatCard } from "@/components/dashboard/stat-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { AgentPerformanceChart } from "@/components/dashboard/agent-performance-chart"
import { CallsChart } from "@/components/dashboard/calls-chart"
import { STATUS_LABELS } from "@/utils/constants"
import { formatCurrency, formatNumber } from "@/utils/format"
import { cn } from "@/utils/cn"
import {
  useAgentPerformance,
  useCallsPerDay,
  useDashboardStats,
  useLeadStatus,
  useSalesData,
} from "@/hooks/use-dashboard"
import type { AgentPerformance } from "@/types"

const FUNNEL_STAGES = ["new", "called", "interested", "proposal_sent", "closed_won"] as const

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 12 }

interface FunnelItem {
  key: string
  label: string
  count: number
}

function buildFunnel(data: { status: string; count: number }[]): FunnelItem[] {
  const countMap = new Map<string, number>()
  for (const item of data) {
    countMap.set(item.status, item.count)
  }
  return FUNNEL_STAGES.map((stage) => ({
    key: stage,
    label: STATUS_LABELS[stage] ?? stage,
    count: countMap.get(stage) ?? 0,
  }))
}

interface RevenueTooltipProps {
  active?: boolean
  payload?: Array<{ payload: AgentPerformance }>
}

function RevenueTooltip({ active, payload }: RevenueTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-md">
      <p className="text-xs font-semibold">{data.agent_name}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{formatCurrency(data.revenue)}</span>{" "}
        revenue
      </p>
    </div>
  )
}

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-lg font-semibold">Failed to load analytics</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while fetching analytics data. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ConversionFunnel({ data }: { data: { status: string; count: number }[] }) {
  const funnel = buildFunnel(data)
  const maxCount = Math.max(...funnel.map((item) => item.count), 1)

  if (maxCount === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
        title="No funnel data"
        description="Lead conversion stages will appear here once leads are tracked."
      />
    )
  }

  return (
    <div className="space-y-3">
      {funnel.map((stage, index) => {
        const pctOfMax = (stage.count / maxCount) * 100
        const dropoff =
          index > 0 && funnel[index - 1].count > 0
            ? Math.round((stage.count / funnel[index - 1].count) * 100)
            : null
        return (
          <div key={stage.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.label}</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                {formatNumber(stage.count)}
                {dropoff !== null ? (
                  <span className="text-xs">{dropoff}% of previous</span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  stage.key === "closed_won"
                    ? "bg-emerald-500"
                    : stage.key === "proposal_sent"
                      ? "bg-cyan-500"
                      : stage.key === "interested"
                        ? "bg-green-500"
                        : stage.key === "called"
                          ? "bg-blue-500"
                          : "bg-indigo-500",
                )}
                style={{ width: `${pctOfMax}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RevenueByAgentChart({ data }: { data: AgentPerformance[] }) {
  const sorted = data ? [...data].sort((a, b) => b.revenue - a.revenue) : []

  if (sorted.length === 0 || sorted.every((item) => item.revenue <= 0)) {
    return (
      <EmptyState
        icon={<IndianRupee className="h-8 w-8 text-muted-foreground" />}
        title="No revenue data"
        description="Revenue by agent will appear here once deals are closed."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="agent_name"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-20}
          height={50}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={70}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip content={<RevenueTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {sorted.map((_, index) => (
            <Cell key={index} fill={index === 0 ? "#10b981" : "#34d399"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsPage() {
  const statsQuery = useDashboardStats()
  const salesQuery = useSalesData(12)
  const agentQuery = useAgentPerformance()
  const callsQuery = useCallsPerDay(30)
  const leadStatusQuery = useLeadStatus()

  const isLoading =
    statsQuery.isLoading ||
    salesQuery.isLoading ||
    agentQuery.isLoading ||
    callsQuery.isLoading ||
    leadStatusQuery.isLoading

  const hasError =
    statsQuery.isError ||
    salesQuery.isError ||
    agentQuery.isError ||
    callsQuery.isError ||
    leadStatusQuery.isError

  const retry = () => {
    statsQuery.refetch()
    salesQuery.refetch()
    agentQuery.refetch()
    callsQuery.refetch()
    leadStatusQuery.refetch()
  }

  const stats = statsQuery.data
  const leadStatusData = leadStatusQuery.data ?? []
  const totalLeads = leadStatusData.reduce((sum, item) => sum + item.count, 0)
  const conversionRate =
    totalLeads > 0 ? Math.round(((stats?.deals_closed ?? 0) / totalLeads) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Sales trends, pipeline performance and agent insights (admin view)"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {hasError ? (
        <AnalyticsError onRetry={retry} />
      ) : (
        !isLoading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.monthly_sales ?? 0)}
                icon={IndianRupee}
                description="this month"
                accent="bg-emerald-500/10 text-emerald-500"
              />
              <StatCard
                title="Total Leads"
                value={formatNumber(totalLeads)}
                icon={Users}
                description="all statuses"
                accent="bg-blue-500/10 text-blue-500"
              />
              <StatCard
                title="Closed Deals"
                value={stats?.deals_closed ?? 0}
                icon={HandCoins}
                description="all time"
                accent="bg-purple-500/10 text-purple-500"
              />
              <StatCard
                title="Conversion Rate"
                value={`${conversionRate}%`}
                icon={CheckCircle2}
                description="leads to closed"
                accent="bg-green-500/10 text-green-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Calls per Day (last 30 days)">
                <CallsChart data={callsQuery.data ?? []} />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard title="Monthly Sales">
                  <SalesChart data={salesQuery.data ?? []} />
                </ChartCard>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Conversion Funnel">
                <ConversionFunnel data={leadStatusData} />
              </ChartCard>
              <ChartCard title="Revenue by Agent">
                <RevenueByAgentChart data={agentQuery.data ?? []} />
              </ChartCard>
            </div>

            <ChartCard title="Agent Performance">
              <AgentPerformanceChart data={agentQuery.data ?? []} />
            </ChartCard>
          </>
        )
      )}
    </div>
  )
}