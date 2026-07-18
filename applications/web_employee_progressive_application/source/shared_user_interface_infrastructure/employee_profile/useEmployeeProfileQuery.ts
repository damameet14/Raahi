/** Shared React Query hook for the authenticated employee's profile. */

import { useQuery } from "@tanstack/react-query";

import { fetchMyProfile } from "../backend_communication/employee_account_api";

export const EMPLOYEE_PROFILE_QUERY_KEY = ["employee-profile"] as const;

export function useEmployeeProfileQuery(isEnabled = true) {
  return useQuery({
    queryKey: EMPLOYEE_PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
    enabled: isEnabled,
    staleTime: 60_000,
  });
}
