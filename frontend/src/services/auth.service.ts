import api from "@/services/api"
import type { UserType } from "@/types"

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
}

export interface LoginResponse extends TokenResponse {
  user: UserType
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string | null
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password })
  return data
}

export async function register(payload: RegisterPayload): Promise<UserType> {
  const { data } = await api.post<UserType>("/auth/register", payload)
  return data
}

export async function me(): Promise<UserType> {
  const { data } = await api.get<UserType>("/auth/me")
  return data
}

export async function refreshToken(token: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/refresh", {
    refresh_token: token,
  })
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}