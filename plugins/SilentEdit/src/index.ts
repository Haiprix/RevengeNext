import { patchActionSheet } from './actionSheet'
import { dbg } from './log'
import { initKmmiioLib } from './modules'
import Settings from './settings'
import { patchSilentEdit } from './silentEdit'
import { DEFAULTS, setStorage } from './state'
import type { SilentEditStorage } from './state'

export default plugin<{ jsonStorage: SilentEditStorage }>({
	jsonStorage: {
		load: true,
		default: DEFAULTS,
	},
	start({ cleanup, jsonStorage, plugin }) {
		const kmmiio = plugin.api?.unscoped?.kmmiio
		kmmiio?.setActivePlugin?.(plugin.manifest.id)
		initKmmiioLib(plugin.api)
		kmmiio?.registerPlugin?.({
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

		// One failing patch must not stop the other.
		try {
			cleanup(patchSilentEdit())
		} catch (e) {
			dbg('start', 'silentEdit failed', e)
		}
		try {
			cleanup(patchActionSheet())
		} catch (e) {
			dbg('start', 'actionSheet failed', e)
		}
	},
	SettingsComponent: Settings,
})
