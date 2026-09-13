import { findByProps } from './modules'

const pick = (prop: string): any => findByProps(prop)?.[prop]

const RealTableRow: any = pick('TableRow')
const TableFamily: any = findByProps('TableRowGroup', 'Stack')

export const TableRow: any = RealTableRow
export const TableRowGroup: any = TableFamily?.TableRowGroup
export const TableSwitchRow: any =
	pick('TableSwitchRow') ??
	findByProps('TableSwitchRow')?.default?.TableSwitchRow
export const Stack: any = TableFamily?.Stack
export const SettingsScrollView: any =
	pick('ScrollView') ?? findByProps('ScrollView')?.default?.ScrollView
