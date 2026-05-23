"use client";

import { useEffect, useRef } from "react";
import { pb } from "@/lib/api/client";
import type { Rgb } from "@/lib/color/oklch";

const THROTTLE_MS = 33; // ~30fps — UDP send rate to WLED

/**
 * Pushes a desired LED frame to the backend hover-stream WebSocket. The
 * connection opens on mount/deviceId change and closes on unmount. Frames
 * are throttled to ~30fps; the last frame is always flushed (no dropped
 * end state). The backend tracks the previous frame per-connection and
 * extinguishes LEDs that leave the frame.
 *
 * Pass an empty map to indicate "no overlay" — the strip goes dark and
 * WLED's realtime timeout then restores the previous effect.
 */
export function useWledFrameSender(
  deviceId: string | null,
  frame: Map<number, Rgb>,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const lastSentAtRef = useRef(0);
  const pendingFrameRef = useRef<Map<number, Rgb> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hold the latest frame in a ref so the send function (defined inside the
  // socket effect) always reads the freshest value.
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    if (!deviceId) return;

    const wsUrl = pb.baseURL.replace(/^http/, "ws") + `/api/devices/${deviceId}/hover-stream`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      pendingFrameRef.current = null;
      // Best-effort: send an empty frame so the backend extinguishes
      // anything still lit before the WS closes.
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: "frame", leds: [] })); } catch { /* socket gone */ }
      }
      ws.close();
      socketRef.current = null;
    };
  }, [deviceId]);

  // On every frame change, schedule a throttled send.
  useEffect(() => {
    pendingFrameRef.current = frame;

    const send = () => {
      const target = pendingFrameRef.current;
      pendingFrameRef.current = null;
      lastSentAtRef.current = performance.now();
      flushTimerRef.current = null;

      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !target) return;

      const leds = Array.from(target.entries()).map(([idx, c]) => ({
        idx, r: c.r, g: c.g, b: c.b,
      }));
      ws.send(JSON.stringify({ type: "frame", leds }));
    };

    const elapsed = performance.now() - lastSentAtRef.current;
    if (elapsed >= THROTTLE_MS) {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      send();
    } else if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(send, THROTTLE_MS - elapsed);
    }
  }, [frame]);
}
