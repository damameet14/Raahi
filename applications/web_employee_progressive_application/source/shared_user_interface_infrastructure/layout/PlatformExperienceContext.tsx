/**
 * Platform experience context.
 *
 * Detects the device platform (Android / iOS / desktop), decides whether to
 * present the app in a mobile phone-column layout or a wider desktop layout,
 * lets the user toggle between the two, and captures the PWA install prompt so
 * Android users can be offered a one-tap "install app" action.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DevicePlatform = "android" | "ios" | "desktop";
export type ExperienceMode = "mobile" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PlatformExperienceValue {
  platform: DevicePlatform;
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  toggleMode: () => void;
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}

const PlatformExperienceContext = createContext<PlatformExperienceValue | null>(
  null,
);

const EXPERIENCE_MODE_STORAGE_KEY = "raahi_experience_mode";

function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === "undefined") {
    return "desktop";
  }
  const userAgent = navigator.userAgent.toLowerCase();
  if (/android/.test(userAgent)) {
    return "android";
  }
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }
  return "desktop";
}

function detectRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const isStandaloneDisplay = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const isIosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
    true;
  return isStandaloneDisplay || isIosStandalone;
}

function resolveInitialMode(platform: DevicePlatform): ExperienceMode {
  const storedMode = localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY);
  if (storedMode === "mobile" || storedMode === "desktop") {
    return storedMode;
  }
  if (platform === "desktop") {
    return "desktop";
  }
  return "mobile";
}

export function PlatformExperienceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const platform = useMemo(detectDevicePlatform, []);
  const [mode, setModeState] = useState<ExperienceMode>(() =>
    resolveInitialMode(platform),
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    detectRunningAsInstalledApp,
  );
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const setMode = useCallback((nextMode: ExperienceMode) => {
    setModeState(nextMode);
    localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const nextMode = current === "desktop" ? "mobile" : "desktop";
      localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  }, [installPromptEvent]);

  const value = useMemo<PlatformExperienceValue>(
    () => ({
      platform,
      mode,
      setMode,
      toggleMode,
      isInstalled,
      canInstall: installPromptEvent !== null,
      promptInstall,
    }),
    [platform, mode, setMode, toggleMode, isInstalled, installPromptEvent, promptInstall],
  );

  return (
    <PlatformExperienceContext.Provider value={value}>
      {children}
    </PlatformExperienceContext.Provider>
  );
}

export function usePlatformExperience(): PlatformExperienceValue {
  const context = useContext(PlatformExperienceContext);
  if (!context) {
    throw new Error(
      "usePlatformExperience must be used within PlatformExperienceProvider",
    );
  }
  return context;
}
