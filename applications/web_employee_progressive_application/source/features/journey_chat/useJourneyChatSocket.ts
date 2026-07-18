/**
 * Manages one journey chat WebSocket: loads history over REST, streams live
 * messages, exposes a connection status, and sends outgoing messages. The
 * socket reconnects on unexpected close with a short backoff.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildJourneyChatSocketUrl,
  getJourneyMessages,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_chat_api";
import type { ChatMessage } from "../../shared_user_interface_infrastructure/backend_communication/employee_chat_api";

export type JourneyChatConnectionStatus =
  | "connecting"
  | "open"
  | "closed";

interface JourneyChatSocketState {
  messages: ChatMessage[];
  connectionStatus: JourneyChatConnectionStatus;
  sendMessage: (body: string) => boolean;
}

const RECONNECT_DELAY_MILLISECONDS = 3000;

export function useJourneyChatSocket(
  rideOfferId: string | undefined,
): JourneyChatSocketState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<JourneyChatConnectionStatus>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  const appendMessage = useCallback((incoming: ChatMessage) => {
    setMessages((existing) =>
      existing.some((message) => message.id === incoming.id)
        ? existing
        : [...existing, incoming],
    );
  }, []);

  useEffect(() => {
    if (!rideOfferId) {
      return;
    }
    isUnmountedRef.current = false;

    void getJourneyMessages(rideOfferId)
      .then((history) => setMessages(history))
      .catch(() => undefined);

    function openSocket() {
      setConnectionStatus("connecting");
      const socket = new WebSocket(buildJourneyChatSocketUrl(rideOfferId!));
      socketRef.current = socket;

      socket.onopen = () => setConnectionStatus("open");
      socket.onmessage = (event) => {
        try {
          appendMessage(JSON.parse(event.data) as ChatMessage);
        } catch {
          // Ignore non-JSON frames.
        }
      };
      socket.onclose = () => {
        setConnectionStatus("closed");
        if (!isUnmountedRef.current) {
          reconnectTimerRef.current = window.setTimeout(
            openSocket,
            RECONNECT_DELAY_MILLISECONDS,
          );
        }
      };
    }

    openSocket();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [rideOfferId, appendMessage]);

  const sendMessage = useCallback((body: string): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify({ body }));
    return true;
  }, []);

  return { messages, connectionStatus, sendMessage };
}
