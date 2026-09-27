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
 * The live plugin list is authoritative whenever it is reachable: it reflects
 * uninstalls, which nothing on disk can. The storage directory is only a
 * fallback for when that list is unavailable, and it must never be combined
 * with the list check, because a plugin's storage directory outlives an
 * uninstall and would then report a removed plugin as still installed.
 */
export function isPluginInstalled(id: string): boolean {
	try {
		if (typeof pList?.has === 'function') return pList.has(id) === true
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

/**
 * Whether a plugin is running in this process right now.
 *
 * Unlike `isPluginInstalled`, this is driven by the plugin's own lifecycle
 * rather than inferred: plugins register from `start` and unregister from
 * `stop`. It therefore reflects a disable or an uninstall immediately, needs
 * neither the hidden developer API nor a disk heuristic, and cannot report a
 * plugin that has only ever run before.
 */
export function isPluginRunning(id: string): boolean {
	return registry.has(id)
}

export function unregisterPlugin(id: string) {
	if (registry.delete(id)) notify()
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
