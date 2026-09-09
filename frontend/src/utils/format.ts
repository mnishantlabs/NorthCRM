import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"

const EMPTY = "—"

function parseDate(date: string | null | undefined): Date | null {
  if (!date) return null
  const parsed = parseISO(date)
  return isValid(parsed) ? parsed : null
}

export function formatDate(date: string | null | undefined): string {
  const parsed = parseDate(date)
  return parsed ? format(parsed, "MMM d, yyyy") : EMPTY
}

export function formatDateTime(date: string | null | undefined): string {
  const parsed = parseDate(date)
  return parsed ? format(parsed, "MMM d, yyyy HH:mm") : EMPTY
}

export function formatCurrency(
  amount: number | string | null | undefined,
  decimals = 0,
): string {
  if (amount === null || amount === undefined || amount === "") return EMPTY
  const value = typeof amount === "string" ? Number(amount) : amount
  if (Number.isNaN(value)) return EMPTY
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY
  const parsed = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(parsed)) return EMPTY
  return new Intl.NumberFormat("en-IN").format(parsed)
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return EMPTY
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith("91"))
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  return phone
}

export function relativeTime(date: string | null | undefined): string {
  const parsed = parseDate(date)
  return parsed ? formatDistanceToNow(parsed, { addSuffix: true }) : EMPTY
}