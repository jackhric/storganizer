import PocketBase from "pocketbase";
import type { TypedPocketBase } from "./types";

const PB_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090";

export const pb = new PocketBase(PB_URL) as TypedPocketBase;
