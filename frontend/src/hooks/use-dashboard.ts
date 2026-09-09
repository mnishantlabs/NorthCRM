import { useQuery } from "@tanstack/react-query"
import {
  getAgentPerformance,
  getCallsPerDay,
  getDashboardStats,
  getLeadStatus,
  getSalesData,
  getUpcomingFollowups,
} from "@/services/dashboard.service"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  })
}

export function useCallsPerDay(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "calls-per-day", days],
    queryFn: () => getCallsPerDay(days),
  })
}

export function useAgentPerformance() {
  return useQuery({
    queryKey: ["dashboard", "agent-performance"],
    queryFn: getAgentPerformance,
  })
}

export function useSalesData(months = 12) {
  return useQuery({
    queryKey: ["dashboard", "sales-data", months],
    queryFn: () => getSalesData(months),
  })
}

export function useLeadStatus() {
  return useQuery({
    queryKey: ["dashboard", "lead-status"],
    queryFn: getLeadStatus,
  })
}

export function useUpcomingFollowups() {
  return useQuery({
    queryKey: ["dashboard", "upcoming-followups"],
    queryFn: getUpcomingFollowups,
  })
}
