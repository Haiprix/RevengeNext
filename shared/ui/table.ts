import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";

const findComponent = (prop: string): any => {
    return lookupModule(withProps(prop))?.[0]?.[prop];
};

const RealTableRow = findComponent("TableRow");

export const TableRow: any = RealTableRow;
export const TableRowGroup: any = findComponent("TableRowGroup");
export const TableSwitchRow: any = findComponent("TableSwitchRow");
export const TableRadioRow: any = findComponent("TableRadioRow");
export const TableRadioGroup: any = findComponent("TableRadioGroup");
export const TableCheckboxRow: any = findComponent("TableCheckboxRow");
export const TextInput: any = findComponent("TextInput");

export const TableRowIcon: any = RealTableRow?.Icon;
export const TableRowArrow: any = RealTableRow?.Arrow;
export const TableRowTrailingText: any = RealTableRow?.TrailingText;