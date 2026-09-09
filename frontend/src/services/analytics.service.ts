import api from "@/services/api"

export interface AnalyticsOverviewParams {
  date_from?: string
  date_to?: string
}

export interface ConversionFunnelStage {
  stage: string
  count: number
}

export interface RevenueByServiceItem {
  service_name: string
  revenue: number
}

export async function getAnalyticsOverview(
  params?: AnalyticsOverviewParams,
): Promise<unknown> {
  const { data } = await api.get<unknown>("/analytics/overview", { params })
  return data
}

export async function getConversionFunnel(): Promise<ConversionFunnelStage[]> {
  const { data } = await api.get<ConversionFunnelStage[]>("/analytics/conversion-funnel")
  return data
}

export async function getRevenueByService(): Promise<RevenueByServiceItem[]> {
  const { data } = await api.get<RevenueByServiceItem[]>("/analytics/revenue-by-service")
  return data
}
