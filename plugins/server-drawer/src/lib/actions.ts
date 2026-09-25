import { kmmiio } from './kmmiio'
import {
	findFunctionByName,
	findLazyCreateOpener,
	findModuleByProps,
	findModuleByPropsUsingStore,
} from './metro'
import { byImported, getFluxStore, getME, haptic } from './modules'

const TAG = '[ServerDrawer.Nav]'

const HOME_PATH = '/channels/@me'

let guildNavigation: any
let channelNavigation: any
let guildBarNavigation: ((id: string) => void) | undefined
let routerNavigation: any

// Mirrors the working serverdrawer (revenge-plugins) navigation:
//   selectGuild(id)           -> guildBarNavigation?.(id) else transitionToGuild(id)
//   selectPrivateChannel(id)  -> transitionToChannel(id, {})
// Resolved lazily per-tap so lazy chunks that load later still get used.
function resolveNavigation(): void {
	try {
		if (!guildNavigation) {
			guildNavigation = findModuleByProps('transitionToGuild')
		}
	} catch {
		// ignore
	}
	try {
		if (!channelNavigation) {
			channelNavigation = findModuleByPropsUsingStore(
				'ChannelStore',
				'transitionToChannel',
			)
		}
	} catch {
		// ignore
	}
	try {
		if (!guildBarNavigation) {
			guildBarNavigation = findFunctionByName(
				'transitionGuildsBarToGuildOrOpenSelectedChannel',
			)
		}
	} catch {
		// ignore
	}
	try {
		if (!routerNavigation) {
			routerNavigation = findModuleByProps('transitionTo')
		}
	} catch {
		// ignore
	}
}

export function startNavigation(): void {
	resolveNavigation()
	if (guildBarNavigation) {
		console.log(TAG, 'nav-bind: rail util default')
	}
	if (guildNavigation?.transitionToGuild) {
		console.log(TAG, 'nav-bind: transitionToGuild')
	}
	if (channelNavigation?.transitionToChannel) {
		console.log(TAG, 'nav-bind: transitionToChannel')
	}
}

function selectedGuild(): string | undefined {
	try {
		return getFluxStore('SelectedGuildStore')?.getGuildId?.()
	} catch {
		return undefined
	}
}

function selectedChannel(): string | undefined {
	try {
		return getFluxStore('SelectedChannelStore')?.getChannelId?.()
	} catch {
		return undefined
	}
}

// On the home / DM rail the selected guild resolves to null, not an id.
function reachedTarget(guildId: string, sel: string | undefined): boolean {
	if (guildId === '@me') return sel == null || sel === '@me'
	return sel === guildId
}

export function switchGuild(guildId: string): void {
	haptic('SOFT')
	resolveNavigation()

	if (typeof guildBarNavigation === 'function') {
		console.log(TAG, `sw->${guildId} via=rail-util`)
		try {
			guildBarNavigation(guildId)
		} catch (e) {
			console.warn(TAG, `sw->${guildId} rail threw ${String(e)}`)
		}
	} else if (guildNavigation?.transitionToGuild) {
		console.log(TAG, `sw->${guildId} via=transitionToGuild`)
		try {
			guildNavigation.transitionToGuild(guildId)
		} catch (e) {
			console.warn(TAG, `sw->${guildId} threw ${String(e)}`)
		}
	} else {
		console.log(TAG, `sw->${guildId} via=none`)
	}

	setTimeout(() => {
		const sel = selectedGuild()
		if (reachedTarget(guildId, sel)) {
			console.log(TAG, `dst=OK sel=${sel ?? 'none'}`)
			return
		}
		console.log(TAG, `dst=MISS sel=${sel ?? 'none'}`)
	}, 900)
}

export function openDms(): void {
	haptic('SOFT')
	resolveNavigation()

	const me = getME()
	const goHome = (): void => {
		try {
			if (typeof routerNavigation?.transitionTo === 'function') {
				console.log(TAG, `dms->home via=transitionTo`)
				routerNavigation.transitionTo(HOME_PATH)
				return
			}
			if (typeof guildBarNavigation === 'function' && me) {
				console.log(TAG, `dms->home via=rail-util`)
				guildBarNavigation(me)
				return
			}
			if (me && guildNavigation?.transitionToGuild) {
				console.log(TAG, `dms->home via=transitionToGuild`)
				guildNavigation.transitionToGuild(me)
				return
			}
			console.warn(TAG, 'openDms: no navigation target resolved')
		} catch (e) {
			console.warn(TAG, `openDms: threw ${String(e)}`)
		}
	}

	goHome()

	setTimeout(() => {
		const guildId = selectedGuild()
		const channelId = selectedChannel()
		// The DMs list page has no guild and no DM channel selected.
		const home = guildId == null && channelId == null
		console.log(
			TAG,
			`dst=${home ? 'OK' : 'MISS'} guild=${guildId ?? 'none'} channel=${channelId ?? 'none'}`,
		)
	}, 900)
}

