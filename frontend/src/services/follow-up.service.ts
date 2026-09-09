import api from "@/services/api"
import type { FollowUpStatus, FollowUpType, PaginatedResponse } from "@/types"

export interface FollowUpFilters {
  page?: number
  per_page?: number
  status?: FollowUpStatus | string
  business_id?: string
  agent_id?: string
  date_from?: string
  date_to?: string
}

export interface FollowUpPayload {
  business_id: string
  agent_id: string
  followup_date: string
  status?: FollowUpStatus
  notes?: string | null
}

export async function getFollowUps(
  params?: FollowUpFilters,
): Promise<PaginatedResponse<FollowUpType>> {
  const { data } = await api.get<PaginatedResponse<FollowUpType>>("/follow-ups", {
    params,
  })
  return data
}

export async function getTodayFollowUps(): Promise<FollowUpType[]> {
  const { data } = await api.get<FollowUpType[]>("/follow-ups/today")
  return data
}

export async function createFollowUp(payload: FollowUpPayload): Promise<FollowUpType> {
  const { data } = await api.post<FollowUpType>("/follow-ups", payload)
  return data
}

export async function updateFollowUp(
  id: string,
  payload: Partial<FollowUpPayload>,
): Promise<FollowUpType> {
  const { data } = await api.put<FollowUpType>(`/follow-ups/${id}`, payload)
  return data
}

export async function updateFollowUpStatus(
  id: string,
  status: FollowUpStatus,
): Promise<FollowUpType> {
  const { data } = await api.patch<FollowUpType>(`/follow-ups/${id}/status`, {
    status,
  })
  return data
}

export async function deleteFollowUp(id: string): Promise<void> {
  await api.delete(`/follow-ups/${id}`)
}