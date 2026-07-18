/** Ride discovery, booking, trip-lifecycle, and tracking API calls. */

import { employeeApiClient } from "./employee_api_client";
import type {
  BookingTracking,
  CreateRideOfferResult,
  CreateRideRequestResult,
  DriverLocation,
  EmployeeRideReportSummary,
  FareEstimateResponse,
  RideBooking,
  RideOffer,
  RideRequest,
} from "./employee_api_types";

export interface GeographicPointPayload {
  latitude: number;
  longitude: number;
  label?: string | null;
}

export interface CreateRideRequestPayload {
  source: GeographicPointPayload;
  destination: GeographicPointPayload;
  travel_date: string;
  departure_time: string;
  seats_requested: number;
  is_recurring: boolean;
  recurrence_days: string[] | null;
  recurrence_time: string | null;
}

export interface CreateRideOfferPayload {
  vehicle_id: string;
  source: GeographicPointPayload;
  destination: GeographicPointPayload;
  travel_date: string;
  departure_window_start_time: string;
  departure_window_end_time: string;
  seats_offered: number | null;
  is_recurring: boolean;
  recurrence_days: string[] | null;
  recurrence_time: string | null;
}

export async function estimateFare(
  source: GeographicPointPayload,
  destination: GeographicPointPayload,
  seatsRequested: number,
): Promise<FareEstimateResponse> {
  const response = await employeeApiClient.post<FareEstimateResponse>(
    "/api/v1/rides/fare-estimate",
    { source, destination, seats_requested: seatsRequested },
  );
  return response.data;
}

export async function createRideRequest(
  payload: CreateRideRequestPayload,
): Promise<CreateRideRequestResult> {
  const response = await employeeApiClient.post<CreateRideRequestResult>(
    "/api/v1/rides/requests",
    payload,
  );
  return response.data;
}

export async function bookOffer(
  rideRequestId: string,
  rideOfferId: string,
): Promise<RideBooking> {
  const response = await employeeApiClient.post<RideBooking>(
    "/api/v1/rides/bookings",
    { ride_request_id: rideRequestId, ride_offer_id: rideOfferId },
  );
  return response.data;
}

export async function cancelRideRequest(
  rideRequestId: string,
): Promise<RideRequest> {
  const response = await employeeApiClient.post<RideRequest>(
    `/api/v1/rides/requests/${rideRequestId}/cancel`,
  );
  return response.data;
}

export async function listMyRideRequests(): Promise<RideRequest[]> {
  const response = await employeeApiClient.get<RideRequest[]>(
    "/api/v1/rides/requests/mine",
  );
  return response.data;
}

export async function createRideOffer(
  payload: CreateRideOfferPayload,
): Promise<CreateRideOfferResult> {
  const response = await employeeApiClient.post<CreateRideOfferResult>(
    "/api/v1/rides/offers",
    payload,
  );
  return response.data;
}

export async function listMyRideOffers(): Promise<RideOffer[]> {
  const response = await employeeApiClient.get<RideOffer[]>(
    "/api/v1/rides/offers/mine",
  );
  return response.data;
}

export async function acceptRideRequests(
  rideOfferId: string,
  rideRequestIds: string[],
): Promise<RideBooking[]> {
  const response = await employeeApiClient.post<{ bookings: RideBooking[] }>(
    "/api/v1/rides/offers/accept",
    { ride_offer_id: rideOfferId, ride_request_ids: rideRequestIds },
  );
  return response.data.bookings;
}

export async function listMyPassengerBookings(): Promise<RideBooking[]> {
  const response = await employeeApiClient.get<RideBooking[]>(
    "/api/v1/rides/bookings/as-passenger",
  );
  return response.data;
}

export async function listMyDriverBookings(): Promise<RideBooking[]> {
  const response = await employeeApiClient.get<RideBooking[]>(
    "/api/v1/rides/bookings/as-driver",
  );
  return response.data;
}

export async function startJourney(rideOfferId: string): Promise<RideOffer> {
  const response = await employeeApiClient.post<RideOffer>(
    `/api/v1/rides/offers/${rideOfferId}/start`,
  );
  return response.data;
}

export async function verifyBookingOtp(
  rideBookingId: string,
  otpCode: string,
): Promise<RideBooking> {
  const response = await employeeApiClient.post<RideBooking>(
    `/api/v1/rides/bookings/${rideBookingId}/verify-otp`,
    { otp_code: otpCode },
  );
  return response.data;
}

export async function completeBooking(
  rideBookingId: string,
): Promise<RideBooking> {
  const response = await employeeApiClient.post<RideBooking>(
    `/api/v1/rides/bookings/${rideBookingId}/complete`,
  );
  return response.data;
}

export async function cancelBooking(
  rideBookingId: string,
): Promise<RideBooking> {
  const response = await employeeApiClient.post<RideBooking>(
    `/api/v1/rides/bookings/${rideBookingId}/cancel`,
  );
  return response.data;
}

export async function cancelRideOffer(rideOfferId: string): Promise<RideOffer> {
  const response = await employeeApiClient.post<RideOffer>(
    `/api/v1/rides/offers/${rideOfferId}/cancel`,
  );
  return response.data;
}

export async function completeJourney(rideOfferId: string): Promise<RideOffer> {
  const response = await employeeApiClient.post<RideOffer>(
    `/api/v1/rides/offers/${rideOfferId}/complete`,
  );
  return response.data;
}

export async function postDriverLocation(
  rideOfferId: string,
  latitude: number,
  longitude: number,
): Promise<DriverLocation> {
  const response = await employeeApiClient.post<DriverLocation>(
    `/api/v1/rides/offers/${rideOfferId}/location`,
    { latitude, longitude },
  );
  return response.data;
}

export async function getBookingTracking(
  rideBookingId: string,
): Promise<BookingTracking> {
  const response = await employeeApiClient.get<BookingTracking>(
    `/api/v1/rides/bookings/${rideBookingId}/tracking`,
  );
  return response.data;
}

export async function listMyRideHistory(): Promise<RideBooking[]> {
  const response = await employeeApiClient.get<RideBooking[]>(
    "/api/v1/rides/history",
  );
  return response.data;
}

export async function getMyRideReportSummary(): Promise<EmployeeRideReportSummary> {
  const response = await employeeApiClient.get<EmployeeRideReportSummary>(
    "/api/v1/rides/reports/summary",
  );
  return response.data;
}
