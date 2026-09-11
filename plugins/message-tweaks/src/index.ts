import { DEFAULTS } from './defaults'
import { patchActionSheet } from './lib/actionSheet'
import { patchEditing } from './lib/editing'
import { patchLogging } from './lib/logging'
import {
	patchDeletedBackground,
	patchEphemeralAppearance,
	patchMessageRenderer,
} from './lib/messageRenderer'
import { initKmmiioLib } from './lib/modules'
import { setStorage } from './lib/state'
import Settings from './settings'
import type { MessageTweaksStorage } from './types'

export default plugin<{ jsonStorage: MessageTweaksStorage }>({
	jsonStorage: {
		load: true,
		default: DEFAULTS,
	},
	start({ cleanup, jsonStorage, plugin }) {
		const kmmiio = (globalThis as any).__kmmiio
		kmmiio?.setActivePlugin?.(plugin.manifest.id)
		initKmmiioLib(kmmiio)
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
			cleanup(patchEditing())
		} catch {}
		try {
			cleanup(patchMessageRenderer())
		} catch {}
		try {
			cleanup(patchEphemeralAppearance())
		} catch {}
		try {
			cleanup(patchDeletedBackground())
		} catch {}
		try {
			cleanup(patchActionSheet())
		} catch {}
		try {
			cleanup(patchLogging())
		} catch {}
	},
	SettingsComponent: Settings,
})
