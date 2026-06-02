"use client";

import {
  getListItemsQueryKey,
  useCreateItem as useCreateItemGenerated,
  useUpdateItem as useUpdateItemGenerated,
} from "@/lib/api/generated/items";
import type {
  BodyCreateItem,
  BodyUpdateItem,
} from "@/lib/api/generated/storganizerAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Higher-level item payload — uses native arrays / objects where the multipart
 * spec only allows JSON-encoded strings. The hooks below serialize as needed.
 */
export type ItemFormPayload = {
  name: string;
  store_url?: string;
  notes?: string;
  tags?: string[];
  external_links?: unknown;
  image?: File | null;
};

function toCreateBody(payload: ItemFormPayload): BodyCreateItem {
  return {
    name: payload.name,
    store_url: payload.store_url,
    notes: payload.notes,
    tags: payload.tags !== undefined ? JSON.stringify(payload.tags) : undefined,
    external_links:
      payload.external_links !== undefined
        ? JSON.stringify(payload.external_links)
        : undefined,
    image: payload.image ?? undefined,
  };
}

function toUpdateBody(payload: Partial<ItemFormPayload>): BodyUpdateItem {
  return {
    name: payload.name,
    store_url: payload.store_url,
    notes: payload.notes,
    tags: payload.tags !== undefined ? JSON.stringify(payload.tags) : undefined,
    external_links:
      payload.external_links !== undefined
        ? JSON.stringify(payload.external_links)
        : undefined,
    image: payload.image ?? undefined,
  };
}

export function useCreateItem() {
  const qc = useQueryClient();
  const mutation = useCreateItemGenerated({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListItemsQueryKey() }),
    },
  });
  return {
    ...mutation,
    mutate: (payload: ItemFormPayload) =>
      mutation.mutate({ data: toCreateBody(payload) }),
    mutateAsync: (payload: ItemFormPayload) =>
      mutation.mutateAsync({ data: toCreateBody(payload) }),
  };
}

export function useUpdateItem() {
  const qc = useQueryClient();
  const mutation = useUpdateItemGenerated({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListItemsQueryKey() }),
    },
  });
  return {
    ...mutation,
    mutate: ({ id, payload }: { id: string; payload: Partial<ItemFormPayload> }) =>
      mutation.mutate({ itemId: id, data: toUpdateBody(payload) }),
    mutateAsync: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ItemFormPayload>;
    }) => mutation.mutateAsync({ itemId: id, data: toUpdateBody(payload) }),
  };
}
