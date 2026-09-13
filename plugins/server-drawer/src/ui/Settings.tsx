import { defaults } from '../lib/modules'
import type { PluginApi } from '@revenge-mod/plugins/types'
import type { ServerDrawerStorage } from '../lib/modules'

export default function Settings({
	api,
}: {
	api: PluginApi<{ jsonStorage: ServerDrawerStorage }>
}) {
	const { Page } =
		revenge.components as typeof import('@revenge-mod/components')
	const { ScrollView } = revenge.react.ReactNative
	const { Stack, TableRowGroup, TableSwitchRow } = revenge.discord.design.Design

	const s = { ...defaults, ...(api.jsonStorage.use() ?? {}) }
	const set = (patch: Partial<ServerDrawerStorage>) =>
		api.jsonStorage.set({ ...s, ...patch })

	return (
		<Page>
			<ScrollView contentContainerStyle={{ padding: 0 }}>
				<Stack>
					<TableRowGroup title="Server Drawer">
						<TableSwitchRow
							label="Hide DM Tile"
							subLabel="Removes the DM tile from the dock"
							value={s.hideDmTile}
							onValueChange={v => set({ hideDmTile: v })}
						/>
						<TableSwitchRow
							label="Show Guild Names"
							subLabel="Displays guild names under each server icon"
							value={s.showGuildNames}
							onValueChange={v => set({ showGuildNames: v })}
						/>
					</TableRowGroup>
				</Stack>
			</ScrollView>
		</Page>
	)
}
