import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CalendarClock, CheckCircle2, Plus, Trash2, XCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-state"
import { Pagination } from "@/components/shared/pagination"
import { StatusBadge } from "@/components/shared/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FollowUpFormModal } from "@/components/follow-ups/follow-up-form-modal"
import {
  useFollowUps,
  useTodayFollowUps,
  useUpdateFollowUpStatus,
  useDeleteFollowUp,
} from "@/hooks/use-follow-ups"
import { useAuthStore } from "@/store/auth-store"
import { formatDateTime } from "@/utils/format"
import { FOLLOWUP_STATUS_LABELS } from "@/utils/constants"
import type { FollowUpFilters } from "@/services/follow-up.service"
import type { FollowUpStatus, FollowUpType } from "@/types"

const PER_PAGE = 8

export default function FollowUpsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const agentId = user?.id

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FollowUpType | null>(null)

  const page = Number(searchParams.get("page") ?? "1")
  const tab = searchParams.get("tab") ?? "all"

  const statusFilter = tab === "pending" ? "pending" : undefined

  const filters: FollowUpFilters = {
    page,
    per_page: PER_PAGE,
    agent_id: agentId,
    status: statusFilter,
  }

  const { data, isLoading } = useFollowUps(filters)
  const { data: todayData, isLoading: todayLoading } = useTodayFollowUps()
  const updateFollowUpStatus = useUpdateFollowUpStatus()
  const deleteFollowUp = useDeleteFollowUp()

  const todayItems = todayData ?? []

  function updateParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "") {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    next.delete("page")
    setSearchParams(next)
  }

  function changeTab(value: string) {
    updateParams({ tab: value === "all" ? undefined : value })
  }

  function markDone(fu: FollowUpType) {
    updateFollowUpStatus.mutate({ id: fu.id, status: "completed" as FollowUpStatus })
  }

  const followUps = tab === "today" ? todayItems : (data?.items ?? [])
  const followUpsLoading = isLoading || todayLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Schedule and manage callbacks and meetings"
      >
        <Button onClick={() => setScheduleOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule follow-up
        </Button>
      </PageHeader>

      {todayItems.length > 0 && tab !== "today" ? (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            Today&apos;s follow-ups
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {todayItems.map((fu) => (
              <Card
                key={fu.id}
                className="border-primary/30 bg-primary/[0.03] shadow-sm"
              >
                <CardContent className="space-y-2 pt-5">
                  <div className="flex items-center justify-between gap-2">
                    {fu.business ? (
                      <Link
                        to={`/businesses/${fu.business_id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {fu.business.business_name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {fu.business_name ?? "Business"}
                      </span>
                    )}
                    <StatusBadge status={fu.status} label={FOLLOWUP_STATUS_LABELS[fu.status]} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(fu.followup_date)}
                  </p>
                  {fu.notes ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {fu.notes}
                    </p>
                  ) : null}
                  {fu.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      disabled={updateFollowUpStatus.isPending}
                      onClick={() => markDone(fu)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark completed
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {followUpsLoading ? (
        <TableSkeleton rows={6} />
      ) : followUps.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8 text-muted-foreground" />}
          title="No follow-ups found"
          description={
            tab === "today"
              ? "No follow-ups scheduled for today."
              : tab === "pending"
                ? "No pending follow-ups."
                : "Schedule a follow-up to stay on top of your leads."
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {followUps.map((fu) => (
              <Card key={fu.id} className="shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {fu.business ? (
                        <Link
                          to={`/businesses/${fu.business_id}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {fu.business.business_name}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium">
                          {fu.business_name ?? "Business"}
                        </span>
                      )}
                      <StatusBadge
                        status={fu.status}
                        label={FOLLOWUP_STATUS_LABELS[fu.status]}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(fu.followup_date)}
                      {fu.agent ? ` — ${fu.agent.name}` : ""}
                    </p>
                    {fu.notes ? (
                      <p className="text-sm text-muted-foreground">{fu.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {fu.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={updateFollowUpStatus.isPending}
                        onClick={() => markDone(fu)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </Button>
                    ) : null}
                    {fu.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        disabled={updateFollowUpStatus.isPending}
                        onClick={() =>
                          updateFollowUpStatus.mutate({
                            id: fu.id,
                            status: "cancelled" as FollowUpStatus,
                          })
                        }
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(fu)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tab !== "today" ? (
            <Pagination
                page={data?.page ?? 1}
                pages={data?.pages ?? 1}
                total={data?.total ?? 0}
                perPage={PER_PAGE}
                onChange={(nextPage) => updateParams({ page: String(nextPage) })}
              />
          ) : null}
        </>
      )}

      <FollowUpFormModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete follow-up"
        description="Are you sure you want to delete this follow-up? This cannot be undone."
        confirmText="Delete"
        destructive
        loading={deleteFollowUp.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteFollowUp.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
      />
    </div>
  )
}