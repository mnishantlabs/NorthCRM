import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Phone } from "lucide-react"
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
import { BUSINESS_STATUSES, STATUS_LABELS } from "@/utils/constants"
import { useCreateCallLog } from "@/hooks/use-call-logs"
import type { CallLogPayload } from "@/services/call-log.service"

const quickCallSchema = z.object({
  call_date: z.string().min(1, "Call date is required"),
  duration: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Duration must be a number"),
  call_result: z.enum(BUSINESS_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
})

type QuickCallValues = z.infer<typeof quickCallSchema>

interface QuickCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  businessName?: string
}

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function QuickCallModal({
  open,
  onOpenChange,
  businessId,
  businessName,
}: QuickCallModalProps) {
  const createCallLog = useCreateCallLog()

  const form = useForm<QuickCallValues>({
    resolver: zodResolver(quickCallSchema),
    defaultValues: {
      call_date: nowLocal(),
      duration: "",
      call_result: "new",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ call_date: nowLocal(), duration: "", call_result: "new", notes: "" })
    }
  }, [open, form])

  function onSubmit(values: QuickCallValues) {
    createCallLog.mutate(
      {
        business_id: businessId,
        call_date: new Date(values.call_date).toISOString(),
        duration: values.duration ? Number(values.duration) : null,
        call_result: values.call_result as CallLogPayload["call_result"],
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
            <Phone className="h-5 w-5 text-muted-foreground" />
            Log Call
          </DialogTitle>
          <DialogDescription>
            {businessName ? `Record the outcome of your call with ${businessName}.` : "Record the outcome of this call."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="call_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Date &amp; Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="call_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Result</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What happened on this call?" {...field} />
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
                disabled={createCallLog.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCallLog.isPending}>
                {createCallLog.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Log call
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
