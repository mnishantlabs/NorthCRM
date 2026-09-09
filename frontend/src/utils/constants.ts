import type {
  BusinessStatus,
  DealStatus,
  FollowUpStatus,
  ServiceType,
  UserRole,
} from "@/types"

export const BUSINESS_STATUSES: BusinessStatus[] = [
  "new",
  "called",
  "busy",
  "interested",
  "not_interested",
  "no_answer",
  "callback",
  "meeting_scheduled",
  "proposal_sent",
  "closed_won",
  "closed_lost",
  "spam",
]

export const STATUS_LABELS: Record<BusinessStatus, string> = {
  new: "New",
  called: "Called",
  busy: "Busy",
  interested: "Interested",
  not_interested: "Not Interested",
  no_answer: "No Answer",
  callback: "Callback",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  spam: "Spam",
}

export const STATUS_COLORS: Record<BusinessStatus, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  called: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  busy: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  interested: "bg-green-500/10 text-green-500 border-green-500/20",
  not_interested: "bg-red-500/10 text-red-500 border-red-500/20",
  no_answer: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  callback: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  meeting_scheduled: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  proposal_sent: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  closed_won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed_lost: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  spam: "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

export const DEAL_STATUSES: DealStatus[] = [
  "prospect",
  "negotiation",
  "proposal",
  "closed_won",
  "closed_lost",
]

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  prospect: "Prospect",
  negotiation: "Negotiation",
  proposal: "Proposal",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
}

export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  prospect: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  negotiation: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  proposal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  closed_won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed_lost: "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

export const FOLLOWUP_STATUSES: FollowUpStatus[] = [
  "pending",
  "completed",
  "missed",
  "cancelled",
]

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
}

export const FOLLOWUP_STATUS_COLORS: Record<FollowUpStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  missed: "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export const STATUS_COLOR_MAP: Record<string, string> = {
  ...STATUS_COLORS,
  ...DEAL_STATUS_COLORS,
  ...FOLLOWUP_STATUS_COLORS,
}

export const STATUS_LABEL_MAP: Record<string, string> = {
  ...STATUS_LABELS,
  ...DEAL_STATUS_LABELS,
  ...FOLLOWUP_STATUS_LABELS,
}

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "agent", label: "Agent" },
]

export const DEFAULT_SERVICES: Omit<ServiceType, "created_at" | "id">[] = [
  {
    name: "Website Design & Development",
    description: "Custom business websites with modern design and mobile responsiveness.",
    is_active: true,
  },
  {
    name: "Search Engine Optimization (SEO)",
    description: "Improve search rankings and drive organic traffic to your business.",
    is_active: true,
  },
  {
    name: "Social Media Marketing",
    description: "Managed social media campaigns and content across major platforms.",
    is_active: true,
  },
  {
    name: "Google Business Profile Optimization",
    description: "Setup and optimization of Google Business Profile for local visibility.",
    is_active: true,
  },
  {
    name: "Pay-Per-Click Advertising",
    description: "Google Ads and paid campaigns managed for maximum ROI.",
    is_active: true,
  },
  {
    name: "Email Marketing & Automation",
    description: "Newsletter campaigns, drip sequences and email automation flows.",
    is_active: true,
  },
  {
    name: "Lead Generation Services",
    description: "Structured outbound calling and lead qualification campaigns.",
    is_active: true,
  },
  {
    name: "Brand Identity & Logo Design",
    description: "Complete brand identity including logos, colors and brand guidelines.",
    is_active: true,
  },
  {
    name: "Content Writing & Blogging",
    description: "SEO-friendly content, blogs and website copywriting services.",
    is_active: true,
  },
  {
    name: "CRM Setup & Support",
    description: "CRM implementation, data import and ongoing support for your team.",
    is_active: true,
  },
]