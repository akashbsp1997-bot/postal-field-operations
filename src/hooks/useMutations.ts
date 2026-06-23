import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { toast } from "sonner";

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: db.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => db.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: db.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale logged successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: db.createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Delivery status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: db.createFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      toast.success("Follow-up created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateDeliveryProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: db.createDeliveryProof,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => db.updateFollowup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      toast.success("Follow-up updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
