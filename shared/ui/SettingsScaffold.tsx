import { React, ReactNative } from "@revenge-mod/react";

const { ScrollView, View } = ReactNative;

/** Consistent wrapper for every plugin's settings screen. */
export default function SettingsScaffold({
    children,
}: {
    children: any;
}) {
    return (
        <ScrollView style={{ flex: 1 }}>
            {children}
            <View style={{ height: 24 }} />
        </ScrollView>
    );
}