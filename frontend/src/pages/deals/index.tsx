import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Handshake, Loader2, MoreHorizontal, Pencil, Plus, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { CardSkeleton } from "@/components/shared/loading-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DealFormModal } from "@/components/deals/deal-form-modal"
import { useDeals, useUpdateDeal, useDeleteDeal } from "@/hooks/use-deals"
import { formatCurrency, formatDate } from "@/utils/format"
import { DEAL_STATUSES, DEAL_STATUS_LABELS } from "@/utils/constants"
import { cn } from "@/utils/cn"
import type { DealStatus, DealType } from "@/types"

const PER_PAGE = 9

const editDealSchema = z.object({
  estimated_value: z
    .string()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Value must be a number"),
  closing_probability: z
    .string()
    .refine(
      (v) => !v || (Number(v) >= 0 && Number(v) <= 100),
      "Probability must be between 0 and 100",
    ),
  status: z.enum(DEAL_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
})

type EditDealValues = z.infer<typeof editDealSchema>

function EditDealDialog({
  deal,
  open,
  onOpenChange,
}: {
  deal: DealType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateDeal = useUpdateDeal()

  const form = useForm<EditDealValues>({
    resolver: zodResolver(editDealSchema),
    defaultValues: {
      estimated_value: "",
      closing_probability: "",
      status: "prospect",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && deal) {
      form.reset({
        estimated_value: deal.estimated_value != null ? String(deal.estimated_value) : "",
        closing_probability:
          deal.closing_probability != null ? String(deal.closing_probability) : "",
        status: deal.status,
        notes: deal.notes ?? "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal])

  function onSubmit(values: EditDealValues) {
    if (!deal) return
    updateDeal.mutate(
      {
        id: deal.id,
        payload: {
          estimated_value: values.estimated_value
            ? Number(values.estimated_value)
            : null,
          closing_probability: values.closing_probability
            ? Number(values.closing_probability)
            : null,
          status: values.status as DealType["status"],
          notes: values.notes || null,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-muted-foreground" />
            Edit Deal
          </DialogTitle>
          <DialogDescription>
            {deal?.service?.name ?? deal?.service_name ?? "Deal"} —{" "}
            {deal?.business?.business_name ?? deal?.business_name ?? "Business"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {DEAL_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="closing_probability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closing Probability</FormLabel>
                  <FormControl>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium text-foreground">
                      {Number(form.watch("closing_probability") ?? 0)}%
                    </span>
                    <span>100%</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Update deal notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateDeal.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateDeal.isPending}>
                {updateDeal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function DealsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DealType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DealType | null>(null)
  const [tab, setTab] = useState<string>("all")

  const statusFilter = tab === "all" ? undefined : (tab as DealStatus)

  const { data, isLoading } = useDeals({
    page: 1,
    per_page: PER_PAGE,
    status: statusFilter,
    sort_by: "created_at",
    sort_order: "desc",
  })

  const deleteDeal = useDeleteDeal()

  const deals = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your sales pipeline and close more deals"
      >
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create deal
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {DEAL_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {DEAL_STATUS_LABELS[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon={<Handshake className="h-8 w-8 text-muted-foreground" />}
          title="No deals found"
          description={
            tab === "all"
              ? "Create your first deal to start tracking your pipeline."
              : `No deals in the "${DEAL_STATUS_LABELS[statusFilter as DealStatus] ?? tab}" stage.`
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {deal.business ? (
                      <Link
                        to={`/businesses/${deal.business_id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {deal.business.business_name}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">
                        {deal.business_name ?? "Business"}
                      </p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.service?.name ?? deal.service_name ?? "General deal"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Deal actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setEditTarget(deal)}>
                          <Pencil className="h-4 w-4" />
                          Edit deal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(deal)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(deal.estimated_value)}
                  </p>
                  <StatusBadge status={deal.status} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Closing probability
                    </span>
                    <span className="font-medium text-foreground">
                      {deal.closing_probability ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        deal.status === "closed_won"
                          ? "bg-emerald-500"
                          : deal.status === "closed_lost"
                            ? "bg-rose-500"
                            : "bg-blue-500",
                      )}
                      style={{
                        width: `${Math.min(Math.max(deal.closing_probability ?? 0, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created {formatDate(deal.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DealFormModal open={createOpen} onOpenChange={setCreateOpen} />

      <EditDealDialog
        deal={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete deal"
        description="Are you sure you want to delete this deal? This cannot be undone."
        confirmText="Delete"
        destructive
        loading={deleteDeal.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteDeal.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
      />
    </div>
  )
}