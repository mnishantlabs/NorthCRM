import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import { useAuthStore } from "@/store/auth-store"

let rawUrl = import.meta.env.VITE_API_URL || "https://northcrm.onrender.com/api/v1"
if (rawUrl.startsWith("s://")) {
  rawUrl = "http" + rawUrl
} else if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("/")) {
  rawUrl = "https://" + rawUrl
}
const BASE_URL = rawUrl

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

interface RefreshResponse {
  access_token: string
  refresh_token: string
}

let isRefreshing = false
let subscribers: ((token: string | null) => void)[] = []

function onRefreshed(token: string | null) {
  subscribers.forEach((cb) => cb(token))
  subscribers = []
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    const auth = useAuthStore.getState()

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribers.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          } else {
            reject(error)
          }
        })
      })
    }

    original._retry = true
    isRefreshing = true

    if (!auth.refreshToken) {
      isRefreshing = false
      onRefreshed(null)
      auth.logout()
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post<RefreshResponse>(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: auth.refreshToken },
        { headers: { "Content-Type": "application/json" } },
      )
      auth.setTokens(data.access_token, data.refresh_token)
      onRefreshed(data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshError) {
      onRefreshed(null)
      auth.logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === "string" && data) return data
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>
      if (typeof record.detail === "string") return record.detail
      if (Array.isArray(record.detail)) {
        return record.detail
          .map((item: { msg?: string }) => item?.msg || String(item))
          .filter(Boolean)
          .join(", ")
      }
      const messages: string[] = []
      for (const key of Object.keys(record)) {
        const value = record[key]
        if (Array.isArray(value)) {
          messages.push(...value.filter((v): v is string => typeof v === "string"))
        } else if (typeof value === "string") {
          messages.push(value)
        }
      }
      if (messages.length > 0) return messages.join(", ")
    }
    if (err.code === "ECONNABORTED") return "Request timed out. Please try again."
    if (!err.response) return "Network error. Please check your connection."
    return err.message
  }
  return err instanceof Error ? err.message : "Something went wrong"
}

export { BASE_URL }
export default api