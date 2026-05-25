"use client";

import { useEffect, useRef } from "react";
import { pb } from "@/lib/api/client";
import type { Rgb } from "@/lib/color/oklch";

const THROTTLE_MS = 33;
// WLED's WARLS realtime timeout is ~1s. Re-send the last frame at this cadence
// when no new frames arrive, so the strip holds its state indefinitely.
const KEEPALIVE_MS = 750;

export type WarlsDeviceFrame = Map<number, Rgb>;
export type WarlsFrame = Map<string, WarlsDeviceFrame>;

type DeviceSocket = {
  ws: WebSocket;
  flushTimer: ReturnType<typeof setTimeout> | null;
  keepaliveTimer: ReturnType<typeof setInterval> | null;
  pending: WarlsDeviceFrame | null;
  lastFrame: WarlsDeviceFrame;
  lastSentAt: number;
};

const EMPTY_DEVICE_FRAME: WarlsDeviceFrame = new Map();

/**
 * Streams the desired LED state to one or more WLED devices over WARLS UDP via
 * the backend hover-stream WebSocket. The outer map is keyed by device id;
 * each inner map holds the LED indices that should be lit on that device.
 *
 * A device that drops out of the outer map (or whose inner map becomes empty)
 * has its socket sent a final empty frame and then closed — WLED's realtime
 * timeout restores the previous effect ~1s later.
 *
 * Pass `null` to silence and disconnect everything.
 */
export function useWarls(frame: WarlsFrame | null): void {
  const socketsRef = useRef<Map<string, DeviceSocket>>(new Map());

  const frameRef = useRef<WarlsFrame | null>(frame);
  frameRef.current = frame;

  useEffect(() => {
    const sockets = socketsRef.current;
    const desired = frame ?? new Map<string, WarlsDeviceFrame>();

    for (const deviceId of sockets.keys()) {
      if (!desired.has(deviceId)) closeSocket(sockets, deviceId);
    }

    for (const [deviceId, deviceFrame] of desired) {
      let entry = sockets.get(deviceId);
      if (!entry) entry = openSocket(sockets, deviceId);
      scheduleSend(entry, deviceFrame);
    }
  }, [frame]);

  useEffect(() => {
    const sockets = socketsRef.current;
    return () => {
      for (const deviceId of Array.from(sockets.keys())) {
        closeSocket(sockets, deviceId);
      }
    };
  }, []);
}

function openSocket(sockets: Map<string, DeviceSocket>, deviceId: string): DeviceSocket {
  const wsUrl = pb.baseURL.replace(/^http/, "ws") + `/api/devices/${deviceId}/hover-stream`;
  const ws = new WebSocket(wsUrl);
  const entry: DeviceSocket = {
    ws,
    flushTimer: null,
    keepaliveTimer: null,
    pending: null,
    lastFrame: EMPTY_DEVICE_FRAME,
    lastSentAt: 0,
  };
  sockets.set(deviceId, entry);

  ws.addEventListener("open", () => {
    if (entry.pending) flushNow(entry);
  });
  entry.keepaliveTimer = setInterval(() => {
    if (entry.lastFrame.size === 0) return;
    if (entry.pending !== null) return;
    if (performance.now() - entry.lastSentAt < KEEPALIVE_MS) return;
    entry.pending = entry.lastFrame;
    flushNow(entry);
  }, KEEPALIVE_MS);
  return entry;
}

function closeSocket(sockets: Map<string, DeviceSocket>, deviceId: string): void {
  const entry = sockets.get(deviceId);
  if (!entry) return;
  if (entry.flushTimer) clearTimeout(entry.flushTimer);
  if (entry.keepaliveTimer) clearInterval(entry.keepaliveTimer);
  entry.flushTimer = null;
  entry.keepaliveTimer = null;
  entry.pending = null;
  if (entry.ws.readyState === WebSocket.OPEN) {
    try {
      entry.ws.send(JSON.stringify({ type: "frame", leds: [] }));
    } catch {
      // socket gone
    }
  }
  entry.ws.close();
  sockets.delete(deviceId);
}

function scheduleSend(entry: DeviceSocket, deviceFrame: WarlsDeviceFrame): void {
  entry.pending = deviceFrame;
  const elapsed = performance.now() - entry.lastSentAt;
  if (elapsed >= THROTTLE_MS) {
    if (entry.flushTimer) {
      clearTimeout(entry.flushTimer);
      entry.flushTimer = null;
    }
    flushNow(entry);
  } else if (!entry.flushTimer) {
    entry.flushTimer = setTimeout(() => flushNow(entry), THROTTLE_MS - elapsed);
  }
}

function flushNow(entry: DeviceSocket): void {
  const target = entry.pending ?? EMPTY_DEVICE_FRAME;
  entry.pending = null;
  entry.flushTimer = null;
  entry.lastFrame = target;
  entry.lastSentAt = performance.now();
  if (entry.ws.readyState !== WebSocket.OPEN) return;
  const leds = Array.from(target.entries()).map(([idx, c]) => ({
    idx,
    r: c.r,
    g: c.g,
    b: c.b,
  }));
  try {
    entry.ws.send(JSON.stringify({ type: "frame", leds }));
  } catch {
    // socket gone
  }
}
