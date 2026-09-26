import { DEFAULTS } from './defaults'
import { forceLoadLazySheets, initKmmiioLib } from './lib/modules'
import { patchChatInput } from './lib/patch'
import { setStorage } from './lib/state'
import Settings from './settings'
import type { ChatboxAvatarStorage } from './types'

export default plugin<{ jsonStorage: ChatboxAvatarStorage }>({
	jsonStorage: {
		load: true,
		default: DEFAULTS,
	},
	start({ cleanup, jsonStorage, plugin }) {
		const kmmiio = plugin.api?.unscoped?.kmmiio
		kmmiio?.setActivePlugin?.(plugin.manifest.id)
		initKmmiioLib(plugin.api)
		kmmiio?.registerPlugin({
			id: plugin.manifest.id,
			name: plugin.manifest.name,
			icon: plugin.manifest.icon,
			author: plugin.manifest.author,
			description: plugin.manifest.description,
			version: plugin.manifest.version,
			getStatus: () => plugin.status,
			getErrors: () => plugin.errors,
		})
		setStorage(jsonStorage)

		try {
			forceLoadLazySheets()
		} catch (error) {
			console.warn('[chatbox-avatar] sheet warm-up failed', error)
		}

		try {
			cleanup(patchChatInput())
		} catch (error) {
			console.warn('[chatbox-avatar] chat input patch failed', error)
		}
	},
	SettingsComponent: Settings,
})
