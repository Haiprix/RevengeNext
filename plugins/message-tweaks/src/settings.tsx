import { DEFAULTS } from './defaults'
import { TranslatorGroup } from './lib/translatorSettings'
import type { PluginApi } from '@revenge-mod/plugins/types'
import type { MessageTweaksStorage } from './types'

export default function Settings({
	api,
}: {
	api: PluginApi<{ jsonStorage: MessageTweaksStorage }>
}) {
	const { Page } = revenge.components as any
	const { ScrollView, View } = revenge.react.ReactNative
	const {
		Stack,
		SegmentedControl,
		SegmentedControlPages,
		TableRowGroup,
		TableSwitchRow,
		useSegmentedControlState,
	} = revenge.discord.design.Design
	const { useState } = revenge.react.React

	const [pageWidth, setPageWidth] = useState(0)

	const s = { ...DEFAULTS, ...(api.jsonStorage.use() ?? {}) }
	const set = (patch: Partial<MessageTweaksStorage>) =>
		api.jsonStorage.set({ ...s, ...patch })

	const segmented = useSegmentedControlState({
		items: [
			{
				id: 'display',
				label: 'Display',
				page: (
					<ScrollView contentContainerStyle={{ padding: 0 }}>
						<Stack>
							<TableRowGroup title="Display">
								<TableSwitchRow
									label="Precise timestamps"
									value={s.preciseTimestamp}
									onValueChange={v => set({ preciseTimestamp: v })}
								/>
								<TableSwitchRow
									label="Username next to nickname"
									value={s.showUsername}
									onValueChange={v => set({ showUsername: v })}
								/>
							</TableRowGroup>
							<TranslatorGroup s={s} set={set} />
						</Stack>
					</ScrollView>
				),
			},
			{
				id: 'logging',
				label: 'Logging',
				page: (
					<ScrollView contentContainerStyle={{ padding: 0 }}>
						<Stack>
							<TableRowGroup title="Logging">
								<TableSwitchRow
									label="Unspoiler everything"
									value={s.unspoilAll}
									onValueChange={v => set({ unspoilAll: v })}
								/>
								<TableSwitchRow
									label="Keep deleted messages in chat"
									value={s.keepDeleted}
									onValueChange={v => set({ keepDeleted: v })}
								/>
								<TableSwitchRow
									label="Log my own edits & deletions too"
									value={s.logOwnEdits}
									onValueChange={v => set({ logOwnEdits: v })}
								/>
								<TableSwitchRow
									label="Show edit history"
									value={s.showEditTrail}
									onValueChange={v => set({ showEditTrail: v })}
								/>
							</TableRowGroup>
						</Stack>
					</ScrollView>
				),
			},
			{
				id: 'local',
				label: 'Local',
				page: (
					<ScrollView contentContainerStyle={{ padding: 0 }}>
						<Stack>
							<TableRowGroup title="Local">
								<TableSwitchRow
									label="Show “Edit Locally”"
									value={s.showLocalEditButton}
									onValueChange={v => set({ showLocalEditButton: v })}
								/>
								<TableSwitchRow
									label="Show “Hide for Me”"
									value={s.showHideButton}
									onValueChange={v => set({ showHideButton: v })}
								/>
							</TableRowGroup>
						</Stack>
					</ScrollView>
				),
			},
		],
		pageWidth,
	})

	return (
		<Page>
			<View
				style={{ flex: 1 }}
				onLayout={e => setPageWidth(e.nativeEvent.layout.width)}
			>
				<View
					style={{
						paddingTop: 12,
						paddingBottom: 20,
						paddingHorizontal: 16,
					}}
				>
					<SegmentedControl
						state={segmented}
						variant="default"
						keyboardShouldPersistTaps="handled"
					/>
				</View>
				<SegmentedControlPages state={segmented} style={{ flex: 1 }} />
			</View>
		</Page>
	)
}