import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCallLog,
  getBusinessCallLogs,
  getCallLogs,
  type CallLogFilters,
} from "@/services/call-log.service"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"

export function useCallLogs(filters: CallLogFilters) {
  return useQuery({
    queryKey: ["callLogs", filters],
    queryFn: () => getCallLogs(filters),
    placeholderData: (previous) => previous,
  })
}

export function useBusinessCallLogs(businessId: string | undefined, filters?: CallLogFilters) {
  return useQuery({
    queryKey: ["callLogs", "business", businessId, filters],
    queryFn: () => getBusinessCallLogs(businessId as string, filters),
    enabled: !!businessId,
    placeholderData: (previous) => previous,
  })
}

export function useCreateCallLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCallLog,
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["callLogs"] })
      queryClient.invalidateQueries({ queryKey: ["business", payload.business_id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({
        title: "Call logged",
        description: "The call was recorded successfully.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to log call",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
