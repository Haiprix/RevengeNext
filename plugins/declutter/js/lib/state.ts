import { DEFAULTS } from '../defaults'
import type { JsonStorage } from '@revenge-mod/json-storage'
import type { DeclutterSettings } from '../types'

type RevengeJsonStorageApi<S extends object> = JsonStorage<S>

const SERVER_DRAWER_PLUGIN_ID = 'dev.kmmiio99o.server-drawer'

let storage: RevengeJsonStorageApi<DeclutterSettings> | undefined

export function setStorage(handle: RevengeJsonStorageApi<DeclutterSettings>) {
	storage = handle
}

export function getStorage() {
	return storage
}

// Server Drawer takes over Discord's Quest Dock as its own surface, so hiding
// the dock must never apply while that plugin is installed. Detection lives in
// kmmiio-lib, which handles the hidden plugin registry access and falls back
// to the filesystem when the developer API is unavailable.
export function isServerDrawerInstalled(): boolean {
	try {
		return (
			(globalThis as any).__kmmiio?.isPluginInstalled?.(
				SERVER_DRAWER_PLUGIN_ID,
			) === true
		)
	} catch {
		return false
	}
}

export function getSettings(): DeclutterSettings {
	const settings = { ...DEFAULTS, ...(storage?.cache ?? {}) }
	if (isServerDrawerInstalled()) {
		settings.questDock = false
	}
	return settings
}

export function setSettings(patch: Partial<DeclutterSettings>): void {
	storage?.set({ ...getSettings(), ...patch })
}
