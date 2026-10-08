import { React, ReactNative } from "@revenge-mod/react";
import { TableRow, TableRowGroup } from "./table";
import NoteBox from "./NoteBox";

const { Text } = ReactNative;

export interface ListItem {
    key: string;
    label: string;
    subLabel?: string;
    onPress?: () => void;
}

export default function ListSection({
    title,
    items,
    emptyText,
}: {
    title: string;
    items: ListItem[];
    emptyText: string;
}) {
    return (
        <TableRowGroup title={title}>
            {items.length === 0 ? (
                <NoteBox>{emptyText}</NoteBox>
            ) : (
                items.map((item) => (
                    <TableRow
                        key={item.key}
                        label={item.label}
                        subLabel={item.subLabel}
                        onPress={item.onPress}
                        trailing={
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: "700",
                                }}
                            >
                                ›
                            </Text>
                        }
                    />
                ))
            )}
        </TableRowGroup>
    );
}