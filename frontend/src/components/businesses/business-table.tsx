import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
  Eye,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-state"
import { BusinessForm } from "@/components/businesses/business-form"
import { formatDate, formatPhone } from "@/utils/format"
import { BUSINESS_STATUSES, STATUS_LABELS } from "@/utils/constants"
import {
  useAssignBusinessAgent,
  useDeleteBusiness,
  useUpdateBusinessStatus,
} from "@/hooks/use-businesses"
import { useUsers } from "@/hooks/use-users"
import { useAuthStore } from "@/store/auth-store"
import type { BusinessStatus, BusinessType } from "@/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface BusinessTableProps {
  businesses: BusinessType[]
  loading: boolean
}

export function BusinessTable({ businesses, loading }: BusinessTableProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"

  const { data: usersData } = useUsers()
  const agents = usersData?.items ?? []

  const updateStatus = useUpdateBusinessStatus()
  const assignAgent = useAssignBusinessAgent()
  const deleteBusiness = useDeleteBusiness()

  const [deleteTarget, setDeleteTarget] = useState<BusinessType | null>(null)
  const [editTarget, setEditTarget] = useState<BusinessType | null>(null)

  if (loading) {
    return <TableSkeleton rows={8} />
  }

  if (businesses.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
        title="No businesses found"
        description="Try adjusting your search or filters, or add a new business."
      />
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%]">Business</TableHead>
              <TableHead className="hidden lg:table-cell">Owner</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden xl:table-cell">Website</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              {isAdmin ? (
                <TableHead className="hidden md:table-cell">Agent</TableHead>
              ) : null}
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((business) => (
              <TableRow
                key={business.id}
                className="cursor-pointer"
                onClick={() => navigate(`/businesses/${business.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="text-xs">
                        {getInitials(business.business_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{business.business_name}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">
                        {business.owner_name ?? "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {business.owner_name ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatPhone(business.phone)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {business.website ? (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {business.category ? (
                    <span className="inline-flex rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">
                      {business.category}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {isAdmin ? (
                  <TableCell className="hidden md:table-cell">
                    {business.assigned_agent ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(business.assigned_agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{business.assigned_agent.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                ) : null}
                <TableCell>
                  <StatusBadge status={business.status} />
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                  {formatDate(business.created_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/businesses/${business.id}`)}>
                        <Eye className="h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      {isAdmin ? (
                        <DropdownMenuItem onClick={() => setEditTarget(business)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          Change status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={business.status}
                            onValueChange={(status) =>
                              updateStatus.mutate({
                                id: business.id,
                                status: status as BusinessStatus,
                              })
                            }
                          >
                            {BUSINESS_STATUSES.map((status) => (
                              <DropdownMenuRadioItem key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      {isAdmin ? (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                              <UserRound className="h-4 w-4" />
                              Assign agent
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={business.assigned_agent?.id ?? "unassigned"}
                                onValueChange={(agentId) =>
                                  assignAgent.mutate({
                                    id: business.id,
                                    agentId: agentId === "unassigned" ? null : agentId,
                                  })
                                }
                              >
                                <DropdownMenuRadioItem value="unassigned">
                                  Unassigned
                                </DropdownMenuRadioItem>
                                {agents.map((agent) => (
                                  <DropdownMenuRadioItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(business)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete business"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.business_name}"? This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        destructive
        loading={deleteBusiness.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteBusiness.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
      />

      <BusinessForm
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        business={editTarget}
      />
    </>
  )
}
