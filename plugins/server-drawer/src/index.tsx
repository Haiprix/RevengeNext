import { startNavigation } from './lib/actions'
import { bindKmmiio, kmmiio } from './lib/kmmiio'
import { defaults, setStorageRef } from './lib/modules'
import {
	patchDockAssetPrefetch,
	patchMobileQuestDock,
	patchQuestDockBase,
	patchQuestDockRender,
	patchQuestEligibility,
} from './lib/quests'
import { patchCreateElement } from './lib/registry'
import { patchEmpty, patchExpanded } from './patches/content'
import { patchHideGuildsBar } from './patches/hideGuildsBar'
import { patchTransparentBackground } from './patches/transparentBackground'
import Settings from './ui/Settings'
import type { ServerDrawerStorage } from './lib/modules'

export default plugin<{ jsonStorage: ServerDrawerStorage }>({
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

		// Pre-load the create-guild lazy chunk so the first tap isn't async.
		try {
			kmmiio()?.forceLoadCreateGuild?.()
		} catch {}

		startNavigation()

		patchCreateElement(cleanup)

		patchMobileQuestDock(cleanup)
		patchQuestDockBase(cleanup)
		patchQuestDockRender(cleanup)
		patchQuestEligibility(cleanup)
		patchDockAssetPrefetch(cleanup)

		patchExpanded(cleanup)
		patchEmpty('QuestDockContentCollapsed', cleanup)
		patchEmpty('QuestDockEnrolledHeader', cleanup)
		patchEmpty('QuestDockUnenrolledHeader', cleanup)
		patchEmpty('QuestDockEnrolledBody', cleanup)
		patchEmpty('QuestDockUnenrolledBody', cleanup)

		patchHideGuildsBar(cleanup)
		patchTransparentBackground(cleanup)

		if (plugin.startedLate) plugin.requireReload()

		console.log('[ServerDrawer] loaded')
	},
	SettingsComponent: Settings,
})
