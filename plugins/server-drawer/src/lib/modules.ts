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

// id of the guild the user is currently in; null while inside DMs.
export function useSelectedGuildId(): string | null {
	return useFluxStore(
		'SelectedGuildStore',
		store => store?.getGuildId?.() ?? null,
		null,
	)
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

export function useQuestDockExpanded(): boolean {
	const React = revenge.react.React
	const [expanded, setExpanded] = React.useState(false)
	const lastRef = React.useRef(false)

	React.useEffect(() => {
		const flux = revenge.discord.flux
		console.log(
			'[ServerDrawer] dock: flux.getStore type =',
			typeof flux?.getStore,
		)
		if (typeof flux?.getStore !== 'function') return

		let store: any
		const { QuestDockMode } = getQuestDockMode() ?? {}
		// The client's enum field is a stable string pair ("collapsed"/"expanded"),
		// and QuestConstants may not be initialized yet, so anchor on the literal.
		const expandedMode = QuestDockMode?.EXPANDED ?? 'expanded'
		console.log('[ServerDrawer] dock: QuestDockMode.EXPANDED =', expandedMode)

		const onChange = () => {
			try {
				const mode = store?.prevRestingQuestDockMode
				const next = mode === expandedMode
				if (next !== lastRef.current) {
					lastRef.current = next
					console.log(
						'[ServerDrawer] dock: prevRestingQuestDockMode =',
						mode,
						'-> isExpanded =',
						next,
					)
					setExpanded(next)
				}
			} catch {
				// ignore
			}
		}

		let unsubWait: (() => void) | undefined
		try {
			unsubWait = flux.getStore('QuestDockStore', (s: any) => {
				store = s
				console.log(
					'[ServerDrawer] dock: store resolved, getName =',
					store?.getName?.(),
					'hasToken =',
					Boolean(store?._dispatchToken),
					'listener =',
					typeof store?.addReactChangeListener,
				)
				store?.addReactChangeListener?.(onChange)
				onChange()
			})
		} catch (e) {
			console.log('[ServerDrawer] dock: flux.getStore threw', e)
		}

		return () => {
			try {
				unsubWait?.()
			} catch {
				// ignore
			}
			try {
				store?.removeReactChangeListener?.(onChange)
			} catch {
				// ignore
			}
		}
	}, [])

	return expanded
}
