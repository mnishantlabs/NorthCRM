import { useSearchParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { Phone } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-state"
import { Pagination } from "@/components/shared/pagination"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCallLogs } from "@/hooks/use-call-logs"
import { useUsers } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"
import { formatDateTime } from "@/utils/format"
import type { CallLogFilters } from "@/services/call-log.service"

const PER_PAGE = 10

export default function CallsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  const { data: usersData } = useUsers()
  const agents = usersData?.items ?? []

  const page = Number(searchParams.get("page") ?? "1")
  const agent = searchParams.get("agent") ?? undefined

  const filters: CallLogFilters = {
    page,
    per_page: PER_PAGE,
    agent_id: agent,
    sort_by: "call_date",
    sort_order: "desc",
  }

  const { data, isLoading } = useCallLogs(filters)

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs"
        description="Track every outbound call, its outcome and notes"
      />

      {isAdmin ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={agent ?? "all"}
              onValueChange={(value) =>
                updateParams({ agent: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-[35%]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      {call.business ? (
                        <Link
                          to={`/businesses/${call.business_id}`}
                          className="font-medium hover:underline"
                        >
                          {call.business.business_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {call.agent?.name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(call.call_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
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
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            perPage={PER_PAGE}
            onChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        </>
      ) : (
        <EmptyState
          icon={<Phone className="h-8 w-8 text-muted-foreground" />}
          title="No call logs yet"
          description="Calls logged against businesses will appear here."
        />
      )}
    </div>
  )
}