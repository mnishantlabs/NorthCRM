import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createService,
  deleteService,
  getServices,
  updateService,
  type ServiceFilters,
  type ServicePayload,
} from "@/services/service.service"

const ACTIVE_FILTERS: ServiceFilters = { per_page: 100, is_active: true }

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: ["services", filters ?? ACTIVE_FILTERS],
    queryFn: () => getServices(filters ?? ACTIVE_FILTERS),
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}