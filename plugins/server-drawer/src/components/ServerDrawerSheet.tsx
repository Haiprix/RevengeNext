import { createGuild, logStatus, openDms, switchGuild } from '../lib/actions'
import { kmmiio } from '../lib/kmmiio'
import {
	getAssetId,
	getExternalCoordinationContext,
	getGestureContext,
	getQuestDockMode,
	lazy,
	reactive,
	useFluxStore,
} from '../lib/modules'
import DmTile from './DmTile'
import FolderItem from './FolderItem'
import GuildItem from './GuildItem'
import type { Context } from 'react'

const {
	View,
	Pressable,
	Animated,
	ScrollView,
	BackHandler,
	Dimensions,
	StyleSheet,
	Image,
} = revenge.react.ReactNative

const ICON = 48
const GAP = 6
const PAD = 12
const HIT_SLOP = { top: 4, left: 12, bottom: 4, right: 12 }

const FallbackGestureContext = revenge.react.React.createContext(null)
const FallbackExternalContext = revenge.react.React.createContext(null)

function CreateJoinButton({ onPress }: { onPress: () => void }) {
	const React = revenge.react.React
	const scale = React.useRef(
		new revenge.react.ReactNative.Animated.Value(1),
	).current
	const scaleDown = React.useCallback(() => {
		Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()
	}, [scale])
	const scaleUp = React.useCallback(() => {
		Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
	}, [scale])

	const resolveColor = kmmiio()?.resolveColor
	const bg = resolveColor?.('MOBILE_GUILDBAR_ICON_BACKGROUND_DEFAULT')
	const tint = resolveColor?.('MOBILE_GUILDBAR_ICON_DEFAULT')
	const PlusAsset = lazy(() => getAssetId('CirclePlusIcon-primary'))

	return (
		<Pressable
			onPress={onPress}
			onPressIn={scaleDown}
			onPressOut={scaleUp}
			hitSlop={HIT_SLOP}
		>
			<Animated.View
				style={[st.createJoin, { backgroundColor: bg, transform: [{ scale }] }]}
			>
				{PlusAsset() != null && (
					<Image
						source={PlusAsset()}
						style={{ width: 24, height: 24, tintColor: tint }}
					/>
				)}
			</Animated.View>
		</Pressable>
	)
}

export default function ServerDrawerSheet({
	gestureContext,
}: {
	gestureContext?: any
}) {
	const React = revenge.react.React

	const extCtx = React.useContext(
		(getExternalCoordinationContext()?.QuestDockExternalCoordinationContext ??
			FallbackExternalContext) as Context<any>,
	)
	const setMode = (extCtx as any)?.setRestingQuestDockMode

	const collapseDock = React.useCallback(() => {
		try {
			const { QuestDockMode } = getQuestDockMode() ?? {}
			if (setMode && QuestDockMode?.COLLAPSED != null)
				setMode(QuestDockMode.COLLAPSED)
		} catch {
			// dock coordination unavailable - navigation still works
		}
	}, [setMode])

	const pick = React.useCallback(
		(id: string) => {
			collapseDock()
			switchGuild(id)
		},
		[collapseDock],
	)

	const nodes = useFluxStore(
		'SortedGuildStore',
		store =>
			(store?.getGuildsTree?.()?.root?.children ?? []).filter(
				(node: any) => node.type !== 'root',
			),
		[],
	)

	const gestureCtx = (gestureContext ??
		getGestureContext()) as Context<any> | null
	const ctx = React.useContext(gestureCtx ?? FallbackGestureContext) as any
	const minH = ctx?.minExpandedContentHeight

	const onLayout = React.useCallback(
		(e: any) => {
			if (!minH) return
			const h = e.nativeEvent.layout.height
			if (minH.get() !== h) minH.set(h)
		},
		[minH],
	)

	const openCreateJoin = React.useCallback(() => {
		collapseDock()
		createGuild()
	}, [collapseDock])

	const specs = ctx?.questDockWrapperSpecs

	React.useEffect(() => {
		const { QuestDockMode } = getQuestDockMode() ?? {}
		if (!setMode || !QuestDockMode || !specs) return
		const sub = BackHandler.addEventListener('hardwareBackPress', () => {
			const h = specs.get()?.height ?? 56
			if (h > 80) {
				setMode(QuestDockMode.COLLAPSED)
				return true
			}
			return false
		})
		return () => sub.remove()
	}, [setMode, specs])

	const { width: winW } = Dimensions.get('window')

	const cols = Math.max(3, Math.floor((winW - PAD * 2 + GAP) / (ICON + GAP)))
	const totalW = cols * ICON + (cols - 1) * GAP
	const padX = Math.max(0, (winW - totalW) / 2)

	const { hideDmTile, showGuildNames } = reactive()

	React.useEffect(() => {
		logStatus()
	}, [])

	return (
		<ScrollView style={st.alignTop} showsVerticalScrollIndicator={false}>
			<View
				style={[st.grid, { paddingHorizontal: padX, gap: GAP }]}
				onLayout={onLayout}
			>
				{!hideDmTile && (
					<DmTile
						onPress={() => {
							collapseDock()
							openDms()
						}}
					/>
				)}
				{nodes.map((node: any) =>
					node.type === 'folder' ? (
						<FolderItem
							key={node.id}
							node={node}
							onPick={pick}
							showNames={!!showGuildNames}
						/>
					) : (
						<GuildItem
							key={node.id}
							node={node}
							onPick={pick}
							showNames={!!showGuildNames}
						/>
					),
				)}
				<CreateJoinButton onPress={openCreateJoin} />
			</View>
		</ScrollView>
	)
}

const st = StyleSheet.create({
	alignTop: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingTop: 4,
		paddingBottom: 16,
	},
	createJoin: {
		width: ICON,
		height: ICON,
		borderRadius: 16,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
})
