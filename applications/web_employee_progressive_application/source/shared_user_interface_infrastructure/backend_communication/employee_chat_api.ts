/** Journey chat REST history and WebSocket URL construction. */

import { employeeApiClient } from "./employee_api_client";
import { EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY } from "./employee_api_client";

export interface ChatMessage {
  id: string;
  ride_offer_id: string;
  sender_employee_id: string;
  sender_full_name: string;
  body: string;
  created_at: string;
}

export async function getJourneyMessages(
  rideOfferId: string,
): Promise<ChatMessage[]> {
  const response = await employeeApiClient.get<ChatMessage[]>(
    `/api/v1/journeys/${rideOfferId}/messages`,
  );
  return response.data;
}

/**
 * Build the authenticated WebSocket URL for a journey chat. The access token
 * rides as a query parameter because browsers cannot set headers on a
 * WebSocket handshake. Falls back to the current origin when no API base is
 * configured (same-origin deploys).
 */
export function buildJourneyChatSocketUrl(rideOfferId: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const httpUrl = new URL(
    `/api/v1/ws/journeys/${rideOfferId}/chat`,
    apiBaseUrl,
  );
  httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  const accessToken =
    localStorage.getItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY) ?? "";
  httpUrl.searchParams.set("token", accessToken);
  return httpUrl.toString();
}
