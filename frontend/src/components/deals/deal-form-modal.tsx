import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Check, ChevronsUpDown, Handshake, Loader2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useServices } from "@/hooks/use-services"
import { useBusinesses } from "@/hooks/use-businesses"
import { useCreateDeal } from "@/hooks/use-deals"
import { DEAL_STATUSES, DEAL_STATUS_LABELS } from "@/utils/constants"
import type { DealType } from "@/types"
import { cn } from "@/utils/cn"

const dealSchema = z.object({
  business_id: z.string().min(1, "Please select a business"),
  service_id: z.string().optional(),
  estimated_value: z
    .string()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Value must be a number"),
  closing_probability: z
    .string()
    .refine(
      (v) => !v || (Number(v) >= 0 && Number(v) <= 100),
      "Probability must be between 0 and 100",
    ),
  status: z.enum(DEAL_STATUSES as [string, ...string[]]).default("prospect"),
  notes: z.string().optional(),
})

type DealValues = z.infer<typeof dealSchema>

interface DealFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  businessName?: string
}

function BusinessField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useBusinesses({ per_page: 50, search: undefined })
  const businesses = data?.items ?? []
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const filtered = search
    ? businesses.filter(
        (b) =>
          b.business_name.toLowerCase().includes(search.toLowerCase()) ||
          (b.owner_name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : businesses

  const selected = businesses.find((b) => b.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">{selected.business_name}</span>
          ) : (
            <span className="text-muted-foreground">Select a business...</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search businesses..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[220px]">
            <CommandEmpty>No business found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.id}
                  onSelect={() => {
                    onChange(b.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === b.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{b.business_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.owner_name ?? b.phone ?? "—"}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function DealFormModal({
  open,
  onOpenChange,
  businessId,
  businessName,
}: DealFormModalProps) {
  const { data: servicesData } = useServices()
  const services = servicesData?.items ?? []
  const createDeal = useCreateDeal()

  const form = useForm<DealValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      business_id: businessId ?? "",
      service_id: "",
      estimated_value: "",
      closing_probability: "",
      status: "prospect",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        business_id: businessId ?? "",
        service_id: "",
        estimated_value: "",
        closing_probability: "",
        status: "prospect",
        notes: "",
      })
    }
  }, [open, businessId, form])

  const probability = Number(form.watch("closing_probability") ?? 0)

  function onSubmit(values: DealValues) {
    createDeal.mutate(
      {
        business_id: values.business_id,
        service_id: values.service_id || null,
        estimated_value: values.estimated_value
          ? Number(values.estimated_value)
          : null,
        closing_probability: values.closing_probability
          ? Number(values.closing_probability)
          : null,
        status: values.status as DealType["status"],
        notes: values.notes || null,
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
            <Handshake className="h-5 w-5 text-muted-foreground" />
            Create Deal
          </DialogTitle>
          <DialogDescription>
            {businessId && businessName
              ? `Add a deal for ${businessName}.`
              : "Add a new deal to the pipeline."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {businessId ? (
              <FormField
                control={form.control}
                name="business_id"
                render={() => (
                  <FormItem>
                    <FormLabel>Business</FormLabel>
                    <FormControl>
                      <Badge variant="secondary" className="h-9 w-full justify-start gap-2 rounded-md px-3 font-normal">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {businessName ?? "Business"}
                      </Badge>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="business_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business *</FormLabel>
                    <FormControl>
                      <BusinessField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="50000" {...field} />
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
                      {probability}%
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
                    <Textarea placeholder="Details about this deal..." {...field} />
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
                disabled={createDeal.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Create deal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}