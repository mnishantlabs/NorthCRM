import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  BUSINESS_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/utils/constants"
import { useCreateBusiness, useUpdateBusiness } from "@/hooks/use-businesses"
import type { BusinessType } from "@/types"
import type { BusinessPayload } from "@/services/business.service"
import { cn } from "@/utils/cn"

const businessSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  owner_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  google_maps_url: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(BUSINESS_STATUSES as [string, ...string[]]).optional(),
})

type BusinessFormValues = z.infer<typeof businessSchema>

interface BusinessFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business?: BusinessType | null
  onSuccess?: () => void
}

function toFormValues(business?: BusinessType | null): BusinessFormValues {
  return {
    business_name: business?.business_name ?? "",
    owner_name: business?.owner_name ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
    website: business?.website ?? "",
    address: business?.address ?? "",
    city: business?.city ?? "",
    state: business?.state ?? "",
    country: business?.country ?? "",
    google_maps_url: business?.google_maps_url ?? "",
    category: business?.category ?? "",
    notes: business?.notes ?? "",
    status: business?.status ?? "new",
  }
}

export function BusinessForm({ open, onOpenChange, business, onSuccess }: BusinessFormProps) {
  const createMutation = useCreateBusiness()
  const updateMutation = useUpdateBusiness()
  const mode: "create" | "edit" = business ? "edit" : "create"

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: toFormValues(business),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(business))
    }
  }, [open, business, form])

  const submitLoading = createMutation.isPending || updateMutation.isPending

  function onSubmit(values: BusinessFormValues) {
    const payload: BusinessPayload = {
      business_name: values.business_name,
      owner_name: values.owner_name || null,
      phone: values.phone || null,
      email: values.email || null,
      website: values.website || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      country: values.country || null,
      google_maps_url: values.google_maps_url || null,
      category: values.category || null,
      notes: values.notes || null,
      status: (values.status ?? "new") as BusinessType["status"],
    }

    if (mode === "edit" && business) {
      updateMutation.mutate(
        { id: business.id, payload },
        { onSuccess: () => { onOpenChange(false); onSuccess?.() } },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { onOpenChange(false); onSuccess?.() },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            {mode === "edit" ? "Edit Business" : "Add Business"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the business details below."
              : "Enter the business details to add a new lead."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Retail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Maharashtra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="google_maps_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              <span
                                className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_COLORS[status])}
                              >
                                {STATUS_LABELS[status]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any internal notes about this business..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {mode === "edit" ? "Save changes" : "Create business"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
