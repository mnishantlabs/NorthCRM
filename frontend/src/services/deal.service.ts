import api from "@/services/api"
import type { DealStatus, DealType, PaginatedResponse } from "@/types"

export interface DealFilters {
  page?: number
  per_page?: number
  status?: DealStatus | string
  business_id?: string
  agent_id?: string
  service_id?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface DealPayload {
  business_id: string
  service_id?: string | null
  estimated_value?: string | number | null
  closing_probability?: number | null
  status?: DealStatus
  notes?: string | null
}

export async function getDeals(
  params?: DealFilters,
): Promise<PaginatedResponse<DealType>> {
  const { data } = await api.get<PaginatedResponse<DealType>>("/deals", { params })
  return data
}

export async function getDeal(id: string): Promise<DealType> {
  const { data } = await api.get<DealType>(`/deals/${id}`)
  return data
}

export async function createDeal(payload: DealPayload): Promise<DealType> {
  const { data } = await api.post<DealType>("/deals", payload)
  return data
}

export async function updateDeal(
  id: string,
  payload: Partial<DealPayload>,
): Promise<DealType> {
  const { data } = await api.put<DealType>(`/deals/${id}`, payload)
  return data
}

export async function deleteDeal(id: string): Promise<void> {
  await api.delete(`/deals/${id}`)
}