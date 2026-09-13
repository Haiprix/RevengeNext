import { toggleFolder } from '../lib/actions'
import { kmmiio } from '../lib/kmmiio'
import { lazy, useFluxStore } from '../lib/modules'
import GuildIcon from './GuildIcon'
import GuildItem from './GuildItem'
import type { ReactNode } from 'react'

const { View, Text, Image, Animated, Pressable, StyleSheet } =
	revenge.react.ReactNative

const ICON = 48
const MINI = 16

const POS = [
	{ top: 6, left: 6 },
	{ top: 6, right: 6 },
	{ bottom: 6, left: 6 },
	{ bottom: 6, right: 6 },
]

const FolderIcon = lazy(() => {
	try {
		return revenge.assets.getAssetIdByName('FolderIcon')
	} catch {
		return undefined
	}
})

function folderColor(color?: number | null): string {
	if (color == null) return '#5865f2'
	return `#${color.toString(16).padStart(6, '0')}`
}

function FolderBadge({ node }: { node: any }) {
	const total = useFluxStore(
		'GuildReadStateStore',
		store => {
			let sum = 0
			for (const child of node.children) {
				sum += store?.getMentionCount?.(child.id) ?? 0
			}
			return sum
		},
		0,
	)

	if (total > 0) {
		return (
			<View style={fbd.outline}>
				<View style={fbd.badge}>
					<Text style={fbd.text}>{total > 99 ? '99+' : String(total)}</Text>
				</View>
			</View>
		)
	}
	return null
}

function FolderCover({ node }: { node: any }) {
	const col = folderColor(node.color)
	return (
		<View style={fc.outer}>
			<View style={[fc.icon, { backgroundColor: col }]}>
				{node.children.slice(0, 4).map((ch: any, i: number) => (
					<View key={ch.id} style={[fc.cell, POS[i]]}>
						<GuildIcon id={ch.id as string} size={MINI} />
					</View>
				))}
			</View>
			<FolderBadge node={node} />
		</View>
	)
}

const fc = StyleSheet.create({
	outer: { width: ICON, height: ICON },
	icon: { width: ICON, height: ICON, borderRadius: 16, overflow: 'hidden' },
	cell: {
		position: 'absolute',
		width: MINI,
		height: MINI,
		borderRadius: 8,
		overflow: 'hidden',
	},
})

function FadeIn({ children }: { children: ReactNode }) {
	const React = revenge.react.React
	const opacity = React.useRef(
		new revenge.react.ReactNative.Animated.Value(0),
	).current
	React.useEffect(() => {
		Animated.timing(opacity, {
			toValue: 1,
			duration: 180,
			useNativeDriver: true,
		}).start()
	}, [])
	return <Animated.View style={{ opacity }}>{children}</Animated.View>
}

export default function FolderItem({
	node,
	onPick,
	showNames,
}: {
	node: any
	onPick: (id: string) => void
	showNames?: boolean
}) {
	const React = revenge.react.React

	const open = useFluxStore(
		'ExpandedGuildFolderStore',
		store =>
			store?.getExpandedFolders?.() instanceof Set &&
			store.getExpandedFolders().has(node.id),
		false,
	)

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

	React.useEffect(() => {
		springTo(1)
	}, [open, springTo])

	const labelColor = kmmiio()?.resolveColor?.('TEXT_NORMAL')

	const folderContent = (icon: ReactNode) => (
		<View style={fo.wrap}>
			{icon}
			{showNames && node.name ? (
				<Text
					numberOfLines={2}
					ellipsizeMode="tail"
					style={[fo.label, { color: labelColor }]}
				>
					{node.name}
				</Text>
			) : null}
		</View>
	)

	const folderButton = (content: ReactNode) => (
		<Pressable
			onPress={() => toggleFolder(node.id as string)}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
		>
			<View collapsable={false}>
				<Animated.View style={{ transform: [{ scale }] }}>
					{content}
				</Animated.View>
			</View>
		</Pressable>
	)

	return open ? (
		<>
			{folderButton(
				folderContent(
					<View
						style={[fo.openIcon, { backgroundColor: folderColor(node.color) }]}
					>
						{FolderIcon() != null && (
							<Image
								source={FolderIcon()}
								style={fo.folderImg}
								tintColor="#fff"
							/>
						)}
					</View>,
				),
			)}
			{node.children.map((ch: any) => (
				<FadeIn key={ch.id}>
					<GuildItem node={ch} onPick={onPick} showNames={showNames} />
				</FadeIn>
			))}
		</>
	) : (
		folderButton(folderContent(<FolderCover node={node} />))
	)
}

const fo = StyleSheet.create({
	wrap: { width: ICON, alignItems: 'center' },
	openIcon: {
		width: ICON,
		height: ICON,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	folderImg: { width: 24, height: 24 },
	label: {
		marginTop: 4,
		width: ICON,
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '600',
		textAlign: 'center',
	},
})

const fbd = StyleSheet.create({
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
})
