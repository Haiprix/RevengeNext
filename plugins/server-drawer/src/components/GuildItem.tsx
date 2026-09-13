import { kmmiio } from '../lib/kmmiio'
import { useFluxStore } from '../lib/modules'
import GuildIcon from './GuildIcon'

const { View, Text, Pressable, Animated, StyleSheet } =
	revenge.react.ReactNative

const ICON = 48

function GuildBadge({ guildId }: { guildId: string }) {
	const mentionCount = useFluxStore(
		'GuildReadStateStore',
		store => store?.getMentionCount?.(guildId) ?? 0,
		0,
	)
	const hasUnread = useFluxStore(
		'GuildReadStateStore',
		store => store?.hasUnread?.(guildId) ?? false,
		false,
	)

	if (mentionCount > 0) {
		return (
			<View style={bd.outline}>
				<View style={bd.badge}>
					<Text style={bd.text}>
						{mentionCount > 99 ? '99+' : String(mentionCount)}
					</Text>
				</View>
			</View>
		)
	}

	if (hasUnread) {
		return (
			<View style={bd.dotOutline}>
				<View style={bd.dot} />
			</View>
		)
	}

	return null
}

export default function GuildItem({
	node,
	onPick,
	showNames,
}: {
	node: any
	onPick: (id: string) => void
	showNames?: boolean
}) {
	const React = revenge.react.React

	const scale = React.useRef(
		new revenge.react.ReactNative.Animated.Value(1),
	).current
	const [pressed, setPressed] = React.useState(false)
	const springTo = React.useCallback(
		(v: number) => {
			Animated.spring(scale, {
				toValue: v,
				useNativeDriver: true,
				damping: 14,
				stiffness: 220,
			}).start()
		},
		[scale],
	)

	React.useEffect(() => {
		springTo(pressed ? 0.85 : 1)
	}, [pressed, springTo])

	const guildId = node.id as string
	const name = useFluxStore(
		'GuildStore',
		store => store?.getGuild?.(guildId)?.name ?? '',
		'',
	)
	const labelColor = kmmiio()?.resolveColor?.('TEXT_NORMAL')

	return (
		<Pressable
			onPress={() => onPick(guildId)}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
		>
			<View style={st.outer}>
				<View style={st.iconWrap} collapsable={false}>
					<Animated.View style={[st.icon, { transform: [{ scale }] }]}>
						<GuildIcon id={guildId} />
					</Animated.View>
					<GuildBadge guildId={guildId} />
				</View>
				{showNames && (
					<Text
						numberOfLines={2}
						ellipsizeMode="tail"
						style={[st.label, { color: labelColor }]}
					>
						{name}
					</Text>
				)}
			</View>
		</Pressable>
	)
}

const st = StyleSheet.create({
	outer: { width: ICON, alignItems: 'center' },
	iconWrap: { width: ICON, height: ICON },
	icon: { width: ICON, height: ICON, borderRadius: 16, overflow: 'hidden' },
	label: {
		marginTop: 4,
		width: ICON,
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '600',
		textAlign: 'center',
	},
})

const bd = StyleSheet.create({
	outline: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		padding: 2,
		borderRadius: 999,
		backgroundColor: '#1a1a2e',
		alignItems: 'center',
		justifyContent: 'center',
	},
	badge: {
		minWidth: 19,
		height: 19,
		borderRadius: 999,
		backgroundColor: '#ed4245',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 5,
	},
	text: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '700',
		lineHeight: 19,
	},
	dotOutline: {
		position: 'absolute',
		bottom: -2,
		right: -2,
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: '#1a1a2e',
		alignItems: 'center',
		justifyContent: 'center',
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#ed4245',
	},
})
