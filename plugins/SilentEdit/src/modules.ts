import { dbg } from './log'

let container: any

export function initKmmiioLib(api: any) {
	container = api
}

// The lib is filled in by kmmiio Library's own startup, which can land AFTER
// this plugin's `start`. So read it on every call, never cache it.
export function kmmiioLib(): any {
	return container?.unscoped?.kmmiio
}

/**
 * Load a Discord module by its source path and call `cb` once resolved.
 * If the lib isn't ready yet, retry for ~10s instead of silently doing nothing.
 */
export function onImportedPath<T = any>(
	path: string,
	cb: (namespace: T) => void,
): () => void {
	let cancelled = false
	let unsub: (() => void) | undefined
	let tries = 0

	const attempt = () => {
		if (cancelled) return
		const lib = kmmiioLib()
		if (lib?.onImportedPath) {
			unsub = lib.onImportedPath(path, cb)
			return
		}
		if (++tries < 50) setTimeout(attempt, 200)
		else dbg('lib', `kmmiio Library not found, skipped: ${path}`)
	}
	attempt()

	return () => {
		cancelled = true
		unsub?.()
	}
}

export function getIcon(name: string): any {
	return kmmiioLib()?.getIcon?.(name)
}

export function getPropsFilter(...props: string[]): any {
	return kmmiioLib()?.getPropsFilter?.(...props)
}

export function forceInitModule(filter: any): void {
	kmmiioLib()?.forceInitModule?.(filter)
}

export function getCurrentUserId(): string | undefined {
	try {
		return kmmiioLib()?.getUserStore?.()?.getCurrentUser?.()?.id
	} catch {
		return undefined
	}
}
