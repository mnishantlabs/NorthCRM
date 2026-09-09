import { useState } from "react"
import { useParams } from "react-router-dom"
import {
  Building2,
  CalendarClock,
  Handshake,
  Phone,
  StickyNote,
  UserRound,
  CheckCircle2,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { CardSkeleton } from "@/components/shared/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BusinessDetailHeader } from "@/components/businesses/business-detail-header"
import { BusinessTimeline } from "@/components/businesses/business-timeline"
import { QuickCallModal } from "@/components/calls/quick-call-modal"
import { FollowUpFormModal } from "@/components/follow-ups/follow-up-form-modal"
import { DealFormModal } from "@/components/deals/deal-form-modal"
import { useBusiness } from "@/hooks/use-businesses"
import { useBusinessCallLogs } from "@/hooks/use-call-logs"
import { useFollowUps, useUpdateFollowUpStatus } from "@/hooks/use-follow-ups"
import { useDeals } from "@/hooks/use-deals"
import { useAuthStore } from "@/store/auth-store"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
} from "@/utils/format"
import { FOLLOWUP_STATUS_LABELS } from "@/utils/constants"
import type { FollowUpStatus } from "@/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  const { data: business, isLoading } = useBusiness(id)
  const { data: callLogsData } = useBusinessCallLogs(id)
  const { data: followUpsData } = useFollowUps({ business_id: id, per_page: 50 })
  const { data: dealsData } = useDeals({ business_id: id, per_page: 50 })

  const updateFollowUpStatus = useUpdateFollowUpStatus()

  const [callModalOpen, setCallModalOpen] = useState(false)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [dealModalOpen, setDealModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Details" description="Loading..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Details" description="Business not found" />
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
          title="Business not found"
          description="This business may have been deleted or the link is incorrect."
        />
      </div>
    )
  }

  const callLogs = callLogsData?.items ?? []
  const followUps = followUpsData?.items ?? []
  const deals = dealsData?.items ?? []

  return (
    <div className="space-y-6">
      <BusinessDetailHeader business={business} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Actions</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setCallModalOpen(true)}
                  className="gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Log Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFollowUpModalOpen(true)}
                  className="gap-2"
                >
                  <CalendarClock className="h-4 w-4" />
                  Schedule Follow-up
                </Button>
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDealModalOpen(true)}
                    className="gap-2"
                  >
                    <Handshake className="h-4 w-4" />
                    Create Deal
                  </Button>
                ) : null}
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calls">
                Call Logs ({callLogs.length})
              </TabsTrigger>
              <TabsTrigger value="followups">
                Follow-ups ({followUps.length})
              </TabsTrigger>
              <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <BusinessTimeline
                callLogs={callLogs}
                followUps={followUps}
                deals={deals}
              />
            </TabsContent>

            <TabsContent value="calls" className="mt-4">
              {callLogs.length === 0 ? (
                <EmptyState
                  icon={<Phone className="h-8 w-8 text-muted-foreground" />}
                  title="No calls logged"
                  description="Log your first call for this business to start tracking."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="w-[40%]">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callLogs.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(call.call_date)}
                          </TableCell>
                          <TableCell>{call.agent?.name ?? "—"}</TableCell>
                          <TableCell>
                            {call.duration != null ? `${call.duration} min` : "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={call.call_result} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {call.notes ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="followups" className="mt-4">
              {followUps.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock className="h-8 w-8 text-muted-foreground" />}
                  title="No follow-ups scheduled"
                  description="Schedule a follow-up to stay on top of this lead."
                />
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu) => (
                    <Card key={fu.id} className="shadow-sm">
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatDateTime(fu.followup_date)}
                          </p>
                          {fu.notes ? (
                            <p className="text-sm text-muted-foreground">{fu.notes}</p>
                          ) : null}
                          {fu.agent ? (
                            <p className="text-xs text-muted-foreground">
                              Assigned to {fu.agent.name}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={fu.status} label={FOLLOWUP_STATUS_LABELS[fu.status]} />
                          {fu.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={updateFollowUpStatus.isPending}
                              onClick={() =>
                                updateFollowUpStatus.mutate({
                                  id: fu.id,
                                  status: "completed" as FollowUpStatus,
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark complete
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              {deals.length === 0 ? (
                <EmptyState
                  icon={<Handshake className="h-8 w-8 text-muted-foreground" />}
                  title="No deals"
                  description="Create a deal for this business to track it in the pipeline."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {deals.map((deal) => (
                    <Card key={deal.id} className="shadow-sm">
                      <CardContent className="space-y-2 pt-5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {deal.service?.name ?? "General deal"}
                          </p>
                          <StatusBadge status={deal.status} />
                        </div>
                        <p className="text-xl font-bold">
                          {formatCurrency(deal.estimated_value)}
                        </p>
                        {deal.closing_probability != null ? (
                          <p className="text-xs text-muted-foreground">
                            {deal.closing_probability}% closing probability
                          </p>
                        ) : null}
                        {deal.notes ? (
                          <p className="text-sm text-muted-foreground">{deal.notes}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(deal.created_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className="block transition-colors hover:text-primary"
                >
                  <ContactRow icon={<Phone className="h-4 w-4" />}>
                    {formatPhone(business.phone)}
                  </ContactRow>
                </a>
              ) : null}
              {business.email ? (
                <a
                  href={`mailto:${business.email}`}
                  className="block transition-colors hover:text-primary"
                >
                  <ContactRow icon={<Building2 className="h-4 w-4" />}>
                    {business.email}
                  </ContactRow>
                </a>
              ) : null}
              {business.owner_name ? (
                <ContactRow icon={<UserRound className="h-4 w-4" />}>
                  {business.owner_name}
                </ContactRow>
              ) : null}
              {business.address || business.city ? (
                <ContactRow icon={<Building2 className="h-4 w-4" />}>
                  {[business.address, business.city, business.state, business.country]
                    .filter(Boolean)
                    .join(", ")}
                </ContactRow>
              ) : null}
              {!business.phone &&
              !business.email &&
              !business.owner_name &&
              !business.address ? (
                <p className="text-sm text-muted-foreground">No contact details yet.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Assigned Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {business.assigned_agent ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="text-sm">
                      {getInitials(business.assigned_agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{business.assigned_agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {business.assigned_agent.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No agent assigned.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {business.notes ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {business.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No notes added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickCallModal
        open={callModalOpen}
        onOpenChange={setCallModalOpen}
        businessId={business.id}
        businessName={business.business_name}
      />
      <FollowUpFormModal
        open={followUpModalOpen}
        onOpenChange={setFollowUpModalOpen}
        businessId={business.id}
        businessName={business.business_name}
      />
      {isAdmin ? (
        <DealFormModal
          open={dealModalOpen}
          onOpenChange={setDealModalOpen}
          businessId={business.id}
          businessName={business.business_name}
        />
      ) : null}
    </div>
  )
}