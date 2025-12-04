import { useQuery } from "@tanstack/react-query";
import {
  machinesQueryOptions,
  machineQueryOptions,
  machineProvidersQueryOptions,
  machineWithProvidersQueryOptions,
} from "../api/queries";

/**
 * Hook to fetch all machines (without providers)
 */
export function useMachines() {
  return useQuery(machinesQueryOptions());
}

/**
 * Hook to fetch a single machine by ID
 */
export function useMachine(machineId: string) {
  return useQuery({
    ...machineQueryOptions(machineId),
    enabled: !!machineId,
  });
}

/**
 * Hook to fetch providers for a specific machine
 */
export function useMachineProviders(machineId: string) {
  return useQuery({
    ...machineProvidersQueryOptions(machineId),
    enabled: !!machineId,
  });
}

/**
 * Hook to fetch a machine with all its providers
 */
export function useMachineWithProviders(machineId: string) {
  return useQuery({
    ...machineWithProvidersQueryOptions(machineId),
    enabled: !!machineId,
  });
}
