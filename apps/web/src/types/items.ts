import type { ItemsResponse } from "@/lib/api/types";

export type ExternalLink = { label: string; url: string };

export type ItemsTyped = ItemsResponse<ExternalLink[], string[]>;