let createNoopLogged = false

export function createGuild(): void {
	haptic('SOFT')
	console.log(TAG, 'create: pressed')

	// The create-guild ActionCreators live in a lazy Discord chunk. Resolve
	// the opener by several strategies in order of precision, logging each so
	// a failing build is traceable in logcat.
	// 1. Exact imported-path lookup (must already be initialized).
	// 2. Props-based finder (self-initializes matching registered modules).
	// 3. kmmiio-lib (asyncRequireImpl over __r).
	const attempts: { name: string; open: (() => void) | undefined }[] = []

	try {
		const ns = byImported(
			'modules/create_guild/native/CreateGuildModalActionCreators.tsx',
		)
		const viaPath =
			ns?.default?.openCreateGuildModal ?? ns?.openCreateGuildModal
		if (typeof viaPath === 'function')
			attempts.push({ name: 'byImported', open: () => viaPath() })
	} catch {
		// ignore
	}

	try {
		const mod = findModuleByProps('openCreateGuildModal')
		const viaProps = mod?.openCreateGuildModal
		if (typeof viaProps === 'function')
			attempts.push({ name: 'findModuleByProps', open: () => viaProps() })
	} catch {
		// ignore
	}

	const create = kmmiio()?.openCreateGuildModal
	if (typeof create === 'function')
		attempts.push({ name: 'kmmiio', open: () => create() })

	const runtimeOpen = findLazyCreateOpener(msg => console.log(TAG, msg))
	if (typeof runtimeOpen === 'function')
		attempts.push({ name: 'runtime', open: () => runtimeOpen() })

	console.log(
		TAG,
		'create: resolvers =',
		attempts.map(a => a.name).join(', ') || 'none',
	)

	const best = attempts[0]?.open
	if (typeof best === 'function') {
		console.log(TAG, `create: firing (${attempts[0].name})`)
		try {
			best()
		} catch (e) {
			console.warn(TAG, `create: threw ${String(e)}`)
		}
		return
	}

	if (!createNoopLogged) {
		createNoopLogged = true
		console.warn(TAG, 'create: no opener available - no-op')
	}
}

export function toggleFolder(folderId: string): void {
	haptic('SOFT')

	const mod = findModuleByProps('toggleGuildFolderExpand') as
		| Record<string, any>
		| undefined
	const toggle =
		mod?.toggleGuildFolderExpand ??
		(mod?.default as any)?.toggleGuildFolderExpand

	if (typeof toggle === 'function') {
		console.log(TAG, `folder->${folderId}`)
		try {
			toggle(folderId)
		} catch (e) {
			console.warn(TAG, `folder->${folderId} threw ${String(e)}`)
		}
	} else {
		console.warn(
			TAG,
			`folder->${folderId} dispatching TOGGLE_GUILD_FOLDER_EXPAND`,
		)
		try {
			void (revenge as any).discord.common.flux.Dispatcher.dispatch({
				type: 'TOGGLE_GUILD_FOLDER_EXPAND',
				folderId,
			})
		} catch (e) {
			console.warn(TAG, `folder->${folderId} dispatch failed ${String(e)}`)
		}
	}

	setTimeout(() => {
		let has: boolean | undefined
		try {
			has =
				getFluxStore('ExpandedGuildFolderStore')
					?.getExpandedFolders?.()
					?.has(folderId) ?? false
		} catch {
			// ignore
		}
		console.log(
			TAG,
			`fold=${has === true ? 'OPEN' : 'CLOSED'} folderId=${folderId}`,
		)
	}, 350)
}

export function logStatus(): void {
	resolveNavigation()

	const me = getME() ?? '?'
	const nav = guildBarNavigation
		? 'rail-util'
		: guildNavigation?.transitionToGuild
			? 'transitionToGuild'
			: 'MISS'
	const navRef =
		typeof findModuleByProps('getRootNavigationRef')?.getRootNavigationRef ===
		'function'
			? 'yes'
			: 'no'
	const create =
		typeof kmmiio()?.openCreateGuildModal === 'function' ? 'lib' : 'no-lib'
	const toggle = findModuleByProps('toggleGuildFolderExpand')
	const folder = toggle ? 'loaded' : 'MISS'

	console.log(
		TAG,
		`status me=${me} nav=${nav} navRef=${navRef} create=${create} folder=${folder}`,
	)
}
