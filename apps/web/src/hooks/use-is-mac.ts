import * as React from "react";

/**
 * Detects whether the user is on a Mac, for displaying platform-correct
 * keyboard hints (⌘ vs Ctrl). Resolves after mount to avoid SSR hydration
 * mismatches, so it returns `false` until the client confirms the platform.
 */
export function useIsMac() {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    const platform =
      // `userAgentData` is the modern, non-deprecated source where available.
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ??
      navigator.platform ??
      navigator.userAgent;
    setIsMac(/mac/i.test(platform));
  }, []);

  return isMac;
}
