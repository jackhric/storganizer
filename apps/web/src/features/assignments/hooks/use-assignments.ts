"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  assignmentsByDevice,
  getAssignmentsByDeviceQueryKey,
  useCreateAssignment,
  useDeleteAssignment,
  useMoveAssignment,
  useUpdateAssignment,
} from "@/lib/api/generated/assignments";
import { getListItemsQueryKey } from "@/lib/api/generated/items";
import type { ApiError } from "@/lib/api/mutator";
import type {
  AssignmentByDevice,
  ItemRead,
  ItemWithTags,
} from "@/lib/api/generated/storganizerAPI.schemas";

function isConflict(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 409;
}

/**
 * Assignment mutations for the grid, scoped to one device.
 *
 * Two jobs the page's raw orval hooks didn't do:
 *
 *  1. Optimistic cache writes. Plain `invalidateQueries` only schedules a
 *     refetch, so back-to-back drags read a stale `by-device` cache and can
 *     decide a cell is empty when the server has it occupied — which then
 *     trips the unique `cell_id` constraint (HTTP 409). We update the cache
 *     synchronously so the next drag sees the truth.
 *  2. A conflict-proof `occupyCell`. Even if the optimistic state is somehow
 *     wrong, a 409 is caught, the truth refetched, the real occupant deleted,
 *     and the create retried once — instead of bubbling up as an unhandled
 *     promise rejection.
 */
export function useAssignments(
  deviceId: string | null,
  items: ItemRead[] | undefined,
) {
  const qc = useQueryClient();

  const byDeviceKey = deviceId
    ? getAssignmentsByDeviceQueryKey(deviceId)
    : null;

  const readCache = useCallback(
    (): AssignmentByDevice[] =>
      byDeviceKey
        ? qc.getQueryData<AssignmentByDevice[]>(byDeviceKey) ?? []
        : [],
    [qc, byDeviceKey],
  );

  const writeCache = useCallback(
    (next: AssignmentByDevice[]) => {
      if (byDeviceKey) qc.setQueryData(byDeviceKey, next);
    },
    [qc, byDeviceKey],
  );

  // Both assignments and the item list show assignment state, so refetch both
  // once the server has settled.
  const invalidate = useCallback(() => {
    if (byDeviceKey) qc.invalidateQueries({ queryKey: byDeviceKey });
    qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
  }, [qc, byDeviceKey]);

  const createAssignment = useCreateAssignment({
    mutation: { onSettled: invalidate },
  });
  const deleteAssignment = useDeleteAssignment({
    mutation: { onSettled: invalidate },
  });
  const updateAssignment = useUpdateAssignment({
    mutation: { onSettled: invalidate },
  });
  const moveAssignment = useMoveAssignment({
    mutation: { onSettled: invalidate },
  });

  // Build the optimistic `item` payload the grid + cell pane read for a
  // freshly-created assignment. ItemRead is a superset of ItemWithTags.
  const itemFor = useCallback(
    (itemId: string): ItemWithTags | null => {
      const item = items?.find((i) => i.id === itemId);
      return item ? (item as ItemWithTags) : null;
    },
    [items],
  );

  /**
   * Place `itemId` on `cellId`, replacing whatever is there. Optimistic, with
   * a 409 safety net: if the create collides because our cache was stale, we
   * refetch the real state, delete the real occupant, and retry the create
   * once.
   */
  const occupyCell = useCallback(
    async (cellId: string, itemId: string) => {
      const snapshot = readCache();
      const existing = snapshot.find((a) => a.cell_id === cellId);

      // Optimistic: drop the old occupant, add the new one.
      const optimistic: AssignmentByDevice = {
        id: `optimistic-${cellId}`,
        created_at: "",
        updated_at: "",
        item_id: itemId,
        cell_id: cellId,
        quantity: 1,
        item: itemFor(itemId),
      };
      writeCache([
        ...snapshot.filter((a) => a.cell_id !== cellId),
        optimistic,
      ]);

      const doDeleteThenCreate = async (occupantId: string | undefined) => {
        if (occupantId) {
          await deleteAssignment.mutateAsync({ assignmentId: occupantId });
        }
        await createAssignment.mutateAsync({
          data: { cell_id: cellId, item_id: itemId, quantity: 1 },
        });
      };

      try {
        await doDeleteThenCreate(existing?.id);
      } catch (error) {
        if (!isConflict(error)) {
          writeCache(snapshot); // rollback
          throw error;
        }
        // Stale cache: someone/something already holds this cell. Refetch the
        // truth, delete the real occupant, retry the create once.
        if (!deviceId) throw error;
        const fresh = await assignmentsByDevice(deviceId);
        writeCache(fresh);
        const realOccupant = fresh.find((a) => a.cell_id === cellId);
        try {
          await doDeleteThenCreate(realOccupant?.id);
        } catch (retryError) {
          writeCache(snapshot); // rollback to pre-action state
          throw retryError;
        }
      }
    },
    [
      deviceId,
      readCache,
      writeCache,
      itemFor,
      createAssignment,
      deleteAssignment,
    ],
  );

  /** Move/swap an existing assignment between cells (server handles the swap). */
  const moveOrSwap = useCallback(
    async (fromCellId: string, toCellId: string) => {
      if (fromCellId === toCellId) return;
      const snapshot = readCache();

      // Optimistic move/swap on the cached rows.
      const source = snapshot.find((a) => a.cell_id === fromCellId);
      const target = snapshot.find((a) => a.cell_id === toCellId);
      if (source) {
        const next = snapshot.map((a) => {
          if (a.cell_id === fromCellId) return { ...a, cell_id: toCellId };
          if (target && a.cell_id === toCellId)
            return { ...a, cell_id: fromCellId };
          return a;
        });
        writeCache(next);
      }

      try {
        await moveAssignment.mutateAsync({
          data: { from_cell_id: fromCellId, to_cell_id: toCellId },
        });
      } catch (error) {
        writeCache(snapshot); // rollback
        throw error;
      }
    },
    [readCache, writeCache, moveAssignment],
  );

  /** Update an assignment's quantity. */
  const setQuantity = useCallback(
    (assignmentId: string, quantity: number) => {
      const snapshot = readCache();
      writeCache(
        snapshot.map((a) =>
          a.id === assignmentId ? { ...a, quantity } : a,
        ),
      );
      updateAssignment.mutate(
        { assignmentId, data: { quantity } },
        { onError: () => writeCache(snapshot) },
      );
    },
    [readCache, writeCache, updateAssignment],
  );

  /** Remove an assignment entirely. */
  const removeAssignment = useCallback(
    (assignmentId: string) => {
      const snapshot = readCache();
      writeCache(snapshot.filter((a) => a.id !== assignmentId));
      deleteAssignment.mutate(
        { assignmentId },
        { onError: () => writeCache(snapshot) },
      );
    },
    [readCache, writeCache, deleteAssignment],
  );

  return {
    occupyCell,
    moveOrSwap,
    setQuantity,
    removeAssignment,
  };
}
