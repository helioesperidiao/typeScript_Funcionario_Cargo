// src/logging/requestStore.ts
import { AsyncLocalStorage } from "async_hooks";

export interface RequestStore {
    requestId: string;
    step: number;
}

export const requestStore = new AsyncLocalStorage<RequestStore>();