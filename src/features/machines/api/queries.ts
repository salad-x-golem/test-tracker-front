import { queryOptions } from "@tanstack/react-query";
import {
  getMachines,
  getMachine,
  getMachineProviders,
  getMachineWithProviders,
} from "@/data/machines";

export const machineKeys = {
  all: ["machines"] as const,
  lists: () => [...machineKeys.all, "list"] as const,
  list: () => [...machineKeys.lists()] as const,
  details: () => [...machineKeys.all, "detail"] as const,
  detail: (id: string) => [...machineKeys.details(), id] as const,
  providers: (id: string) => [...machineKeys.detail(id), "providers"] as const,
  withProviders: (id: string) => [...machineKeys.detail(id), "full"] as const,
};

export const machinesQueryOptions = () =>
  queryOptions({
    queryKey: machineKeys.list(),
    queryFn: () => getMachines(),
    staleTime: 30_000, // 30 seconds
  });

export const machineQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.detail(machineId),
    queryFn: () => {
      const machine = getMachine(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }
      return machine;
    },
    staleTime: 30_000,
  });

export const machineProvidersQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.providers(machineId),
    queryFn: async () => {
      const providers = await getMachineProviders(machineId);
      if (!providers) {
        throw new Error(`Machine ${machineId} not found`);
      }
      return providers;
    },
    staleTime: 30_000,
  });

export const machineWithProvidersQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.withProviders(machineId),
    queryFn: () => {
      const machine = getMachineWithProviders(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }
      return machine;
    },
    staleTime: 30_000,
  });
