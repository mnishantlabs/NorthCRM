import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type UserFilters,
  type UserPayload,
} from "@/services/user.service"
import type { UserType } from "@/types"

const ACTIVE_FILTERS: UserFilters = { per_page: 100, is_active: true }

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ["users", filters ?? ACTIVE_FILTERS],
    queryFn: () => getUsers(filters ?? ACTIVE_FILTERS),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserPayload> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export type { UserType }