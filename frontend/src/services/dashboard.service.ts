import api from "@/services/api"
import type {
  AgentPerformance,
  CallsPerDay,
  DashboardStats,
  FollowUpType,
  LeadStatus,
  SalesData,
} from "@/types"

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/dashboard/stats")
  return data
}

export async function getCallsPerDay(days = 30): Promise<CallsPerDay[]> {
  const { data } = await api.get<CallsPerDay[]>("/dashboard/calls-per-day", {
    params: { days },
  })
  return data
}

export async function getAgentPerformance(): Promise<AgentPerformance[]> {
  const { data } = await api.get<AgentPerformance[]>("/dashboard/agent-performance")
  return data
}

export async function getSalesData(months = 12): Promise<SalesData[]> {
  const { data } = await api.get<SalesData[]>("/dashboard/sales-data", {
    params: { months },
  })
  return data
}

export async function getLeadStatus(): Promise<LeadStatus[]> {
  const { data } = await api.get<LeadStatus[]>("/dashboard/lead-status")
  return data
}

export async function getUpcomingFollowups(): Promise<FollowUpType[]> {
  const { data } = await api.get<FollowUpType[]>("/dashboard/upcoming-followups")
  return data
}