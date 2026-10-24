// src/logging/requestStore.ts
import { AsyncLocalStorage } from "async_hooks";

export interface RequestStore {
    requestId: string;
    step: number;
}

/** Mantém metadados da requisição disponíveis em chamadas assíncronas encadeadas. */
export const requestStore = new AsyncLocalStorage<RequestStore>();