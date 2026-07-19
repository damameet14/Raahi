/**
 * Raahi Employee PWA — application entry point.
 *
 * Wires the React Query client, authentication state, Google Maps loader,
 * routing, and toast notifications, and registers the service worker so the
 * app is installable and launches offline.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { EmployeeAuthenticationProvider } from "./shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import { GoogleMapsApiLoaderProvider } from "./shared_user_interface_infrastructure/maps/GoogleMapsApiLoaderProvider";
import { PlatformExperienceProvider } from "./shared_user_interface_infrastructure/layout/PlatformExperienceContext";
import { EmployeeAppShell } from "./shared_user_interface_infrastructure/layout/EmployeeAppShell";
import { ChatNotificationsListener } from "./features/journey_chat/ChatNotificationsListener";
import { RideEventsListener } from "./features/realtime/RideEventsListener";
import { ApplicationRouter } from "./ApplicationRouter";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <EmployeeAuthenticationProvider>
        <GoogleMapsApiLoaderProvider>
          <PlatformExperienceProvider>
            <BrowserRouter basename="/app">
              <ChatNotificationsListener />
              <RideEventsListener />
              <EmployeeAppShell>
                <ApplicationRouter />
              </EmployeeAppShell>
            </BrowserRouter>
          </PlatformExperienceProvider>
        </GoogleMapsApiLoaderProvider>
      </EmployeeAuthenticationProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#17251b",
            border: "1px solid #e1e7e2",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => undefined);
  });
}
