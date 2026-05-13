/**
 * This file was @generated using pocketbase-typegen
 *
 * DO NOT EDIT BY HAND.
 *
 * Regenerate with:
 *   npx pocketbase-typegen --db ../../apps/server/pb_data/data.db --out src/lib/api/types.ts
 *
 * Run after every backend migration, then `npx tsc --noEmit` to catch breakage.
 */

import type PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";

export type IsoDateString = string;
export type IsoAutoDateString = string;
export type RecordIdString = string;
export type FileNameString = string;

export enum Collections {
  Devices = "devices",
  Items = "items",
  Cells = "cells",
  Assignments = "assignments",
}

export type BaseSystemFields<T = never> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
  expand?: T;
};

export type AuthSystemFields<T = never> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// ---- devices ---------------------------------------------------------------

export type DevicesRecord = {
  name: string;
  url: string;
  led_count?: number;
  grid_width?: number;
  grid_height?: number;
  is_online?: boolean;
  last_seen?: IsoDateString;
  created: IsoAutoDateString;
  updated: IsoAutoDateString;
};

export type DevicesResponse<Texpand = unknown> = Required<DevicesRecord> &
  BaseSystemFields<Texpand>;

// ---- items -----------------------------------------------------------------

export type ItemsRecord = {
  name: string;
  description?: string;
  quantity: number;
  image?: FileNameString;
  category?: string;
  datasheet_url?: string;
  created: IsoAutoDateString;
  updated: IsoAutoDateString;
};

export type ItemsResponse<Texpand = unknown> = Required<ItemsRecord> &
  BaseSystemFields<Texpand>;

// ---- cells -----------------------------------------------------------------

export type CellsRecord = {
  device_id: RecordIdString;
  led_index: number;
  label?: string;
  created: IsoAutoDateString;
  updated: IsoAutoDateString;
};

export type CellsResponse<Texpand = unknown> = Required<CellsRecord> &
  BaseSystemFields<Texpand>;

// ---- assignments -----------------------------------------------------------

export type AssignmentsRecord = {
  item_id: RecordIdString;
  cell_id: RecordIdString;
  quantity: number;
  created: IsoAutoDateString;
  updated: IsoAutoDateString;
};

export type AssignmentsResponse<Texpand = unknown> =
  Required<AssignmentsRecord> & BaseSystemFields<Texpand>;

// ---- index types -----------------------------------------------------------

export type CollectionRecords = {
  devices: DevicesRecord;
  items: ItemsRecord;
  cells: CellsRecord;
  assignments: AssignmentsRecord;
};

export type CollectionResponses = {
  devices: DevicesResponse;
  items: ItemsResponse;
  cells: CellsResponse;
  assignments: AssignmentsResponse;
};

// ---- helpers ---------------------------------------------------------------

type StripAuto<T> = Omit<T, "id" | "collectionId" | "collectionName" | "expand" | "created" | "updated">;
type FileFields<T> = { [K in keyof T]: T[K] extends FileNameString ? File | null : T[K] };

export type Create<C extends keyof CollectionRecords> = FileFields<StripAuto<CollectionRecords[C]>>;
export type Update<C extends keyof CollectionRecords> = Partial<Create<C>>;

export type TypedPocketBase = PocketBase & {
  collection<T extends keyof CollectionResponses>(
    idOrName: T
  ): RecordService<CollectionResponses[T]>;
};
