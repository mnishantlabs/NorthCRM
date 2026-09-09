import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
} from "@/hooks/use-services"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/utils/format"
import type { ServiceType } from "@/types"

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

function statusBadge(isActive: boolean) {
  return isActive ? (
    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
      Active
    </Badge>
  ) : (
    <Badge className="border-red-500/20 bg-red-500/10 text-red-500">Inactive</Badge>
  )
}

export function ServicesList() {
  const servicesQuery = useServices({ per_page: 100 })
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceType | null>(null)

  const services = servicesQuery.data?.items ?? []

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (formOpen) {
      form.reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
      })
    }
  }, [formOpen, editing, form])

  const formLoading = createService.isPending || updateService.isPending

  async function onSubmit(values: ServiceFormValues) {
    try {
      if (editing) {
        await updateService.mutateAsync({
          id: editing.id,
          payload: { name: values.name, description: values.description || null },
        })
        toast({ title: "Service updated", description: `${values.name} was updated.`, variant: "success" })
      } else {
        await createService.mutateAsync({
          name: values.name,
          description: values.description || null,
        })
        toast({ title: "Service added", description: `${values.name} was added.`, variant: "success" })
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  async function handleToggleActive(service: ServiceType) {
    try {
      await updateService.mutateAsync({
        id: service.id,
        payload: { is_active: !service.is_active },
      })
      toast({
        title: service.is_active ? "Service deactivated" : "Service activated",
        description: `${service.name} is now ${service.is_active ? "inactive" : "active"}.`,
        variant: "success",
      })
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteService.mutateAsync(deleteTarget.id)
      toast({ title: "Service deleted", description: `${deleteTarget.name} was removed.`, variant: "success" })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: "Something went wrong", description: getErrorMessage(err), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {services.length} service{services.length === 1 ? "" : "s"} in your catalog
        </p>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add service
        </Button>
      </div>

      <div className="rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{service.name}</p>
                    {service.description ? (
                      <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{statusBadge(service.is_active)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(service.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(service)
                        setFormOpen(true)
                      }}
                      aria-label="Edit service"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(service)}
                      aria-label={service.is_active ? "Deactivate service" : "Activate service"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(service)}
                      aria-label="Delete service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the service name and description."
                : "Add a new service to your catalog."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Website Design" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What does this service include?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editing ? "Save changes" : "Add service"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
