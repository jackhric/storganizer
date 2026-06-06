import * as React from "react";

function detectIsMac() {
  if (typeof navigator === "undefined") return false;
  const platform =
    // `userAgentData` is the modern, non-deprecated source where available.
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ??
    navigator.platform ??
    navigator.userAgent;
  return /mac/i.test(platform);
}

// The platform never changes during a session, so there is nothing to
// subscribe to — the subscribe callback is a no-op.
const subscribe = () => () => {};

/**
 * Detects whether the user is on a Mac, for displaying platform-correct
 * keyboard hints (⌘ vs Ctrl). Uses `useSyncExternalStore` so the value is
 * read directly on the client without a state-setting effect; the server
 * snapshot returns `false` to avoid SSR hydration mismatches.
 */
export function useIsMac() {
  return React.useSyncExternalStore(subscribe, detectIsMac, () => false);
}
