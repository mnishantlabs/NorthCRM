import api from "@/services/api"
import type { PaginatedResponse, ServiceType } from "@/types"

export interface ServiceFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface ServicePayload {
  name: string
  description?: string | null
  is_active?: boolean
}

export async function getServices(
  params?: ServiceFilters,
): Promise<PaginatedResponse<ServiceType>> {
  const { data } = await api.get<PaginatedResponse<ServiceType>>("/services", {
    params,
  })
  return data
}

export async function createService(payload: ServicePayload): Promise<ServiceType> {
  const { data } = await api.post<ServiceType>("/services", payload)
  return data
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload>,
): Promise<ServiceType> {
  const { data } = await api.put<ServiceType>(`/services/${id}`, payload)
  return data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`)
}