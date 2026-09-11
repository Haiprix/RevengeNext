let kmmiio: any
const PLUGIN_ID = 'dev.kmmiio99o.message-tweaks'

export function initKmmiioLib(api: any) {
	kmmiio = api
}

function log(module: string, action: string, found: boolean) {
	kmmiio?.logUsage?.(PLUGIN_ID, module, action, found)
}

export function isComponentType(v: any): boolean {
	return kmmiio?.isComponentType(v) ?? false
}

export function resolveComponent(exports: any): any {
	return kmmiio?.resolveComponent(exports)
}

export function getDisplayNameFilter(name: string) {
	const result = kmmiio?.getDisplayNameFilter(name)
	log('filter:displayName', 'create', result != null)
	return result
}

export function getPropsFilter(...props: string[]) {
	const result = kmmiio?.getPropsFilter(...props)
	log('filter:props', 'create', result != null)
	return result
}

export function getUserStore(): any {
	const result = kmmiio?.getUserStore?.()
	log('store:UserStore', 'resolve', result != null)
	return result
}

export function getCurrentUserId(): string | undefined {
	try {
		return getUserStore()?.getCurrentUser?.()?.id
	} catch {
		return undefined
	}
}

export function getIcon(name: string): () => any {
	const result = kmmiio?.getIcon(name)
	log('icon', `resolve:${name}`, result != null)
	return result
}

/** Load a Discord module by its stable source path and call `cb` once resolved. */
export function onImportedPath<T = any>(
	path: string,
	cb: (namespace: T) => void,
): () => void {
	const result = kmmiio?.onImportedPath?.(path, cb)
	log('finder:importedPath', path, result != null)
	return result ?? (() => {})
}

export function forceInitModule(filter: any): void {
	kmmiio?.forceInitModule?.(filter)
}

let channelMessages: any

export function getChannelMessagesCache(): any {
	if (!channelMessages) {
		try {
			kmmiio?.onImportedPath?.('lib/ChannelMessages.tsx', (ns: any) => {
				channelMessages = ns?.default ?? ns
			})
		} catch {}
	}
	return channelMessages
}

export function onChannelMessages(cb: (cache: any) => void): () => void {
	return onImportedPath('lib/ChannelMessages.tsx', (ns: any) => {
		channelMessages = ns?.default ?? ns
		cb(channelMessages)
	})
}
