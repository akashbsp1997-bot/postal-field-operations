import { useQuery } from "@tanstack/react-query";
import * as db from "@/lib/db";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: db.getDashboardStats,
  });
}

export function useAreas(officeId?: string) {
  return useQuery({
    queryKey: ["areas", officeId],
    queryFn: () => db.getAreas(officeId),
  });
}

export function useHouses(areaId?: string) {
  return useQuery({
    queryKey: ["houses", areaId],
    queryFn: () => db.getHouses(areaId),
    enabled: !!areaId,
  });
}

export function useBusinesses(areaId?: string) {
  return useQuery({
    queryKey: ["businesses", areaId],
    queryFn: () => db.getBusinesses(areaId),
    enabled: !!areaId,
  });
}

export function useLeads(assignedTo?: string) {
  return useQuery({
    queryKey: ["leads", assignedTo],
    queryFn: () => db.getLeads(assignedTo),
  });
}

export function useSales(soldBy?: string) {
  return useQuery({
    queryKey: ["sales", soldBy],
    queryFn: () => db.getSales(soldBy),
  });
}

export function useDeliveries(postmanId?: string) {
  return useQuery({
    queryKey: ["deliveries", postmanId],
    queryFn: () => db.getDeliveries(postmanId),
  });
}

export function useFollowups(assignedTo?: string) {
  return useQuery({
    queryKey: ["followups", assignedTo],
    queryFn: () => db.getFollowups(assignedTo),
  });
}

export function useArticles(assignedPostman?: string) {
  return useQuery({
    queryKey: ["articles", assignedPostman],
    queryFn: () => db.getArticles(assignedPostman),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: db.getUsers,
  });
}

export function useOffices() {
  return useQuery({
    queryKey: ["offices"],
    queryFn: db.getOffices,
  });
}
