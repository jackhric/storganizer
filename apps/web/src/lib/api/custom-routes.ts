import { pb } from "./client";

// ---- device sync -----------------------------------------------------------

export async function syncDevice(deviceId: string) {
  return pb.send<{ led_count: number; grid_width: number; grid_height: number }>(
    `/api/devices/${deviceId}/sync`,
    { method: "POST" }
  );
}

export async function syncDeviceCells(deviceId: string) {
  return pb.send<{ count: number }>(
    `/api/devices/${deviceId}/cells/sync`,
    { method: "POST" }
  );
}

export async function refreshDevices() {
  return pb.send<void>("/api/devices/refresh", { method: "POST" });
}

// ---- assignments -----------------------------------------------------------

export async function moveAssignment(fromCellId: string, toCellId: string) {
  return pb.send<void>("/api/assignments/move", {
    method: "POST",
    body: JSON.stringify({ from_cell_id: fromCellId, to_cell_id: toCellId }),
    headers: { "Content-Type": "application/json" },
  });
}
