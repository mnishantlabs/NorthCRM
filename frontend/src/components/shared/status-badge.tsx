import { Badge } from "@/components/ui/badge"
import {
  STATUS_COLOR_MAP,
  STATUS_LABEL_MAP,
} from "@/utils/constants"
import { cn } from "@/utils/cn"

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const color = STATUS_COLOR_MAP[status] ?? "bg-gray-500/10 text-gray-500 border-gray-500/20"
  const text = label ?? STATUS_LABEL_MAP[status] ?? status
  return (
    <Badge variant="outline" className={cn(color, className)}>
      {text}
    </Badge>
  )
}