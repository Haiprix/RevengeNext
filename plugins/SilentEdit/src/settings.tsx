import { DEFAULTS } from './state'
import type { SilentEditStorage } from './state'
import type { PluginApi } from '@revenge-mod/plugins/types'

export default function Settings({
	api,
}: {
	api: PluginApi<{ jsonStorage: SilentEditStorage }>
}) {
	const { Page } = revenge.components as any
	const { ScrollView } = revenge.react.ReactNative
	const { Stack, TableRowGroup, TableSwitchRow } = revenge.discord.design.Design

	const s = { ...DEFAULTS, ...(api.jsonStorage.use() ?? {}) }

	return (
		<Page>
			<ScrollView contentContainerStyle={{ paddingBottom: 38 }}>
				<Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
					<TableRowGroup title="Settings">
						<TableSwitchRow
							label="Inject Original Edit"
							subLabel="Replace original edit with silent edit."
							value={s.overrideNative}
							onValueChange={(v: boolean) =>
								api.jsonStorage.set({ ...s, overrideNative: v })
							}
						/>
					</TableRowGroup>
				</Stack>
			</ScrollView>
		</Page>
	)
}