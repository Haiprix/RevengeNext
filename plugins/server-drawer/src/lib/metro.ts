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

// Resolves the lazy create-guild ActionCreators the way the stock GuildsBar
// button does. Returns an opener that force-initializes the chunk and fires
// openCreateGuildModal() once the module is ready. Candidate ids come from
// GuildsBarCreateJoinButton's runtime dependency map, static 12187 as a
// last resort (verified to resolve openCreateGuildModal on device).
export function findLazyCreateOpener(
	log: (msg: string) => void,
): (() => void) | undefined {
	try {
		let deps: readonly (number | string)[] | undefined
		try {
			const tuple =
				revenge.discord.utils.modules.finders.lookupModuleWithImportedPath(
					'modules/guilds_bar/native/GuildsBarCreateJoinButton.tsx',
				)
			const gbId = tuple?.[1]
			if (typeof gbId === 'number') {
				deps = getModuleDependencies(gbId)
			}
		} catch {
			// ignore
		}
		const derived = deps ?? []
		log(
			`guildsBar deps = ${
				derived.length > 0 ? derived.join(',') : 'MISS'
			} len=${derived.length}`,
		)

		// GuildsBar loads paths[8] first, then paths[10] (the ActionCreators).
		// Prefer the derived ids in that order, static 12187 as a last resort.
		const candidates = [
			...(typeof derived[10] === 'number' ? [derived[10] as number] : []),
			...(typeof derived[8] === 'number' ? [derived[8] as number] : []),
			12187,
		].filter((id, i, arr) => typeof id === 'number' && arr.indexOf(id) === i)

		for (const id of candidates) {
			log(`candidate ${id}: via=lookup.initialize`)
			try {
				const ns = lookupModule(withModuleIds([id]), {
					cached: false,
					initialize: true,
				})[0]
				const open =
					ns?.default?.openCreateGuildModal ?? ns?.openCreateGuildModal
				if (typeof open === 'function') {
					log(`candidate ${id}: openCreateGuildModal resolved`)
					return () => {
						try {
							open()
							log(`create: fired openCreateGuildModal (runtime id ${id})`)
						} catch (e) {
							log(`create: runtime threw ${String(e)}`)
						}
					}
				}
			} catch {
				// ignore
			}
		}

		log(`create: no candidate opened`)
		return undefined
	} catch (e) {
		log(`create: findLazyCreateOpener threw ${String(e)}`)
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
