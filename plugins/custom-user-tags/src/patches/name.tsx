import { lookupModule } from "@revenge-mod/modules/finders";
import { findInReactTree } from "../lib/findInReactTree";
import { React } from "@revenge-mod/react";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { after } from "@revenge-mod/patcher";
import resolveTag from "../lib/resolveTag";
const { lookupModule } = revenge.modules.finders
const { withProps } = revenge.modules.finders.filters

const TagModule = lookupModule(withProps("getBotLabel")?.[0],

// findByName("DisplayName") doesn't survive minification - findByProps looks at the property key
// instead.
const DisplayNameModule = findByProps("DisplayName") as any;

export default () => {
    if (!DisplayNameModule?.DisplayName) return () => {};

    return after("DisplayName", DisplayNameModule, ([{ user }]: any[], ret: any) => {
        try {
            if (findInReactTree(ret, (c) => c?.props?.__revengeCustomTag)) return;

            const tagComponent = findInReactTree(ret, (c) => c?.type?.Types);
            if (tagComponent && tagComponent.props?.type !== 0) return;

            const tag = resolveTag(user?.id);
            if (!tag) return;

            if (tagComponent) {
                tagComponent.props = {
                    type: 0,
                    text: tag.text,
                    textColor: tag.textColor,
                    backgroundColor: tag.backgroundColor,
                    icon: tag.icon,
                    iconColor: tag.iconColor,
                    verified: false,
                    __revengeCustomTag: true
                };
                return;
            }

            const row = findInReactTree(ret, (c) => c?.props?.style?.flexDirection === "row");
            if (!Array.isArray(row?.props?.children) || !TagModule) return;

            row.props.children.push(
                <TagModule.default
                    style={{ marginLeft: 0 }}
                    type={0}
                    text={tag.text}
                    textColor={tag.textColor}
                    backgroundColor={tag.backgroundColor}
                    icon={tag.icon}
                    iconColor={tag.iconColor}
                    verified={false}
                    __revengeCustomTag={true}
                />
            );
        } catch {
            // Never let one bad lookup take down every name row on screen.
        }
    });
};
