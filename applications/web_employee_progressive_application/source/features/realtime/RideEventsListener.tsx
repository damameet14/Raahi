/**
 * App-wide real-time ride events.
 *
 * Renders nothing. While the employee is signed in it keeps a single WebSocket
 * open to their personal event stream and, for every ride-lifecycle event
 * (booking confirmed, trip started/completed, cancellations, payment received),
 * shows a top-of-screen toast and refreshes the affected React Query caches so
 * open screens update instantly. A "trip completed" event additionally offers a
 * "Pay now" shortcut so the passenger can settle the fare the moment the driver
 * marks the ride complete.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, IndianRupee } from "lucide-react";

import { useEmployeeAuthentication } from "../../shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import {
  buildEmployeeEventsSocketUrl,
  type EmployeeRealtimeEvent,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_realtime_api";

const RECONNECT_DELAY_MILLISECONDS = 4000;

// Caches refreshed on any ride event so every open screen reflects the change.
const AFFECTED_QUERY_KEYS: string[] = [
  "passenger-bookings",
  "driver-bookings",
  "employee-passenger-bookings",
  "employee-payments",
  "my-ride-requests",
  "my-ride-offers",
  "employee-ride-history",
  "employee-ride-report-summary",
  "employee-wallet",
];

export function RideEventsListener() {
  const { isAuthenticated } = useEmployeeAuthentication();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let isUnmounted = false;
    let socket: WebSocket | null = null;
    let reconnectTimerId: number | null = null;

    function openSocket() {
      socket = new WebSocket(buildEmployeeEventsSocketUrl());

      socket.onmessage = (messageEvent) => {
        let rideEvent: EmployeeRealtimeEvent;
        try {
          rideEvent = JSON.parse(messageEvent.data) as EmployeeRealtimeEvent;
        } catch {
          return;
        }
        refreshAffectedQueries(queryClientRef.current);
        showRideEventToast(rideEvent, () =>
          navigateRef.current("/payment-methods"),
        );
      };

      socket.onclose = () => {
        if (isUnmounted) {
          return;
        }
        reconnectTimerId = window.setTimeout(
          openSocket,
          RECONNECT_DELAY_MILLISECONDS,
        );
      };
    }

    openSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId);
      }
      socket?.close();
    };
  }, [isAuthenticated]);

  return null;
}

function refreshAffectedQueries(queryClient: QueryClient) {
  for (const queryKey of AFFECTED_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [queryKey] });
  }
  // Live-tracking queries are keyed by booking id; refresh them all.
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "booking-tracking",
  });
}

function showRideEventToast(event: EmployeeRealtimeEvent, onPay: () => void) {
  const isPayable = event.action === "pay";
  toast(
    (activeToast) => (
      <div className="flex w-full items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raahi-50 text-raahi-700">
          {isPayable ? <IndianRupee size={16} /> : <Bell size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary">{event.title}</p>
          <p className="text-xs text-text-secondary">{event.message}</p>
          {isPayable && (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(activeToast.id);
                onPay();
              }}
              className="mt-2 rounded-lg bg-raahi-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              Pay now
            </button>
          )}
        </div>
      </div>
    ),
    { duration: isPayable ? 8000 : 5000, id: `ride-event-${event.type}-${event.ride_booking_id ?? ""}` },
  );
}
