import { discordModules } from '@shared'

const MODULE_PATHS = {
	showUserProfileActionSheet: 'modules/user_profile/native/showUserProfileActionSheet.tsx',
	showYouAccountActionSheet: 'modules/main_tabs_v2/native/tabs/you/utils/showYouAccountActionSheet.tsx',
	YouAccountActionSheet: 'modules/main_tabs_v2/native/tabs/you/YouAccountActionSheet.tsx',
} as const

function moduleId(name: keyof typeof MODULE_PATHS): number {
	const id = discordModules[MODULE_PATHS[name]]
	if (typeof id !== 'number') throw new Error(`kmmiio-lib: missing module id for "${MODULE_PATHS[name]}"`)
	return id
}

const LAZY_SHEET_IDS = [
	moduleId('showUserProfileActionSheet'),
	moduleId('showYouAccountActionSheet'),
	moduleId('YouAccountActionSheet'),
]

export function forceLoadLazySheets(): void {
	// Intentionally NOT permanently gated: plugin start() can run before Discord
	// is fully initialized, and the on-press path must be able to re-attempt the
	// load. __r(id) and lookupModule(...,{initialize:true}) are idempotent for
	// already-initialized modules, so repeating them is safe.
	const { lookupModule } = revenge.modules.finders
	const { withProps } = revenge.modules.finders.filters
	const forceInit = (filter: any) => { try { lookupModule(filter, { initialize: true }) } catch {} }
	forceInit(withProps('showUserProfileActionSheetPostConnection'))
	forceInit(withProps('showYouAccountActionSheet'))
	forceInit(withProps('requestMembersById'))
	const requireFn = (globalThis as any)?.__r
	if (typeof requireFn === 'function') {
		for (const id of LAZY_SHEET_IDS) { try { requireFn(id) } catch {} }
	}
}

const ASYNC_REQUIRE_ID = discordModules['asyncRequireImpl']

function requireLazy(id: number): Promise<any> {
	const r = (globalThis as any)?.__r
	if (typeof r !== 'function') return Promise.resolve(undefined)
	const asyncRequire = (() => {
		try { return r(ASYNC_REQUIRE_ID)?.default ?? r(ASYNC_REQUIRE_ID) } catch { return undefined }
	})()
	if (typeof asyncRequire === 'function') {
		try {
			const p = asyncRequire(id)
			if (p && typeof p.then === 'function') return p
		} catch {}
	}
	if (typeof r.importDefault === 'function') {
		try {
			const result = r.importDefault(id)
			if (result && typeof result.then === 'function') return result
			return Promise.resolve(result)
		} catch {}
	}
	try { return Promise.resolve(r(id)) } catch { return Promise.resolve(undefined) }
}

export function openAccountSheet(_userId: string, _channelId?: string) {
	try {
		const id = moduleId('showYouAccountActionSheet')
		requireLazy(id)
			.then((ns: any) => {
				if (ns?.showYouAccountActionSheet) {
					ns.showYouAccountActionSheet()
					return
				}
				// Module loaded but the export isn't exposed yet; force-init the
				// nearby modules so the sheet can resolve on retry.
				forceLoadLazySheets()
			})
			.catch(() => forceLoadLazySheets())
	} catch {}
}
