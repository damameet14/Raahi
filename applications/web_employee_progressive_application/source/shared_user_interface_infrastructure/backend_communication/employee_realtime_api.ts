/** Per-employee real-time ride event stream (WebSocket URL + event shape). */

import { EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY } from "./employee_api_client";

export type EmployeeRealtimeEventType =
  | "booking_confirmed"
  | "trip_started"
  | "pickup_verified"
  | "trip_completed"
  | "booking_cancelled"
  | "journey_cancelled"
  | "payment_received";

export interface EmployeeRealtimeEvent {
  type: EmployeeRealtimeEventType;
  title: string;
  message: string;
  ride_offer_id?: string;
  ride_booking_id?: string;
  action?: "pay";
  fare_amount?: number;
  amount?: number;
}

/**
 * Build the authenticated WebSocket URL for the employee's personal event
 * stream. The access token rides as a query parameter because browsers cannot
 * set headers on a WebSocket handshake. Falls back to the current origin when
 * no API base is configured (same-origin deploys behind nginx).
 */
export function buildEmployeeEventsSocketUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const httpUrl = new URL("/api/v1/ws/employee/events", apiBaseUrl);
  httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  const accessToken =
    localStorage.getItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY) ?? "";
  httpUrl.searchParams.set("token", accessToken);
  return httpUrl.toString();
}
