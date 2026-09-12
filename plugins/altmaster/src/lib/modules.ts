let kmmiio: any

export function initKmmiioLib(api: any) {
	kmmiio = api
}

export function getUserStore(): any {
	return kmmiio?.getUserStore?.()
}

export function getCurrentUserId(): string | undefined {
	try {
		return getUserStore()?.getCurrentUser?.()?.id
	} catch {
		return undefined
	}
}

export function getIcon(name: string): (() => any) | undefined {
	return kmmiio?.getIcon?.(name)
}

export function getShowUserProfileActionSheet(): any {
	return kmmiio?.getShowUserProfileActionSheet?.()
}

export function forceLoadLazySheets(): void {
	kmmiio?.forceLoadLazySheets?.()
}

/** Resolve a Discord module by its stable source path and call `cb` once it's loaded. */
export function onImportedPath<T = any>(
	path: string,
	cb: (namespace: T) => void,
): () => void {
	const result = kmmiio?.onImportedPath?.(path, cb)
	return result ?? (() => {})
}

let react: any
let design: any
let alertActions: any

export function getReact(): any {
	if (!react) {
		try {
			react = (revenge as any).react
		} catch {}
	}
	return react
}

export function getDesign(): any {
	if (!design) {
		try {
			design = (revenge as any).discord?.design?.Design
		} catch {}
	}
	return design
}

export function getAlertActions(): any {
	if (!alertActions) {
		try {
			alertActions = (revenge as any).discord?.actions?.AlertActionCreators
		} catch {}
	}
	return alertActions
}
