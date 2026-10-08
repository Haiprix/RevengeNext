import { React, ReactNative } from "@revenge-mod/react";
import { findInReactTree } from "../lib/findInReactTree";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { hookWithArgs } from "../lib/hook";
import Icon from "../ui/Icon";

const { View, Text } = ReactNative;

// Discord's Tag component ignores custom text/color props unless pushed into the already-rendered
// tree directly.
export default () => {
    // Looked up when the patch is installed, not when this file loads.
    const Tag = lookupModule(withProps("getBotLabel"))?.[0] as any;
    if (!Tag) return () => {};

    return hookWithArgs(Tag, "default", ([{ text, textColor, backgroundColor, icon, iconColor }]: any[], ret: any) => {
        const label = findInReactTree(ret, (c) => typeof c?.props?.children === "string");
        if (!label) return;

        if (text != null) label.props.children = text;
        if (textColor) label.props.style?.push?.({ color: textColor });
        if (backgroundColor) ret?.props?.style?.push?.({ backgroundColor });

        if (icon?.path || icon?.svg) {
            const style = label.props.style ?? {};
            ret.props.children = (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon icon={icon} size={12} color={iconColor ?? textColor} style={{ marginRight: text ? 4 : 0 }} />
                    <Text style={style}>{text != null ? text : label.props.children}</Text>
                </View>
            );
        }
    });
};
