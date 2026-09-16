export const defaults = {
	hideDmTile: false,
	showGuildNames: false,
}

export type ServerDrawerStorage = typeof defaults

let storageRef: any
export function setStorageRef(ref: any): void {
	storageRef = ref
}

export function snapshot(): ServerDrawerStorage {
	return { ...defaults, ...(storageRef?.cache ?? {}) }
}

export function reactive(): ServerDrawerStorage {
	return { ...defaults, ...(storageRef?.use() ?? {}) }
}

export function findModule(
	predicate: (exports: any) => boolean,
): any | undefined {
	try {
		const generator = revenge.modules.finders.filters.createFilterGenerator(
			(args: [(e: any) => boolean], _id: number, exports: any) => {
				if (exports == null) return false
				const [match] = args
				try {
					return match(exports)
				} catch {
					return false
				}
			},
			() => `server-drawer.findModule`,
		)
		const [exports] = revenge.modules.finders.lookupModule(
			generator(predicate),
			{ cached: false },
		)
		return exports ?? undefined
	} catch {
		return undefined
	}
}

export function findByProps(...props: string[]): any {
	return findModule(exports =>
		props.every(p => typeof exports?.[p] !== 'undefined'),
	)
}

const importedCache = new Map<string, any>()

export function byImported(path: string): any {
	const cached = importedCache.get(path)
	if (cached !== undefined) return cached
	try {
		const [exports] =
			revenge.discord.utils.modules.finders.lookupModuleWithImportedPath(path)
		if (exports != null) {
			importedCache.set(path, exports)
			return exports
		}
		return undefined
	} catch {
		return undefined
	}
}

export function getFluxStore(storeName: string): any {
	try {
		return revenge.discord.flux.Stores[storeName]
	} catch {
		return undefined
	}
}

export function useFluxStore<T>(
	storeName: string,
	select: (store: any) => T,
	fallback: T,
): T {
	const React = revenge.react.React

	const selectRef = React.useRef(select)
	selectRef.current = select
	const latestRef = React.useRef<T | undefined>(undefined)
	const mountedRef = React.useRef(false)
	const [, force] = React.useState(0)

	React.useEffect(() => {
		const store = getFluxStore(storeName)
		if (store != null && typeof store.addReactChangeListener === 'function') {
			const onChange = () => {
				let next: T
				try {
					next = selectRef.current(store)
				} catch {
					next = fallback
				}
				if (!Object.is(latestRef.current, next)) {
					latestRef.current = next
					force(v => v + 1)
				}
			}
			onChange()
			store.addReactChangeListener(onChange)
			return () => {
				try {
					store.removeReactChangeListener(onChange)
				} catch {
					// ignore
				}
			}
		}
		return
	}, [storeName])

	let current: T
	try {
		current = select(getFluxStore(storeName))
	} catch {
		current = fallback
	}
	if (!mountedRef.current) {
		latestRef.current = current
		mountedRef.current = true
	}
	return Object.is(latestRef.current, current)
		? current
		: (latestRef.current = current)
}

let cachedMe: string | undefined
export function getME(): string | undefined {
	try {
		const found = (revenge as any).discord.common.constants.Constants?.ME
		if (typeof found === 'string' && found.length > 0) {
			cachedMe = found
			return found
		}
	} catch {
		// ignore
	}
	return cachedMe
}

export function haptic(kind: string): void {
	try {
		const haptics = byImported('modules/haptics/HapticUtils.native.tsx')
		haptics?.triggerHapticFeedback?.(haptics.HapticFeedbackTypes?.[kind])
	} catch {
		// ignore
	}
}

