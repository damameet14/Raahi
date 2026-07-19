/**
 * App-wide chat notifications.
 *
 * Renders nothing. While the employee is signed in, it keeps a lightweight
 * WebSocket open for each of their active journeys (BOOKED/STARTED, as driver
 * or passenger) and shows a top-of-screen pop-up toast whenever a co-traveller
 * sends a chat message — unless the message is the employee's own, or they are
 * already viewing that journey's chat. Tapping the toast opens the chat.
 *
 * The chat WebSocket only streams live messages (history is loaded separately
 * over REST), so connecting here does not replay old messages.
 */

import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MessageCircle } from "lucide-react";

import { useEmployeeAuthentication } from "../../shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import {
  listMyDriverBookings,
  listMyPassengerBookings,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import {
  buildJourneyChatSocketUrl,
  type ChatMessage,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_chat_api";

const ACTIVE_TRIP_STATUSES = new Set(["BOOKED", "STARTED"]);
const RECONNECT_DELAY_MILLISECONDS = 4000;
const ACTIVE_JOURNEYS_REFRESH_MILLISECONDS = 60_000;

export function ChatNotificationsListener() {
  const { isAuthenticated } = useEmployeeAuthentication();
  const profileQuery = useEmployeeProfileQuery(isAuthenticated);
  const myEmployeeId = profileQuery.data?.id ?? null;

  const navigate = useNavigate();
  const location = useLocation();

  // Latest values read inside socket callbacks without re-opening sockets.
  const currentPathRef = useRef(location.pathname);
  currentPathRef.current = location.pathname;
  const myEmployeeIdRef = useRef(myEmployeeId);
  myEmployeeIdRef.current = myEmployeeId;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const passengerBookingsQuery = useQuery({
    queryKey: ["passenger-bookings"],
    queryFn: listMyPassengerBookings,
    enabled: isAuthenticated,
    refetchInterval: ACTIVE_JOURNEYS_REFRESH_MILLISECONDS,
  });
  const driverBookingsQuery = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: listMyDriverBookings,
    enabled: isAuthenticated,
    refetchInterval: ACTIVE_JOURNEYS_REFRESH_MILLISECONDS,
  });

  const activeRideOfferIds = Array.from(
    new Set(
      [...(passengerBookingsQuery.data ?? []), ...(driverBookingsQuery.data ?? [])]
        .filter((booking) => ACTIVE_TRIP_STATUSES.has(booking.trip_status))
        .map((booking) => booking.ride_offer_id),
    ),
  ).sort();
  const activeRideOfferIdsKey = activeRideOfferIds.join(",");

  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const reconnectTimersRef = useRef<Map<string, number>>(new Map());
  const intentionallyClosedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !myEmployeeId) {
      return;
    }

    const activeIds = new Set(activeRideOfferIdsKey ? activeRideOfferIdsKey.split(",") : []);
    const sockets = socketsRef.current;

    function openSocket(rideOfferId: string) {
      intentionallyClosedRef.current.delete(rideOfferId);
      const socket = new WebSocket(buildJourneyChatSocketUrl(rideOfferId));
      sockets.set(rideOfferId, socket);

      socket.onmessage = (event) => {
        let message: ChatMessage;
        try {
          message = JSON.parse(event.data) as ChatMessage;
        } catch {
          return;
        }
        if (message.sender_employee_id === myEmployeeIdRef.current) {
          return;
        }
        const chatPath = `/journeys/${message.ride_offer_id}/chat`;
        if (currentPathRef.current === chatPath) {
          return;
        }
        showChatMessageToast(message, () => navigateRef.current(chatPath));
      };

      socket.onclose = () => {
        sockets.delete(rideOfferId);
        if (intentionallyClosedRef.current.has(rideOfferId)) {
          return;
        }
        const timerId = window.setTimeout(() => {
          reconnectTimersRef.current.delete(rideOfferId);
          openSocket(rideOfferId);
        }, RECONNECT_DELAY_MILLISECONDS);
        reconnectTimersRef.current.set(rideOfferId, timerId);
      };
    }

    // Close sockets for journeys that are no longer active.
    for (const [rideOfferId, socket] of sockets) {
      if (!activeIds.has(rideOfferId)) {
        intentionallyClosedRef.current.add(rideOfferId);
        socket.close();
        sockets.delete(rideOfferId);
      }
    }
    // Open sockets for newly active journeys.
    for (const rideOfferId of activeIds) {
      if (!sockets.has(rideOfferId)) {
        openSocket(rideOfferId);
      }
    }
  }, [activeRideOfferIdsKey, isAuthenticated, myEmployeeId]);

  // Tear everything down on sign-out / unmount.
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    closeAllSockets();
  }, [isAuthenticated]);

  useEffect(() => {
    return () => closeAllSockets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeAllSockets() {
    for (const timerId of reconnectTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    reconnectTimersRef.current.clear();
    for (const [rideOfferId, socket] of socketsRef.current) {
      intentionallyClosedRef.current.add(rideOfferId);
      socket.close();
    }
    socketsRef.current.clear();
  }

  return null;
}

function showChatMessageToast(message: ChatMessage, onOpen: () => void) {
  toast(
    (activeToast) => (
      <button
        type="button"
        onClick={() => {
          toast.dismiss(activeToast.id);
          onOpen();
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raahi-50 text-raahi-700">
          <MessageCircle size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-text-primary">
            {message.sender_full_name}
          </span>
          <span className="block truncate text-xs text-text-secondary">
            {message.body}
          </span>
        </span>
      </button>
    ),
    { duration: 5000, id: `chat-${message.id}` },
  );
}
