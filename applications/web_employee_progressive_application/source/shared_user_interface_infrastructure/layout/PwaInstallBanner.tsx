/**
 * Install prompt banner shown to Android users.
 *
 * On Android/Chrome the browser fires `beforeinstallprompt`, which the
 * platform context captures; this banner surfaces a one-tap "Install app"
 * button. It is dismissible for the session and hidden once the app runs as an
 * installed PWA.
 */

import { useState } from "react";
import { Download, X } from "lucide-react";

import { usePlatformExperience } from "./PlatformExperienceContext";

export function PwaInstallBanner() {
  const { platform, isInstalled, canInstall, promptInstall } =
    usePlatformExperience();
  const [isDismissed, setIsDismissed] = useState(false);

  const shouldShow = platform === "android" && !isInstalled && !isDismissed;
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-raahi-700 px-4 py-2.5 text-white">
      <Download size={18} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">
          Get the Raahi app
        </p>
        <p className="truncate text-xs text-white/80">
          {canInstall
            ? "Install Raahi for a faster, full-screen experience."
            : "Open the browser menu and choose “Add to Home screen”."}
        </p>
      </div>
      {canInstall && (
        <button
          type="button"
          onClick={promptInstall}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-raahi-700"
        >
          Install
        </button>
      )}
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-white/80 hover:bg-white/10"
      >
        <X size={16} />
      </button>
    </div>
  );
}
