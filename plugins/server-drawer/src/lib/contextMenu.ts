import { byImported, haptic } from './modules'

const CONTEXT_MENU_STATE_PATH =
	'design/components/ContextMenu/native/ContextMenuState.native.tsx'
const CONTEXT_MENU_CONSTANTS_PATH =
	'design/components/ContextMenu/native/ContextMenuConstants.native.tsx'

const { Dimensions } = revenge.react.ReactNative

let stateApi: any
function getStateApi(): any {
	if (stateApi !== undefined) return stateApi
	stateApi = byImported(CONTEXT_MENU_STATE_PATH)
	return stateApi
}

let menuConstants: any
function getConstants(): any {
	if (menuConstants !== undefined) return menuConstants
	menuConstants = byImported(CONTEXT_MENU_CONSTANTS_PATH)
	return menuConstants
}

export function useMenuState(): any {
	try {
		return getStateApi()?.useContextMenuState?.() ?? null
	} catch {
		return null
	}
}

export function openContextMenu(opts: {
	state: any
	ref: any
	items: any[]
	title?: string
	onClose?: () => void
}): void {
	const { state, ref, items, title, onClose } = opts
	const api = getStateApi()
	console.log(
		'[ServerDrawer] openContextMenu: api =',
		Boolean(api?.showContextMenu),
		'state =',
		Boolean(state),
		'items =',
		items.length,
		'ref =',
		Boolean(ref?.current),
	)
	if (!api?.showContextMenu || !state || items.length === 0 || !ref?.current) {
		console.log('[ServerDrawer] openContextMenu: BAIL')
		return
	}

	const consts = getConstants() ?? {}
	const EDGE = consts.CONTEXT_MENU_EDGE_OFFSET ?? 12
	const MIN_WIDTH = consts.CONTEXT_MENU_MIN_WIDTH ?? 220
	const OFFSET = consts.CONTEXT_MENU_OFFSET ?? 10
	const { width: winW, height: winH } = Dimensions.get('window')

	ref.current.measureInWindow(
		(x: number, y: number, width: number, height: number) => {
			console.log('[ServerDrawer] openContextMenu: measured', {
				x,
				y,
				width,
				height,
			})
			try {
				haptic('IMPACT_MEDIUM')
			} catch {
				// ignore
			}

			// Anchor the menu directly above or below the icon, horizontally
			// centered on it: positionY 'below' -> menu top sits at the icon's
			// bottom edge (hangs down); 'above' -> menu bottom sits at the icon's
			// top edge (rises up). Prefer above when there is room, since the
			// drawer lives at the bottom of the screen.
			const estH = (title != null ? 44 : 0) + items.length * 44 + 24
			const showAbove = y - EDGE >= Math.min(estH, winH * 0.6)
			const menuX = Math.min(
				Math.max(x + width / 2 - MIN_WIDTH / 2, EDGE),
				Math.max(winW - MIN_WIDTH - EDGE, EDGE),
			)
			// The popout pins the menu with `[str2]: y`, and str2 is 'top' when
			// positionY is 'below' but 'bottom' when 'above'. So y is measured
			// from the window's top for 'below' and from its bottom for 'above'.
			// Old ContextMenu passed the same bottom-relative value for 'above'.
			const menuY = showAbove ? winH - y + OFFSET : y + height + OFFSET

			console.log(
				'[ServerDrawer] openContextMenu: showContextMenu',
				{ key: `server-drawer-${title ?? 'item'}-${Date.now()}`, menuX, menuY },
				'side =',
				showAbove ? 'above' : 'below',
			)
			api.showContextMenu({
				key: `server-drawer-${title ?? 'item'}-${Date.now()}`,
				...(title != null ? { title } : {}),
				items,
				x: menuX,
				y: menuY,
				positionX: 'left',
				positionY: showAbove ? 'above' : 'below',
				width,
				height,
				state,
				dividerIndexes: [],
				keyboardShouldPersistTaps: 'never',
				requestClose: (isDismiss: boolean) => {
					try {
						if (!isDismiss) {
							const active = state?.activeIndex?.get?.()
							if (
								typeof active === 'number' &&
								active >= 0 &&
								items[active]?.action
							)
								items[active].action()
						}
					} catch {
						// ignore
					}
					try {
						state?.activeIndex?.set?.(-1)
					} catch {
						// ignore
					}
					try {
						api.hideContextMenu()
					} catch {
						// ignore
					}
					onClose?.()
				},
				onClose: () => onClose?.(),
			})
		},
	)
}
