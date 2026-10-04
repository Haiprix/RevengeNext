import {
	forceInitModule,
	getCurrentUserId,
	getIcon,
	getPropsFilter,
	onImportedPath,
} from './modules'
import { getSettings, setPending } from './state'

let msg: any = null

function isSentMessage(m: any): boolean {
	return m?.state === 'SENT'
}

function isRowArray(arr: any[]): boolean {
	if (arr.length === 0) return false
	const first = arr[0]
	return (
		first?.type?.name === 'ActionSheetRow' ||
		(first?.props && typeof first.props.label === 'string')
	)
}

// Collect every array of rows inside the action sheet's React tree.
function walkRows(tree: any, out: any[] = []): any[] {
	if (!tree || typeof tree !== 'object') return out
	if (Array.isArray(tree)) {
		if (isRowArray(tree) && !out.includes(tree)) out.push(tree)
		tree.forEach((c: any) => walkRows(c, out))
		return out
	}
	const k = tree?.props?.children
	if (Array.isArray(k)) {
		if (isRowArray(k) && !out.includes(k)) out.push(k)
		k.forEach((c: any) => walkRows(c, out))
	} else {
		walkRows(k, out)
	}
	return out
}

// Build a new row by cloning an existing row's component type.
function makeRow(tpl: any, label: string, icon: any, onPress: () => void) {
	const { React } = revenge.react
	const Row = tpl?.type
	if (!Row) return null
	const Icon = Row?.Icon
	const iconEl = Icon && icon ? React.createElement(Icon, { IconComponent: icon }) : null
	return React.createElement(Row, { key: label, label, icon: iconEl, onPress })
}

// Icons load lazily; cache the first successful lookup and keep retrying.
const iconCache = new Map<string, any>()
function retryIcon(name: string): any {
	let icon = iconCache.get(name)
	if (!icon) {
		icon = getIcon(name)
		if (icon) iconCache.set(name, icon)
	}
	return icon
}

// Make sure the icon module is loaded before the sheet first opens.
function warmIcon(name: string) {
	try {
		const f = getPropsFilter(name)
		if (f) forceInitModule(f)
	} catch {}
	retryIcon(name)
}

function inject(res: any): any {
	if (!msg?.id || !isSentMessage(msg)) return res
	if (getSettings().overrideNative) return res // every edit is silent already

	const me = getCurrentUserId()
	if (!me || msg.author?.id !== me) return res // only your own messages

	const messageId: string = msg.id
	const pencil = retryIcon('PencilIcon')
	const iconOf = (row: any) => row?.props?.icon?.props?.IconComponent

	for (const arr of walkRows(res)) {
		// Find the native "Edit" row: by icon (works in any language),
		// falling back to the label text.
		const i = arr.findIndex(
			(r: any) =>
				(pencil && iconOf(r) === pencil) ||
				String(r?.props?.label ?? '').toLowerCase().includes('edit'),
		)
		if (i < 0) continue

		const editRow = arr[i]
		const onEdit = editRow?.props?.onPress
		const row = makeRow(editRow, 'Silent Edit', pencil, () => {
			setPending(messageId)
			onEdit?.()
		})
		if (row) arr.splice(i + 1, 0, row)
		break
	}
	return res
}

function installWrapper(ns: any) {
	const orig = ns?.default ?? ns
	if (typeof orig !== 'function') return () => {}
	const wrapped = (props: any) => {
		const res = orig(props)
		try {
			return msg ? inject(res) : res
		} catch {
			return res
		}
	}
	ns.default = wrapped
	return () => {
		if (ns.default === wrapped) ns.default = orig
	}
}

export function patchActionSheet(): () => void {
	const unpatch: Array<() => void> = []
	warmIcon('PencilIcon')

	// Remember which message the sheet is opening for.
	unpatch.push(
		onImportedPath(
			'modules/action_sheet/native/ActionSheetActionCreators.tsx',
			(ns: any) => {
				const owner = ns?.default ?? ns
				if (typeof owner?.openLazy !== 'function') return
				unpatch.push(
					revenge.patcher.before(owner, 'openLazy', (args: any) => {
						const [, key, loc] = args ?? []
						const m = key === 'MessageLongPressActionSheet' ? loc?.message : null
						msg = m != null && isSentMessage(m) ? m : null
						return args
					}),
				)
			},
		),
	)

	// Add the button when the sheet renders.
	unpatch.push(
		onImportedPath(
			'modules/messages/native/long_press/LongPressMessageActionSheet.tsx',
			(ns: any) => {
				unpatch.push(installWrapper(ns))
			},
		),
	)

	return () => {
		for (const u of unpatch) u?.()
		msg = null
	}
}
