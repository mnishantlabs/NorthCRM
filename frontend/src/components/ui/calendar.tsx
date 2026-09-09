import * as React from "react"
import { cn } from "@/utils/cn"
import { Input } from "@/components/ui/input"

export type CalendarProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>

const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        className={cn("w-fit", className)}
        {...props}
      />
    )
  },
)
Calendar.displayName = "Calendar"

export { Calendar }