import { withStoreName } from '@revenge-mod/discord/flux'
import { lookupModule, lookupModules } from '@revenge-mod/modules/finders'
import {
	createFilterGenerator,
	FilterScopes,
	withDependencies,
	withName,
	withProps,
} from '@revenge-mod/modules/finders/filters'
import { getModuleDependencies } from '@revenge-mod/modules/metro'

// Mirrors the working serverdrawer (revenge-plugins) finder strategy:
// plain lookupModule with { cached: false }, and a dependency-walk to reach
// lazy-chunked modules that only import from a known initialized store.

export function findModuleByProps(...props: string[]): any {
	if (props.length === 0) return undefined
	try {
		return lookupModule(withProps(props[0], ...props.slice(1)), {
			cached: false,
		})[0]
	} catch {
		return undefined
	}
}

export function findStoreModule(name: string): any {
	try {
		return lookupModule(withStoreName(name), { cached: false })[0]
	} catch {
		return undefined
	}
}

// Scope the filter to both initialised and uninitialised modules so the
// dependency-walk can target modules that are registered but not yet loaded.
const withModuleIds = createFilterGenerator<[number[]]>(
	([ids], id) => ids.includes(id),
	([ids]) => `server-drawer.dependencies(${ids.join(',')})`,
	FilterScopes.Initialized | FilterScopes.Uninitialized,
)

// Finds a module exporting all of `props`, initialising lazy modules that only
// depend on a known-initialised store (e.g. transitionToChannel).
function lookupUsingStore(
	storeName: string,
	filter: ReturnType<typeof withProps>,
): any {
	const direct = lookupModule(filter, { cached: false })[0]
	if (direct) return direct
	const stores = [storeName, 'GuildStore', 'UserSettingsProtoStore']
	const ids = [
		...new Set(
			stores.flatMap(name =>
				[...lookupModules(withStoreName(name), { cached: false })].map(
					([, id]: any) => id,
				),
			),
		),
	]
	for (const id of ids) {
		const dependency = withDependencies.unordered([id])
		for (const pattern of [
			dependency,
			withDependencies.unordered([dependency]),
		]) {
			const result = lookupModule(withDependencies(pattern).and(filter), {
				cached: false,
			})[0]
			if (result) return result
		}
	}
	return undefined
}

export function findModuleByPropsUsingStore(
	storeName: string,
	...props: string[]
): any {
	if (props.length === 0) return undefined
	try {
		return lookupUsingStore(storeName, withProps(props[0], ...props.slice(1)))
	} catch {
		return undefined
	}
}

// Finds a function with the exact export name; also handles default-exported
// named functions (the guilds bar util) and named functions nested anywhere in
// the exports object.
export function findFunctionByName(name: string): any {
	try {
		const target = lookupModule(withName(name), { cached: false })[0]
		if (typeof target === 'function' && target.name === name) return target
		if (target != null && typeof target === 'object') {
			const mod = target as Record<string, any>
			if (typeof mod.default === 'function' && mod.default.name === name) {
				return mod.default
			}
			for (const key of Object.keys(mod)) {
				const value = mod[key]
				if (typeof value === 'function' && value.name === name) return value
			}
		}
		return undefined
	} catch {
		return undefined
	}
}

// Walks (up to 2 levels of) module dependency ids to reach lazy modules that
// export `props`, without requiring the import tracker.
export function findModuleByPropsInDependencies(
	anchorProps: string[],
	...props: string[]
): any {
	if (anchorProps.length === 0 || props.length === 0) return undefined
	try {
		const direct = lookupModule(withProps(props[0], ...props.slice(1)), {
			cached: false,
		})[0]
		if (direct) return direct
		const filter = withProps(props[0], ...props.slice(1))
		let ids = [
			...lookupModules(withProps(anchorProps[0], ...anchorProps.slice(1)), {
				cached: false,
			}),
		].map(([, id]: any) => id)
		const visited = new Set(ids)
		for (let depth = 0; depth < 2; depth++) {
			ids = [
				...new Set(ids.flatMap(id => getModuleDependencies(id) ?? [])),
			].filter(id => !visited.has(id))
			ids.forEach(id => visited.add(id))
			if (ids.length === 0) return undefined
			const result = lookupModule(withModuleIds(ids).and(filter), {
				cached: false,
			})[0]
			if (result) return result
		}
		return undefined
	} catch {
		return undefined
	}
}
