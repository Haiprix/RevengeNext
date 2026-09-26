let container: any
const PLUGIN_ID = 'dev.kmmiio99o.declutter'

export function initKmmiioLib(api: any) {
	container = api
}

/**
 * The library instance, read through the api on every call.
 *
 * The api object is stable but `unscoped.kmmiio` is filled in by the lib
 * plugin's `decorate`, which can land after this plugin's `start` runs. Holding
 * the value instead of the api would freeze `undefined` into the stash and
 * every later call, `forceLoadLazySheets` among them, would stay a no-op.
 */
export function kmmiioLib(): any {
	return container?.unscoped?.kmmiio
}

function log(module: string, action: string, found: boolean) {
	kmmiioLib()?.logUsage?.(PLUGIN_ID, module, action, found)
}

export function getDefaultNameFilter(name: string) {
	const result = kmmiioLib()?.getDefaultNameFilter(name)
	log('filter:defaultName', 'create', result != null)
	return result
}

export function getPropsFilter(...props: string[]) {
	const result = kmmiioLib()?.getPropsFilter(...props)
	log('filter:props', 'create', result != null)
	return result
}

export function getProfileFrameComponentFilter() {
	const result = kmmiioLib()?.getProfileFrameComponentFilter()
	log('filter:profileFrame', 'create', result != null)
	return result
}

export function resolveComponent(exports: any): any {
	return kmmiioLib()?.resolveComponent(exports)
}

export function safeInstead<
	Parent extends Record<Key, any>,
	Key extends keyof Parent,
>(
	parent: Parent,
	key: Key,
	hook: (args: any[], original: Parent[Key]) => any,
): () => void {
	const result = kmmiioLib()?.safeInstead(parent, key, hook)
	log('patcher:instead', 'patch', result != null && result !== (() => {}))
	return result ?? (() => {})
}

export function safeInsteadJSX(
	component: any,
	hook: (args: any[], jsx: any) => any,
): () => void {
	const result = kmmiioLib()?.safeInsteadJSX(component, hook)
	log('patcher:insteadJSX', 'patch', result != null && result !== (() => {}))
	return result ?? (() => {})
}

export function safeAfterJSX(
	component: any,
	hook: (element: any) => any,
): () => void {
	const result = kmmiioLib()?.safeAfterJSX(component, hook)
	log('patcher:afterJSX', 'patch', result != null && result !== (() => {}))
	return result ?? (() => {})
}

export function onModule(
	filter: any,
	cb: (namespace: any, id: number) => void,
): () => void {
	const result = kmmiioLib()?.onModule(filter, cb)
	log('finder:onModule', 'subscribe', result != null && result !== (() => {}))
	return result ?? (() => {})
}

export function onImportedPath<T = any>(
	path: string,
	cb: (namespace: T, id: number) => void,
): () => void {
	const result = kmmiioLib()?.onImportedPath(path, cb)
	log(
		'finder:onImportedPath',
		'subscribe',
		result != null && result !== (() => {}),
	)
	return result ?? (() => {})
}
