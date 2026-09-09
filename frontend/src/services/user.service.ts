import api from "@/services/api"
import type { PaginatedResponse, UserRole, UserType } from "@/types"

export interface UserFilters {
  page?: number
  per_page?: number
  search?: string
  role?: UserRole
  is_active?: boolean
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface UserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  phone?: string | null
  is_active?: boolean
}

export async function getUsers(
  params?: UserFilters,
): Promise<PaginatedResponse<UserType>> {
  const { data } = await api.get<PaginatedResponse<UserType>>("/users", { params })
  return data
}

export async function createUser(payload: UserPayload): Promise<UserType> {
  const { data } = await api.post<UserType>("/users", payload)
  return data
}

export async function updateUser(
  id: string,
  payload: Partial<UserPayload>,
): Promise<UserType> {
  const { data } = await api.put<UserType>(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}