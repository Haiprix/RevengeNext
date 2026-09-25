const TAG = '[ServerDrawer.Menu]'

const GUILDS_BAR_PATH = 'modules/guilds_bar/native/GuildsBar.tsx'

export type MenuRow = { label: string; action: () => void }

// The stock guilds-bar gesture hook initializes the real menu modules: its
// dependency map places the guild menu builder at index 27 and the folder menu
// module at 28 (see useGuildsBarGesture: items = require(deps[27])(guildId, ...);
// items = require(deps[28]).getGuildFolderMenuItems(id)). GuildsBar (initialized)
// imports the hook at index 5. Dep maps are registered at module definition,
// so force-loading the ids gives us the full stock rows.
function stockMenuModules(): { guild: any; folder: any } {
	try {
		const gb =
			revenge?.discord?.utils?.modules?.finders?.lookupModuleWithImportedPath?.(
				GUILDS_BAR_PATH,
			)
		const gbDeps: any =
			typeof gb?.[1] === 'number'
				? revenge?.modules?.metro?.getModuleDependencies?.(gb[1])
				: undefined
		const hookId = gbDeps?.[5]
		const deps: any =
			typeof hookId === 'number'
				? revenge?.modules?.metro?.getModuleDependencies?.(hookId)
				: undefined
		console.log(
			TAG,
			'hook id =',
			hookId,
			'guildMenu@27 =',
			deps?.[27],
			'folderMenu@28 =',
			deps?.[28],
		)
		if (!deps) return { guild: undefined, folder: undefined }
		const guild = globalThis.__r(deps[27])
		const folder = globalThis.__r(deps[28])
		const guildFn = typeof guild === 'function' ? guild : guild?.default
		const folderItems =
			folder?.getGuildFolderMenuItems ??
			folder?.default?.getGuildFolderMenuItems
		console.log(
			TAG,
			'stock: guildFn =',
			typeof guildFn,
			'folderItems =',
			typeof folderItems,
		)
		return { guild: guildFn, folder: folderItems }
	} catch {
		return { guild: undefined, folder: undefined }
	}
}

export function buildGuildMenuItems(guildId: string): MenuRow[] {
	const stock = stockMenuModules()
	if (typeof stock.guild !== 'function') return []
	console.log(TAG, `stock guild menu items: guildId = ${guildId}`)
	return stock.guild(guildId)
}

export function buildFolderMenuItems(folder: any): MenuRow[] {
	const stock = stockMenuModules()
	if (typeof stock.folder !== 'function') return []
	console.log(TAG, `stock folder menu items: folder = ${folder?.id}`)
	return stock.folder(folder?.id)
}
