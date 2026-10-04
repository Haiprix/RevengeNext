import type { JsonStorage } from '@revenge-mod/json-storage'

export interface SilentEditStorage {
	overrideNative: boolean
}

export const DEFAULTS: SilentEditStorage = {
	overrideNative: true,
}

let storage: JsonStorage<SilentEditStorage> | undefined

export function setStorage(handle: JsonStorage<SilentEditStorage>) {
	storage = handle
}

// storage.cache is plain data (safe anywhere);
// storage.use() is a React hook and only works inside Settings.
export function getSettings(): SilentEditStorage {
	return { ...DEFAULTS, ...(storage?.cache ?? {}) }
}

// Message id that the "Silent Edit" button armed, consumed by the next edit.
let pendingMessageId: string | null = null

export function setPending(id: string | null) {
	pendingMessageId = id
}

export function isPending(id: string): boolean {
	return pendingMessageId === id
}

export function clearPending() {
	pendingMessageId = null
}