export function findIconComponent(...names: string[]): any {
	try {
		const lookup = (revenge as any).utils.discord?.lookupGeneratedIconComponent
		if (typeof lookup === 'function') {
			const comp = lookup(...names)
			if (typeof comp === 'function') return comp
		}
	} catch {
		// ignore
	}
	try {
		const tuple = revenge.modules.finders.lookupModule(
			(revenge as any).utils.discord.withGeneratedIconComponent(...names),
			{ cached: false },
		)
		const ns = tuple?.[0] ?? tuple
		const flat = ns?.[names[0]]
		if (typeof flat === 'function') return flat
		const def = ns?.default?.[names[0]]
		if (typeof def === 'function') return def
	} catch {
		// ignore
	}
	try {
		const { lookupModule } = revenge.modules.finders
		const { or, withProps } = revenge.modules.finders.filters
		const anyOr = or as (...filters: unknown[]) => any
		const propsFilters = names.map(name => withProps(name))
		const filter =
			propsFilters.length > 1 ? anyOr(...propsFilters) : propsFilters[0]
		const tuple = lookupModule(filter, {
			cached: false,
			initialize: true,
		})
		const ns = tuple?.[0] ?? tuple
		for (const name of names) {
			const flat = ns?.[name]
			if (typeof flat === 'function') return flat
			const def = ns?.default?.[name]
			if (typeof def === 'function') return def
		}
	} catch {
		// ignore
	}
	return undefined
}

export function useIconComponent(...names: string[]): any {
	const React = revenge.react.React
	const key = names.length > 0 ? names.join('|') : names[0]
	const [result, setResult] = React.useState(() => findIconComponent(...names))

	React.useEffect(() => {
		let cancelled = false

		if (!result) {
			const candidate = findIconComponent(...names)
			if (!cancelled && candidate) setResult(candidate)
		}

		let unsub: (() => void) | undefined
		try {
			const { getModules } = revenge.modules.finders
			const { or, withProps } = revenge.modules.finders.filters
			const anyOr = or as (...filters: unknown[]) => any
			const generated = (revenge as any).utils.discord
				?.withGeneratedIconComponent
			const filters = names.map(name => withProps(name))
			if (typeof generated === 'function') filters.push(generated(...names))
			const filter = filters.length > 1 ? anyOr(...filters) : filters[0]
			unsub = getModules(
				filter,
				exports => {
					for (const name of names) {
						const candidate = exports?.[name] ?? exports?.default?.[name]
						if (typeof candidate === 'function') {
							setResult(candidate)
							break
						}
					}
				},
				{ returnNamespace: true, max: 1 },
			)
		} catch {
			// ignore
		}

		return () => {
			cancelled = true
			try {
				unsub?.()
			} catch {
				// ignore
			}
		}
	}, [key])

	return result
}

export function getAssetId(name: string): number | undefined {
	try {
		return revenge.assets.getAssetIdByName(name)
	} catch {
		return undefined
	}
}

export function lazy<T>(getter: () => T | undefined): () => T | undefined {
	let cached: T | undefined
	let resolved = false
	return () => {
		if (resolved) return cached
		const value = getter()
		if (value == null) return undefined
		cached = value
		resolved = true
		return cached
	}
}

export function getGestureContext(): any {
	try {
		return byImported(
			'modules/quests/native/QuestDock/QuestDockGestureContext.tsx',
		)?.QuestDockGestureContext
	} catch {
		return undefined
	}
}

export function getExternalCoordinationContext(): any {
	try {
		return byImported(
			'modules/quests/native/QuestDock/QuestDockExternalCoordinationContext.tsx',
		)?.QuestDockExternalCoordinationContext
	} catch {
		return undefined
	}
}

export function getQuestDockMode(): any {
	try {
		return byImported('modules/quests/QuestConstants.tsx')?.QuestDockMode
	} catch {
		return undefined
	}
}

let stableInsetsModule: any

function getStableInsetsModule(): any {
	if (stableInsetsModule !== undefined) return stableInsetsModule
	try {
		const reg = (revenge.react.ReactNative as any)?.TurboModuleRegistry
		stableInsetsModule =
			typeof reg?.getEnforcing === 'function'
				? reg.getEnforcing('NativeSafeAreaInsetsModule')
				: null
	} catch {
		stableInsetsModule = null
	}
	return stableInsetsModule
}

export function getBottomInset(): number {
	try {
		const bottom =
			getStableInsetsModule()?.getStableSafeAreaInsets?.('main')?.bottom
		if (typeof bottom === 'number' && bottom > 0) return bottom
	} catch {}
	return 0
}
