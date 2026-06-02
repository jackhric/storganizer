"use client";

import { useEffect, useRef } from "react";
import type { Rgb } from "@/lib/color/oklch";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090";

// Throttle send rate to ~30 fps. The backend handles WARLS keepalive itself
// (re-sending the last frame to WLED every ~300ms), so this throttle only
// shapes the frontend → backend stream — coalescing rapid UI updates without
// flooding the WebSocket.
const THROTTLE_MS = 33;

export type WarlsDeviceFrame = Map<number, Rgb>;
export type WarlsFrame = Map<string, WarlsDeviceFrame>;

type WireLed = { idx: number; r: number; g: number; b: number };
type SetMessage = { type: "set"; frames: Record<string, WireLed[]> };

/**
 * Streams the desired LED state to one or more WLED devices via a single
 * backend WebSocket session. The backend owns frame keepalive and clears any
 * device this session touched on disconnect — so the hook itself stays
 * stateless beyond the socket and a small send-throttle.
 *
 * The outer map is keyed by device id; each inner map holds the LED indices
 * that should be lit on that device. Devices that drop out of the outer map
 * (or whose inner map is empty) are cleared on the next send.
 *
 * Pass `null` to clear every device this hook has touched and close the
 * socket. Last write wins across sessions — another tab (or a future
 * integration) setting the same device will replace this hook's frame.
 */
export function useWarls(frame: WarlsFrame | null): void {
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<WarlsFrame | null>(null);
  const lastSentAtRef = useRef(0);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open the socket once per consumer lifetime. The session is identified
  // purely by the connection itself.
  useEffect(() => {
    const wsUrl = BACKEND_URL.replace(/^http/, "ws") + "/api/warls/stream";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      if (pendingRef.current !== null) flushNow(ws, pendingRef.current, lastSentAtRef);
      pendingRef.current = null;
    });

    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      pendingRef.current = null;
      wsRef.current = null;
      // Best-effort empty frame so the backend can drop our claims even if
      // it's slow to notice the close.
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "set", frames: {} } satisfies SetMessage));
        } catch {
          // socket gone
        }
      }
      ws.close();
    };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    const desired = frame ?? new Map<string, WarlsDeviceFrame>();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Queue for the open handler.
      pendingRef.current = desired;
      return;
    }

    const elapsed = performance.now() - lastSentAtRef.current;
    if (elapsed >= THROTTLE_MS) {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      flushNow(ws, desired, lastSentAtRef);
    } else {
      pendingRef.current = desired;
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          const target = pendingRef.current;
          pendingRef.current = null;
          if (target && ws.readyState === WebSocket.OPEN) {
            flushNow(ws, target, lastSentAtRef);
          }
        }, THROTTLE_MS - elapsed);
      }
    }
  }, [frame]);
}

function flushNow(
  ws: WebSocket,
  frame: WarlsFrame,
  lastSentAtRef: { current: number }
): void {
  const frames: Record<string, WireLed[]> = {};
  for (const [deviceId, deviceFrame] of frame) {
    if (deviceFrame.size === 0) continue;
    const leds: WireLed[] = [];
    for (const [idx, c] of deviceFrame) {
      leds.push({ idx, r: c.r, g: c.g, b: c.b });
    }
    frames[deviceId] = leds;
  }
  try {
    ws.send(JSON.stringify({ type: "set", frames } satisfies SetMessage));
    lastSentAtRef.current = performance.now();
  } catch {
    // socket gone
  }
}
