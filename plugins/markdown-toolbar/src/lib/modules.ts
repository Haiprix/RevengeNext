let container: any
const PLUGIN_ID = 'dev.kmmiio99o.markdown.toolbar'

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

export function getDisplayNameFilter(name: string) {
	const result = kmmiioLib()?.getDisplayNameFilter(name)
	log('filter:displayName', 'create', result != null)
	return result
}

export function resolveComponent(exports: any): any {
	return kmmiioLib()?.resolveComponent(exports)
}
