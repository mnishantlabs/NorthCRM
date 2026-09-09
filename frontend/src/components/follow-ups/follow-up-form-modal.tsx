import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, CalendarClock, Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import { useBusinesses } from "@/hooks/use-businesses"
import { useCreateFollowUp } from "@/hooks/use-follow-ups"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/utils/cn"

const followUpSchema = z.object({
  business_id: z.string().min(1, "Please select a business"),
  followup_date: z.string().min(1, "Follow-up date is required"),
  notes: z.string().optional(),
})

type FollowUpValues = z.infer<typeof followUpSchema>

interface FollowUpFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  businessName?: string
}

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
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

export function FollowUpFormModal({
  open,
  onOpenChange,
  businessId,
  businessName,
}: FollowUpFormModalProps) {
  const user = useAuthStore((s) => s.user)
  const createFollowUp = useCreateFollowUp()

  const form = useForm<FollowUpValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      business_id: businessId ?? "",
      followup_date: nowLocal(),
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        business_id: businessId ?? "",
        followup_date: nowLocal(),
        notes: "",
      })
    }
  }, [open, businessId, form])

  function onSubmit(values: FollowUpValues) {
    if (!user) return
    createFollowUp.mutate(
      {
        business_id: values.business_id,
        agent_id: user.id,
        followup_date: new Date(values.followup_date).toISOString(),
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
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            Schedule Follow-up
          </DialogTitle>
          <DialogDescription>
            {businessId && businessName
              ? `Schedule a follow-up with ${businessName}.`
              : "Schedule a follow-up for a business."}
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
              name="followup_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date &amp; Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Context for this follow-up..." {...field} />
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
                disabled={createFollowUp.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFollowUp.isPending}>
                {createFollowUp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}