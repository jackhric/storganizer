import type { ItemsResponse } from "@/lib/api/types";
import type { ItemWithAssignmentsExpand } from "@/lib/api/collections";

export type ExternalLink = { label: string; url: string };

export type ItemsTyped = ItemsResponse<ExternalLink[], string[], ItemWithAssignmentsExpand>;
