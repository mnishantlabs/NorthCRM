import { useQuery } from "@tanstack/react-query"
import {
  getAnalyticsOverview,
  getConversionFunnel,
  getRevenueByService,
  type AnalyticsOverviewParams,
} from "@/services/analytics.service"

export function useAnalyticsOverview(params?: AnalyticsOverviewParams) {
  return useQuery({
    queryKey: ["analytics", "overview", params],
    queryFn: () => getAnalyticsOverview(params),
  })
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ["analytics", "funnel"],
    queryFn: getConversionFunnel,
  })
}

export function useRevenueByService() {
  return useQuery({
    queryKey: ["analytics", "revenue-by-service"],
    queryFn: getRevenueByService,
  })
}
