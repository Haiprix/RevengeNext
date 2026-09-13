import { openDms } from '../lib/actions'
import { kmmiio } from '../lib/kmmiio'
import { getME, lazy, useFluxStore } from '../lib/modules'

const { Pressable, View, Image, StyleSheet } = revenge.react.ReactNative

const ICON = 48
const ChatIcon = lazy(() => {
	try {
		return revenge.assets.getAssetIdByName('ChatIcon')
	} catch {
		return undefined
	}
})

function useDmTileColors() {
	const selectedGuildId = useFluxStore(
		'SelectedGuildStore',
		store => store?.getGuildId?.(),
		undefined,
	)
	const selected = selectedGuildId == null || selectedGuildId === getME()

	const resolveColor = kmmiio()?.resolveColor
	const bg = selected
		? resolveColor?.('BACKGROUND_BRAND')
		: resolveColor?.('MOBILE_GUILDBAR_ICON_BACKGROUND_DEFAULT')
	const tint = selected
		? resolveColor?.('WHITE')
		: resolveColor?.('MOBILE_GUILDBAR_ICON_DEFAULT')

	return { selected, bg, tint }
}

export default function DmTile({ onPress }: { onPress?: () => void }) {
	const { bg, tint } = useDmTileColors()

	return (
		<Pressable onPress={onPress ?? openDms} style={st.outer}>
			<View style={[st.icon, { backgroundColor: bg }]}>
				{ChatIcon() != null && (
					<Image
						source={ChatIcon()}
						style={{ width: 24, height: 24, tintColor: tint }}
					/>
				)}
			</View>
		</Pressable>
	)
}

export function RailDmTile() {
	const { tint, bg } = useDmTileColors()

	return (
		<Pressable onPress={openDms} style={railSt.outer}>
			<View style={[railSt.icon, { backgroundColor: bg }]}>
				{ChatIcon() != null && (
					<Image
						source={ChatIcon()}
						style={{ width: 24, height: 24, tintColor: tint }}
					/>
				)}
			</View>
		</Pressable>
	)
}

const st = StyleSheet.create({
	outer: { width: ICON, height: ICON },
	icon: {
		width: ICON,
		height: ICON,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
})

const railSt = StyleSheet.create({
	outer: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		width: ICON,
		height: ICON,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
