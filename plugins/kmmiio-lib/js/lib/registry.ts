import { existsSync } from '@revenge-mod/modules/native/fs'
import { pList } from '@revenge-mod/plugins/_'
import { pluginStorageDirFor } from '@revenge-mod/plugins/constants'

export interface RegisteredPlugin {
	id: string
	name: string
	description: string
	author?: string
	icon?: string
	version: { nums: number[]; label?: string }
	getStatus: () => number
	getErrors: () => readonly unknown[]
}

/**
 * Whether a plugin is installed.
 *
 * Looks it up in the live plugin registry first. That registry is exposed
 * through the hidden developer API (available when the "Developer Mode"
 * plugin `revenge.api.hidden` is enabled), so it degrades to checking the
 * plugin's storage directory on disk via the public fs/constants APIs when
 * Developer Mode is off.
 */
export function isPluginInstalled(id: string): boolean {
	try {
		if (typeof pList?.has === 'function' && pList.has(id) === true) return true
	} catch {}

	try {
		return existsSync(pluginStorageDirFor(id)) === true
	} catch {
		return false
	}
}

const registry = new Map<string, RegisteredPlugin>()
const listeners = new Set<() => void>()

function notify() {
	console.log(
		'[kmmiio-lib] registry: notify, size:',
		registry.size,
		'keys:',
		Array.from(registry.keys()),
	)
	for (const fn of listeners) fn()
}

export function registerPlugin(plugin: RegisteredPlugin) {
	console.log(
		'[kmmiio-lib] registry: registerPlugin called, id:',
		plugin.id,
		'name:',
		plugin.name,
	)
	registry.set(plugin.id, plugin)
	notify()
}

export function getRegisteredPlugin(id: string): RegisteredPlugin | undefined {
	const result = registry.get(id)
	console.log(
		'[kmmiio-lib] registry: getRegisteredPlugin(',
		id,
		') =>',
		result?.name ?? 'undefined',
	)
	return result
}

export function getAllRegisteredPlugins(): RegisteredPlugin[] {
	return Array.from(registry.values())
}

export function onRegistryChange(fn: () => void): () => void {
	console.log(
		'[kmmiio-lib] registry: onRegistryChange listener added, current size:',
		registry.size,
	)
	listeners.add(fn)
	return () => {
		listeners.delete(fn)
	}
}
