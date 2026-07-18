/**
 * Live group chat for one journey (driver + accepted passengers).
 *
 * Streams messages over a WebSocket and lets a participant send text. A "Call"
 * button is a plain ``tel:`` link to the counterpart's phone when one was
 * passed in via navigation state (there is no in-app voice calling).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Phone, SendHorizonal } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { useJourneyChatSocket } from "./useJourneyChatSocket";

interface JourneyChatLocationState {
  callPhone?: string | null;
  callName?: string | null;
}

export function JourneyChatPage() {
  const { rideOfferId } = useParams();
  const location = useLocation();
  const callTarget = (location.state as JourneyChatLocationState | null) ?? {};
  const profileQuery = useEmployeeProfileQuery();
  const { messages, connectionStatus, sendMessage } =
    useJourneyChatSocket(rideOfferId);
  const [draftBody, setDraftBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentEmployeeId = profileQuery.data?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connectionLabel = useMemo(() => {
    if (connectionStatus === "open") return "Connected";
    if (connectionStatus === "connecting") return "Connecting…";
    return "Reconnecting…";
  }, [connectionStatus]);

  function handleSend() {
    const trimmed = draftBody.trim();
    if (!trimmed) {
      return;
    }
    if (sendMessage(trimmed)) {
      setDraftBody("");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <EmployeeAppHeader title="Journey Chat" leftAction="back" />

      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-border-primary)] bg-surface-secondary px-4 py-2">
        <span className="text-xs text-text-muted">{connectionLabel}</span>
        {callTarget.callPhone && (
          <a
            href={`tel:${callTarget.callPhone}`}
            className="flex items-center gap-1.5 rounded-full bg-raahi-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Phone size={14} />
            Call {callTarget.callName ?? "driver"}
          </a>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-text-muted">
            No messages yet. Say hello to coordinate your ride.
          </p>
        ) : (
          messages.map((message) => {
            const isOwnMessage =
              message.sender_employee_id === currentEmployeeId;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${
                  isOwnMessage ? "items-end" : "items-start"
                }`}
              >
                {!isOwnMessage && (
                  <span className="mb-0.5 text-[11px] font-semibold text-text-muted">
                    {message.sender_full_name}
                  </span>
                )}
                <span
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isOwnMessage
                      ? "bg-raahi-600 text-white"
                      : "bg-surface-secondary text-text-primary"
                  }`}
                >
                  {message.body}
                </span>
                <span className="mt-0.5 text-[10px] text-text-muted">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-[color:var(--color-border-primary)] bg-white px-4 py-3">
        <input
          type="text"
          value={draftBody}
          onChange={(event) => setDraftBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Type a message"
          className="flex-1 rounded-full border border-[color:var(--color-border-primary)] px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draftBody.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raahi-600 text-white transition disabled:opacity-50"
          aria-label="Send message"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
