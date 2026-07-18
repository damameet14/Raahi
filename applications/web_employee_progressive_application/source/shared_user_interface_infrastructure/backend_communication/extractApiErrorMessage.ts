import axios from "axios";

/**
 * Pull a user-facing message out of an error thrown by an API call.
 * FastAPI returns `{ "detail": "..." }`; anything else falls back.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
  }
  return fallbackMessage;
}
