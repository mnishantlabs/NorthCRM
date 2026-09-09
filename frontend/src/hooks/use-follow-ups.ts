import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createFollowUp,
  deleteFollowUp,
  getFollowUps,
  getTodayFollowUps,
  updateFollowUp,
  updateFollowUpStatus,
  type FollowUpFilters,
} from "@/services/follow-up.service"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import type { FollowUpStatus } from "@/types"

export function useFollowUps(filters: FollowUpFilters) {
  return useQuery({
    queryKey: ["followUps", filters],
    queryFn: () => getFollowUps(filters),
    placeholderData: (previous) => previous,
  })
}

export function useTodayFollowUps() {
  return useQuery({
    queryKey: ["followUps", "today"],
    queryFn: getTodayFollowUps,
  })
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFollowUp,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["followUps", "today"] })
      toast({
        title: "Follow-up scheduled",
        description: "The follow-up was created.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to schedule follow-up",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateFollowUp>[1] }) =>
      updateFollowUp(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["followUps", "today"] })
      toast({
        title: "Follow-up updated",
        description: "The follow-up was updated.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update follow-up",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateFollowUpStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FollowUpStatus }) =>
      updateFollowUpStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["followUps", "today"] })
      toast({
        title: "Follow-up updated",
        description: "Status changed to " + data.status + ".",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update follow-up",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] })
      queryClient.invalidateQueries({ queryKey: ["followUps", "today"] })
      queryClient.invalidateQueries({ queryKey: ["business"] })
      toast({
        title: "Follow-up deleted",
        description: "The follow-up was removed.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to delete follow-up",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
