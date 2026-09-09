import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createDeal,
  deleteDeal,
  getDeals,
  updateDeal,
  type DealFilters,
} from "@/services/deal.service"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import type { DealStatus } from "@/types"

export function useDeals(filters: DealFilters) {
  return useQuery({
    queryKey: ["deals", filters],
    queryFn: () => getDeals(filters),
    placeholderData: (previous) => previous,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDeal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({
        title: "Deal created",
        description: "The deal was added to the pipeline.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to create deal",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateDeal>[1] }) =>
      updateDeal(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({
        title: "Deal updated",
        description: "The deal was updated.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update deal",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DealStatus }) =>
      updateDeal(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.business_id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({
        title: "Deal status updated",
        description: "Deal status changed to " + data.status + ".",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update deal",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["business"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast({
        title: "Deal deleted",
        description: "The deal was removed.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to delete deal",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
