import { DEFAULTS } from './defaults'
import { initKmmiioLib } from './lib/modules'
import { patchOverflow } from './lib/overflow'
import { setStorage } from './lib/state'
import Settings from './settings'
import type { AltMasterStorage } from './types'

export default plugin<{ jsonStorage: AltMasterStorage }>({
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

		try {
			cleanup(patchOverflow())
		} catch {}
	},
	SettingsComponent: Settings,
})
