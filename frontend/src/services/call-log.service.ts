import api from "@/services/api"
import type { BusinessStatus, CallLogType, PaginatedResponse } from "@/types"

export interface CallLogFilters {
  page?: number
  per_page?: number
  business_id?: string
  agent_id?: string
  date_from?: string
  date_to?: string
  result?: BusinessStatus | string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface CallLogPayload {
  business_id: string
  call_date: string
  duration?: number | null
  call_result: BusinessStatus
  notes?: string | null
}

export async function getCallLogs(
  params?: CallLogFilters,
): Promise<PaginatedResponse<CallLogType>> {
  const { data } = await api.get<PaginatedResponse<CallLogType>>("/call-logs", {
    params,
  })
  return data
}

export async function createCallLog(payload: CallLogPayload): Promise<CallLogType> {
  const { data } = await api.post<CallLogType>("/call-logs", payload)
  return data
}

export async function getBusinessCallLogs(
  businessId: string,
  params?: CallLogFilters,
): Promise<PaginatedResponse<CallLogType>> {
  const { data } = await api.get<PaginatedResponse<CallLogType>>(
    `/call-logs/business/${businessId}`,
    { params },
  )
  return data
}

export async function updateCallLog(
  id: string,
  payload: Partial<CallLogPayload>,
): Promise<CallLogType> {
  const { data } = await api.put<CallLogType>(`/call-logs/${id}`, payload)
  return data
}

export async function deleteCallLog(id: string): Promise<void> {
  await api.delete(`/call-logs/${id}`)
}