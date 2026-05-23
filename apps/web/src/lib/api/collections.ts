import { pb } from "./client";
import type {
  DevicesResponse,
  ItemsResponse,
  CellsResponse,
  AssignmentsResponse,
  Create,
  Update,
} from "./types";

// ---- devices ---------------------------------------------------------------

export async function getDevices(): Promise<DevicesResponse[]> {
  return pb.collection("devices").getFullList<DevicesResponse>({ sort: "name" });
}

export async function getDevice(id: string): Promise<DevicesResponse> {
  return pb.collection("devices").getOne<DevicesResponse>(id);
}

export async function createDevice(data: { name: string; url: string }) {
  return pb.collection("devices").create<DevicesResponse>(data);
}

export async function updateDevice(id: string, data: Update<"devices">) {
  return pb.collection("devices").update<DevicesResponse>(id, data);
}

export async function deleteDevice(id: string) {
  return pb.collection("devices").delete(id);
}

// ---- items -----------------------------------------------------------------

export type ItemWithAssignmentsExpand = {
  assignments_via_item_id?: AssignmentsResponse[];
};

export async function getItems(
  filter?: string
): Promise<ItemsResponse<unknown, unknown, ItemWithAssignmentsExpand>[]> {
  return pb
    .collection("items")
    .getFullList<ItemsResponse<unknown, unknown, ItemWithAssignmentsExpand>>({
      sort: "name",
      filter,
      expand: "assignments_via_item_id",
    });
}

export async function getItem(id: string): Promise<ItemsResponse> {
  return pb.collection("items").getOne<ItemsResponse>(id);
}

export async function createItem(data: Create<"items">) {
  return pb.collection("items").create<ItemsResponse>(data);
}

export async function updateItem(id: string, data: Update<"items">) {
  return pb.collection("items").update<ItemsResponse>(id, data);
}

export async function deleteItem(id: string) {
  return pb.collection("items").delete(id);
}

// ---- cells -----------------------------------------------------------------

export async function getCellsByDevice(deviceId: string): Promise<CellsResponse[]> {
  return pb.collection("cells").getFullList<CellsResponse>({
    filter: `device_id = "${deviceId}"`,
    sort: "led_index",
  });
}

// ---- assignments -----------------------------------------------------------

export async function getAssignmentsByItem(
  itemId: string
): Promise<AssignmentsResponse<{ cell: CellsResponse<{ device: DevicesResponse }> }>[]> {
  return pb
    .collection("assignments")
    .getFullList({
      filter: `item_id = "${itemId}"`,
      expand: "cell_id,cell_id.device_id",
    });
}

export type AssignmentWithItemExpand = {
  item_id?: ItemsResponse;
};

export async function getAssignmentsByDevice(
  deviceId: string
): Promise<AssignmentsResponse<AssignmentWithItemExpand>[]> {
  return pb
    .collection("assignments")
    .getFullList<AssignmentsResponse<AssignmentWithItemExpand>>({
      filter: `cell_id.device_id = "${deviceId}"`,
      expand: "item_id",
    });
}

export async function createAssignment(data: Create<"assignments">) {
  return pb.collection("assignments").create<AssignmentsResponse>(data);
}

export async function updateAssignment(id: string, data: Update<"assignments">) {
  return pb.collection("assignments").update<AssignmentsResponse>(id, data);
}

export async function deleteAssignment(id: string) {
  return pb.collection("assignments").delete(id);
}
