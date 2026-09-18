import { bindKmmiio, kmmiio } from './lib/kmmiio'
import { getAuthSessionsActionCreators, getSessionsStore } from './lib/modules'
import { defaults, handleSessions, setStorageRef } from './lib/sessionState'
import { installSessionPatches } from './patches'
import type { SessionsStorage } from './lib/sessionState'

const FETCH_AGAIN_MS = 15 * 60 * 1000
const FIRST_FETCH_MS = 6 * 1000

const AUTH_SESSIONS_STORE_PATH = 'modules/auth_sessions/AuthSessionsStore.tsx'

export default plugin<{ jsonStorage: SessionsStorage }>({
	jsonStorage: {
		load: true,
		default: defaults,
	},
	start({ cleanup, jsonStorage, plugin }) {
		setStorageRef(jsonStorage)
		bindKmmiio(plugin.api)

		kmmiio()?.setActivePlugin?.(plugin.manifest.id)
		kmmiio()?.registerPlugin?.({
			id: plugin.manifest.id,
			name: plugin.manifest.name,
			icon: plugin.manifest.icon,
			author: plugin.manifest.author,
			description: plugin.manifest.description,
			version: plugin.manifest.version,
			getStatus: () => plugin.status,
			getErrors: () => plugin.errors,
		})

		const creators = getAuthSessionsActionCreators()

		// Keep the pending-badge/new-detect state in lockstep with the store.
		// The Flux Store API exposes addChangeListener (there is no .subscribe),
		// and the AuthSessionsStore module may not be loaded when this plugin
		// starts — so resolve lazily and attach as soon as the module appears.
		let removeListener: (() => void) | undefined
		const onChange = () => {
			try {
				handleSessions(getSessionsStore()?.getSessions?.() ?? [])
			} catch {}
		}
		const attachStoreListener = (): boolean => {
			try {
				const s = getSessionsStore()
				if (s && typeof s.addChangeListener === 'function') {
					s.addChangeListener(onChange)
					removeListener = () => {
						try {
							s.removeChangeListener?.(onChange)
						} catch {}
					}
					return true
				}
			} catch {}
			return false
		}
		if (!attachStoreListener()) {
			try {
				const stopWatching =
					revenge.discord.utils.modules.finders.getModuleWithImportedPath(
						AUTH_SESSIONS_STORE_PATH,
						() => {
							if (attachStoreListener()) {
								try {
									stopWatching()
								} catch {}
							}
						},
					)
				cleanup(() => {
					try {
						stopWatching()
					} catch {}
				})
			} catch {}
		}
		cleanup(() => {
			try {
				removeListener?.()
			} catch {}
		})

		const poll = () => {
			try {
				creators?.fetchAuthSessions?.()
			} catch {}
		}
		const initialTimer = setTimeout(poll, FIRST_FETCH_MS)
		const pollTimer = setInterval(poll, FETCH_AGAIN_MS)
		cleanup(() => {
			clearTimeout(initialTimer)
			clearInterval(pollTimer)
		})

		if (!installSessionPatches(cleanup)) {
			plugin.reportError(
				new Error('Revenge JSX runtime unavailable — session patches disabled'),
			)
		}

		if (plugin.startedLate) plugin.requireReload()

		console.log('[Sessions] loaded')
	},
})
