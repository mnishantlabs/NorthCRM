import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  assignBusinessAgent,
  createBusiness,
  deleteBusiness,
  exportBusinesses,
  getBusiness,
  getBusinesses,
  importBusinesses,
  updateBusiness,
  updateBusinessStatus,
  type BusinessFilters,
} from "@/services/business.service"
import { getErrorMessage } from "@/services/api"
import { toast } from "@/components/ui/toast"
import type { BusinessStatus } from "@/types"

export function useBusinesses(filters: BusinessFilters) {
  return useQuery({
    queryKey: ["businesses", filters],
    queryFn: () => getBusinesses(filters),
    placeholderData: (previous) => previous,
  })
}

export function useBusiness(id: string | undefined) {
  return useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusiness(id as string),
    enabled: !!id,
  })
}

export function useCreateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBusiness,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      toast({
        title: "Business created",
        description: `"${data.business_name}" was added successfully.`,
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to create business",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateBusiness>[1] }) =>
      updateBusiness(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.id] })
      toast({
        title: "Business updated",
        description: "The business has been updated.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update business",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBusiness,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.removeQueries({ queryKey: ["business", id] })
      toast({
        title: "Business deleted",
        description: "The business was removed.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to delete business",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateBusinessStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BusinessStatus }) =>
      updateBusinessStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.id] })
      toast({
        title: "Status updated",
        description: `Business status changed to "${data.status}".`,
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update status",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useAssignBusinessAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string | null }) =>
      assignBusinessAgent(id, agentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      queryClient.invalidateQueries({ queryKey: ["business", data.id] })
      toast({
        title: "Agent assigned",
        description: "The business assignment has been updated.",
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to assign agent",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useImportBusinesses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importBusinesses,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] })
      toast({
        title: "Import complete",
        description: `${result.created} created, ${result.duplicates} duplicates, ${result.errors} errors.`,
        variant: "success",
      })
    },
    onError: (err) => {
      toast({
        title: "Import failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useExportBusinesses() {
  return async (filters: BusinessFilters) => {
    try {
      const blob = await exportBusinesses("csv", filters)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "businesses.csv"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: "Export complete",
        description: "Businesses were exported to CSV.",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Export failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    }
  }
}
