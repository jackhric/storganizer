import type { ItemsResponse } from "@/lib/api/types";
import type { ItemExpand } from "@/lib/api/collections";

export type ExternalLink = { label: string; url: string };

export type ItemsTyped = ItemsResponse<ExternalLink[], ItemExpand>;
