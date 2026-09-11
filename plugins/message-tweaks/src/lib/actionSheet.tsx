import { startLocalEdit } from './editing'
import { getIcon, onChannelMessages, onImportedPath } from './modules'
import {
	getSettings,
	hideMessage,
	removeMessage,
	setChannelMessagesCache,
	setMessageStore,
} from './state'

let msg: any = null
let ch: any = null

// Discord's MessageRecord sets state to 'SENT' by default for server messages;
// queued/sending/failed messages are 'SENDING' or 'SEND_FAILED' instead.
function isSentMessage(m: any): boolean {
	return m?.state === 'SENT'
}

// Discord's own MessageTypes.USER_MESSAGE set: only user-authored messages get
// "Edit Locally". System messages (USER_JOIN, THREAD_STARTER_MESSAGE, boosts,
// …) are excluded because they aren't editable.
const USER_MESSAGE_TYPES = new Set([0, 19, 20, 23, 26, 41, 45, 47, 68])

function hideSheet() {
	try {
		revenge.discord.actions?.ActionSheetActionCreators?.hideActionSheet?.()
	} catch {}
}

function hideForMe() {
	if (!msg) return
	const channelId = ch?.id ?? msg?.channel_id ?? ''
	const author = msg?.author?.globalName ?? msg?.author?.username ?? 'Unknown'
	hideMessage(channelId, msg.id, author)
	removeMessage(channelId, msg.id)
}

function isRowArray(arr: any[]): boolean {
	if (arr.length === 0) return false
	const first = arr[0]
	return (
		first?.type?.name === 'ActionSheetRow' ||
		(first?.props && typeof first.props.label === 'string')
	)
}

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

function makeRow(tpl: any, label: string, icon: any, onPress: () => void): any {
	const { React } = revenge.react
	const Row = tpl?.type
	if (!Row) return null
	const Icon = Row?.Icon
	const iconEl = Icon
		? React.createElement(Icon, { IconComponent: icon })
		: null
	return React.createElement(Row, { key: label, label, icon: iconEl, onPress })
}

function inject(res: any): any {
	if (!res || !msg?.id || !isSentMessage(msg)) return res
	const s = getSettings()
	if (!s.showLocalEditButton && !s.showHideButton) return res
	const channelId = ch?.id ?? msg?.channel_id ?? ''
	const groups = walkRows(res)

	let editArr: any[] | null = null
	let hideArr: any[] | null = null
	for (const arr of groups) {
		if (
			!editArr &&
			arr.length > 0 &&
			arr.some((r: any) => r?.props?.label != null)
		)
			editArr = arr
		if (!hideArr && arr.some((r: any) => r?.props?.variant === 'danger'))
			hideArr = arr
		if (editArr && hideArr) break
	}

	// "Edit Locally" only makes sense on user-authored messages (whitelist) and
	// inside the full sheet (2+ groups). Thread-starter messages render a single
	// "Open Thread" row — those never get it, even if the type probe is off.
	if (
		s.showLocalEditButton &&
		groups.length >= 2 &&
		USER_MESSAGE_TYPES.has(msg?.type) &&
		editArr
	) {
		const tpl = editArr.find((r: any) => r?.props?.label != null) ?? editArr[0]
		if (tpl) {
			editArr.unshift(
				makeRow(tpl, 'Edit Locally', getIcon('PencilIcon'), () => {
					hideSheet()
					startLocalEdit(channelId, msg)
				}),
			)
		}
	}

	// "Delete Locally" is meant for any message, so it stays available on every
	// sent-message sheet (including system/thread-starter rows).
	if (s.showHideButton && (hideArr ?? editArr)) {
		const arr = hideArr ?? editArr!
		const tpl = arr.find((r: any) => r?.props?.label != null) ?? arr[0]
		if (tpl) {
			arr.unshift(
				makeRow(tpl, 'Delete Locally', getIcon('TrashIcon'), () => {
					hideSheet()
					hideForMe()
				}),
			)
		}
	}
	return res
}

function installWrapper(ns: any) {
	const mod = ns?.default ?? ns
	if (typeof mod !== 'function') return () => {}
	const orig = mod
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

	unpatch.push(
		onImportedPath('stores/MessageStore.tsx', (ns: any) => {
			setMessageStore(ns?.default ?? ns)
		}),
	)
	unpatch.push(
		onChannelMessages((c: any) => {
			setChannelMessagesCache(c)
		}),
	)

	unpatch.push(
		onImportedPath(
			'modules/action_sheet/native/ActionSheetActionCreators.tsx',
			(ns: any) => {
				const owner = ns?.default ?? ns
				if (typeof owner?.openLazy !== 'function') return
				unpatch.push(
					revenge.patcher.before(owner, 'openLazy', (args: any) => {
						const [, key, loc] = args ?? []
						const m =
							key === 'MessageLongPressActionSheet' ? loc?.message : null
						if (m != null && isSentMessage(m)) {
							msg = m
							ch = loc.channel ?? null
						} else {
							msg = null
							ch = null
						}
						return args
					}),
				)
			},
		),
	)

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
	}
}
