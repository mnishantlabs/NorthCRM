import api from "@/services/api"
import type { BusinessStatus, BusinessType, PaginatedResponse } from "@/types"

export interface BusinessFilters {
  page?: number
  per_page?: number
  search?: string
  status?: BusinessStatus | string
  category?: string
  assigned_agent?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface BusinessPayload {
  business_name: string
  owner_name?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  google_maps_url?: string | null
  category?: string | null
  notes?: string | null
  status?: BusinessStatus
}

export interface ImportResult {
  total: number
  created: number
  duplicates: number
  errors: number
}

export async function getBusinesses(
  params?: BusinessFilters,
): Promise<PaginatedResponse<BusinessType>> {
  const { data } = await api.get<PaginatedResponse<BusinessType>>("/businesses", {
    params,
  })
  return data
}

export async function getBusiness(id: string): Promise<BusinessType> {
  const { data } = await api.get<BusinessType>(`/businesses/${id}`)
  return data
}

export async function createBusiness(payload: BusinessPayload): Promise<BusinessType> {
  const { data } = await api.post<BusinessType>("/businesses", payload)
  return data
}

export async function updateBusiness(
  id: string,
  payload: Partial<BusinessPayload>,
): Promise<BusinessType> {
  const { data } = await api.put<BusinessType>(`/businesses/${id}`, payload)
  return data
}

export async function deleteBusiness(id: string): Promise<void> {
  await api.delete(`/businesses/${id}`)
}

export async function updateBusinessStatus(
  id: string,
  status: BusinessStatus,
): Promise<BusinessType> {
  const { data } = await api.patch<BusinessType>(`/businesses/${id}/status`, {
    status,
  })
  return data
}

export async function assignBusinessAgent(
  id: string,
  agentId: string | null,
): Promise<BusinessType> {
  const { data } = await api.patch<BusinessType>(`/businesses/${id}/assign`, {
    agent_id: agentId,
  })
  return data
}

export async function importBusinesses(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<ImportResult>("/businesses/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export async function exportBusinesses(
  format: "csv" | "xlsx" | "xls" = "csv",
  filters?: BusinessFilters,
): Promise<Blob> {
  const { data } = await api.get<Blob>("/businesses/export", {
    params: { ...filters, format },
    responseType: "blob",
  })
  return data
}