import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/cn"

type ToastVariant = "default" | "success" | "destructive"

export interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends ToastProps {
  id: number
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
const listeners = new Set<Listener>()
let idCounter = 0

function emit() {
  listeners.forEach((listener) => listener(items))
}

function dismiss(id: number) {
  items = items.filter((toast) => toast.id !== id)
  emit()
}

function push(props: ToastProps) {
  const id = ++idCounter
  items = [...items, { id, ...props }]
  emit()
  window.setTimeout(() => dismiss(id), 5000)
}

export function toast(props: ToastProps) {
  push(props)
}

export function useToast() {
  return { toast }
}

const variantClasses: Record<ToastVariant, string> = {
  default: "border-border",
  success: "border-emerald-500/40",
  destructive: "border-destructive/50",
}

export function Toaster() {
  const [itemsState, setItemsState] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    const listener: Listener = (next) => setItemsState([...next])
    listeners.add(listener)
    listener(items)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return (
    <div
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2"
    >
      {itemsState.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border bg-background/95 p-4 text-foreground shadow-lg backdrop-blur",
            variantClasses[item.variant ?? "default"],
          )}
        >
          <div className="flex-1 space-y-1">
            {item.title ? (
              <p className="text-sm font-semibold leading-none">{item.title}</p>
            ) : null}
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}