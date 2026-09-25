import { startNavigation } from './lib/actions'
import { bindKmmiio, kmmiio } from './lib/kmmiio'
import { defaults, setStorageRef } from './lib/modules'
import {
	COLLAPSED_DOCK_HEIGHT,
	patchDockAssetPrefetch,
	patchMobileQuestDock,
	patchQuestDockBase,
	patchQuestDockRender,
	patchQuestEligibility,
} from './lib/quests'
import { patchCreateElement } from './lib/registry'
import { patchCollapsed, patchEmpty, patchExpanded } from './patches/content'
import { patchHideGuildsBar } from './patches/hideGuildsBar'
import { patchHomeDrawerExperiment } from './patches/homeDrawer'
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
		patchCollapsed(cleanup)
		patchEmpty('QuestDockEnrolledHeader', cleanup)
		patchEmpty('QuestDockUnenrolledHeader', cleanup)
		patchEmpty('QuestDockEnrolledBody', cleanup)
		patchEmpty('QuestDockUnenrolledBody', cleanup)

		patchHideGuildsBar(cleanup)
		patchTransparentBackground(cleanup)
		patchHomeDrawerExperiment(cleanup)

		// Raise the collapsed dock height so the first row's icons (and a peek of
		// the second row) stay fully visible when the drawer collapses.
		// QuestDockConstants loads lazily after boot, so it can't be mutated at
		// startup. Instead subscribe on registration: revenge-bundle runs the
		// module-init subscriptions synchronously right after the module factory
		// and before metroRequire returns, so mutating the export here is seen by
		// QuestDockHooks when it destructures the constant into its worklet
		// closure. The JS safety-net override in ServerDrawerSheet stays as a
		// backstop for the already-initialized/strict mode.
		try {
			const { getModules } = revenge.modules.finders
			const { withProps } = revenge.modules.finders.filters
			const unsubDockHeight: () => void = getModules(
				withProps('QUEST_DOCK_COLLAPSED_HEIGHT'),
				exports => {
					if (
						exports &&
						typeof exports.QUEST_DOCK_COLLAPSED_HEIGHT === 'number'
					) {
						const prev = exports.QUEST_DOCK_COLLAPSED_HEIGHT
						if (prev !== COLLAPSED_DOCK_HEIGHT) {
							exports.QUEST_DOCK_COLLAPSED_HEIGHT = COLLAPSED_DOCK_HEIGHT
							console.log(
								'[ServerDrawer] QUEST_DOCK_COLLAPSED_HEIGHT',
								prev,
								'->',
								COLLAPSED_DOCK_HEIGHT,
							)
						}
					}
				},
				{ max: 1 },
			)
			cleanup(() => {
				try {
					unsubDockHeight?.()
				} catch {}
			})
		} catch {}

		if (plugin.startedLate) plugin.requireReload()

		console.log(
			'[ServerDrawer] loaded v' +
				plugin.manifest.version +
				' marker=sd-2026-09-25-22',
		)
	},
	SettingsComponent: Settings,
})
