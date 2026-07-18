/** Authentication, profile, and onboarding API calls for the employee app. */

import { employeeApiClient } from "./employee_api_client";
import type {
  AuthenticationTokensResponse,
  EmployeeProfile,
  SavedPlace,
  VehicleSummary,
} from "./employee_api_types";

export interface OnboardingVehicleDetails {
  make_and_model: string;
  vehicle_number: string;
  maximum_passengers: number;
}

export interface SubmitOnboardingPayload {
  has_vehicle: boolean;
  vehicle: OnboardingVehicleDetails | null;
  home_latitude: number;
  home_longitude: number;
  home_address_label: string | null;
  office_latitude: number;
  office_longitude: number;
  office_address_label: string | null;
}

export interface UpdateEmployeeAddressesPayload {
  home_latitude: number;
  home_longitude: number;
  home_address_label: string | null;
  office_latitude: number;
  office_longitude: number;
  office_address_label: string | null;
}

export interface RegisterVehiclePayload {
  make: string;
  model: string;
  vehicle_number: string;
  maximum_passengers: number;
  fuel_type?: string;
  color?: string | null;
}

export interface UpdateVehiclePayload {
  make?: string;
  model?: string;
  vehicle_number?: string;
  maximum_passengers?: number;
  fuel_type?: string;
  color?: string | null;
}

export interface SavePlacePayload {
  label: string;
  address_label: string | null;
  latitude: number;
  longitude: number;
}

export type UpdateSavedPlacePayload = Partial<SavePlacePayload>;

export async function loginEmployee(
  email: string,
  password: string,
): Promise<AuthenticationTokensResponse> {
  const response = await employeeApiClient.post<AuthenticationTokensResponse>(
    "/api/v1/authentication/login",
    { email, password },
  );
  return response.data;
}

export async function changeEmployeePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await employeeApiClient.post("/api/v1/authentication/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function fetchMyProfile(): Promise<EmployeeProfile> {
  const response = await employeeApiClient.get<EmployeeProfile>(
    "/api/v1/employee/me",
  );
  return response.data;
}

export async function submitOnboarding(
  payload: SubmitOnboardingPayload,
): Promise<EmployeeProfile> {
  const response = await employeeApiClient.post<EmployeeProfile>(
    "/api/v1/employee/onboarding",
    payload,
  );
  return response.data;
}

export async function updateMyAddresses(
  payload: UpdateEmployeeAddressesPayload,
): Promise<EmployeeProfile> {
  const response = await employeeApiClient.put<EmployeeProfile>(
    "/api/v1/employee/me/addresses",
    payload,
  );
  return response.data;
}

export async function registerMyVehicle(
  payload: RegisterVehiclePayload,
): Promise<VehicleSummary> {
  const response = await employeeApiClient.post<VehicleSummary>(
    "/api/v1/employee/vehicles",
    payload,
  );
  return response.data;
}

export async function listMyVehicles(): Promise<VehicleSummary[]> {
  const response = await employeeApiClient.get<VehicleSummary[]>(
    "/api/v1/employee/vehicles",
  );
  return response.data;
}

export async function updateMyVehicle(
  vehicleId: string,
  payload: UpdateVehiclePayload,
): Promise<VehicleSummary> {
  const response = await employeeApiClient.put<VehicleSummary>(
    `/api/v1/employee/vehicles/${vehicleId}`,
    payload,
  );
  return response.data;
}

export async function deleteMyVehicle(vehicleId: string): Promise<void> {
  await employeeApiClient.delete(`/api/v1/employee/vehicles/${vehicleId}`);
}

export async function listMySavedPlaces(): Promise<SavedPlace[]> {
  const response = await employeeApiClient.get<SavedPlace[]>(
    "/api/v1/employee/saved-places",
  );
  return response.data;
}

export async function createMySavedPlace(
  payload: SavePlacePayload,
): Promise<SavedPlace> {
  const response = await employeeApiClient.post<SavedPlace>(
    "/api/v1/employee/saved-places",
    payload,
  );
  return response.data;
}

export async function updateMySavedPlace(
  savedPlaceId: string,
  payload: UpdateSavedPlacePayload,
): Promise<SavedPlace> {
  const response = await employeeApiClient.put<SavedPlace>(
    `/api/v1/employee/saved-places/${savedPlaceId}`,
    payload,
  );
  return response.data;
}

export async function deleteMySavedPlace(savedPlaceId: string): Promise<void> {
  await employeeApiClient.delete(`/api/v1/employee/saved-places/${savedPlaceId}`);
}
