import { type ReactNode } from "react"
import {
  Building2,
  CalendarClock,
  IndianRupee,
  PhoneCall,
  RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/shared/loading-state"
import { StatCard } from "@/components/dashboard/stat-card"
import { CallsChart } from "@/components/dashboard/calls-chart"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { AgentPerformanceChart } from "@/components/dashboard/agent-performance-chart"
import { LeadStatusChart } from "@/components/dashboard/lead-status-chart"
import { UpcomingFollowups } from "@/components/dashboard/upcoming-followups"
import {
  useAgentPerformance,
  useCallsPerDay,
  useDashboardStats,
  useLeadStatus,
  useSalesData,
  useUpcomingFollowups,
} from "@/hooks/use-dashboard"
import { formatCurrency, formatDate } from "@/utils/format"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  return "Good evening"
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-lg font-semibold">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong while fetching your stats. Please try again.
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

export default function DashboardPage() {
  const statsQuery = useDashboardStats()
  const callsQuery = useCallsPerDay(30)
  const agentQuery = useAgentPerformance()
  const salesQuery = useSalesData(12)
  const leadStatusQuery = useLeadStatus()
  const followupsQuery = useUpcomingFollowups()

  const isLoading =
    statsQuery.isLoading ||
    callsQuery.isLoading ||
    agentQuery.isLoading ||
    salesQuery.isLoading ||
    leadStatusQuery.isLoading ||
    followupsQuery.isLoading

  const hasError =
    statsQuery.isError ||
    callsQuery.isError ||
    agentQuery.isError ||
    salesQuery.isError ||
    leadStatusQuery.isError ||
    followupsQuery.isError

  const retry = () => {
    statsQuery.refetch()
    callsQuery.refetch()
    agentQuery.refetch()
    salesQuery.refetch()
    leadStatusQuery.refetch()
    followupsQuery.refetch()
  }

  const interestedClients = statsQuery.data?.interested_clients ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}!`}
        description={`Overview of your sales activity · ${formatDate(new Date().toISOString())}`}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {hasError ? (
        <DashboardError onRetry={retry} />
      ) : (
        !isLoading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Today's Calls"
                value={statsQuery.data?.today_calls ?? 0}
                icon={PhoneCall}
                description="calls today"
                accent="bg-blue-500/10 text-blue-500"
              />
              <StatCard
                title="Callbacks Today"
                value={statsQuery.data?.callbacks_today ?? 0}
                icon={CalendarClock}
                description="scheduled callbacks"
                accent="bg-purple-500/10 text-purple-500"
              />
              <StatCard
                title="Interested Clients"
                value={interestedClients}
                icon={Building2}
                description="active pipeline"
                accent="bg-green-500/10 text-green-500"
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(statsQuery.data?.monthly_sales ?? 0)}
                icon={IndianRupee}
                description="this month"
                accent="bg-emerald-500/10 text-emerald-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartCard title="Calls per Day (last 30 days)">
                  <CallsChart data={callsQuery.data ?? []} />
                </ChartCard>
              </div>
              <div>
                <ChartCard title="Lead Status">
                  <LeadStatusChart data={leadStatusQuery.data ?? []} />
                </ChartCard>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Monthly Sales">
                <SalesChart data={salesQuery.data ?? []} />
              </ChartCard>
              <ChartCard title="Agent Performance">
                <AgentPerformanceChart data={agentQuery.data ?? []} />
              </ChartCard>
            </div>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingFollowups items={followupsQuery.data ?? []} />
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  )
}