import { discordModules } from '@shared'

const MODULE_PATHS = {
	showUserProfileActionSheet:
		'modules/user_profile/native/showUserProfileActionSheet.tsx',
	showYouAccountActionSheet:
		'modules/main_tabs_v2/native/tabs/you/utils/showYouAccountActionSheet.tsx',
	YouAccountActionSheet:
		'modules/main_tabs_v2/native/tabs/you/YouAccountActionSheet.tsx',
} as const

function moduleId(name: keyof typeof MODULE_PATHS): number {
	const id = discordModules[MODULE_PATHS[name]]
	if (typeof id !== 'number')
		throw new Error(`kmmiio-lib: missing module id for "${MODULE_PATHS[name]}"`)
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
	const forceInit = (filter: any) => {
		try {
			lookupModule(filter, { initialize: true })
		} catch {}
	}
	forceInit(withProps('showUserProfileActionSheetPostConnection'))
	forceInit(withProps('showYouAccountActionSheet'))
	forceInit(withProps('requestMembersById'))
	for (const id of LAZY_SHEET_IDS) {
		forceLoadModule(id)
	}
}

const ASYNC_REQUIRE_ID = discordModules.asyncRequireImpl

function getAsyncRequire(): any {
	const r = (globalThis as any)?.__r
	if (typeof r !== 'function') return () => {}
	try {
		return r(ASYNC_REQUIRE_ID)?.default ?? r(ASYNC_REQUIRE_ID)
	} catch {
		return () => {}
	}
}

function requireLazy(id: number): Promise<any> {
	const r = (globalThis as any)?.__r
	if (typeof r !== 'function') return Promise.resolve(undefined)
	const asyncRequire = getAsyncRequire()
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
	try {
		return Promise.resolve(r(id))
	} catch {
		return Promise.resolve(undefined)
	}
}

// Force-load a module synchronously (asyncRequire then __r fallback).
// Idempotent: __r and asyncRequire are safe to repeat for loaded modules.
export function forceLoadModule(id: number): void {
	const r = (globalThis as any)?.__r
	if (typeof r !== 'function') return
	if (typeof id !== 'number') return
	try {
		const asyncRequire = getAsyncRequire()
		if (typeof asyncRequire === 'function') asyncRequire(id)
	} catch {}
	try {
		r(id)
	} catch {}
}

// Create-guild modal ActionCreators is in a lazy chunk (module ID from
// plugins/shared/discord-modules.ts). It internally requires 12838 (the modal
// component) once evaluated, so loading this one module is sufficient.
const CREATE_GUILD_ID =
	discordModules[
		'modules/create_guild/native/CreateGuildModalActionCreators.tsx'
	]

export function forceLoadCreateGuild(): void {
	if (typeof CREATE_GUILD_ID !== 'number') return
	forceLoadModule(CREATE_GUILD_ID)
}

export function openCreateGuildModal() {
	try {
		forceLoadCreateGuild()
	} catch {}
	if (typeof CREATE_GUILD_ID !== 'number') return
	requireLazy(CREATE_GUILD_ID)
		.then((ns: any) => {
			const create = ns?.default?.openCreateGuildModal ? ns.default : ns
			if (typeof create?.openCreateGuildModal === 'function') {
				create.openCreateGuildModal()
				return
			}
			forceLoadCreateGuild()
		})
		.catch(() => forceLoadCreateGuild())
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
