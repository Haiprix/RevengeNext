import { React } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { findInReactTree } from "../lib/findInReactTree";
import { hookWithArgs } from "../lib/hook";
import resolveTag from "../lib/resolveTag";

export default () => {
    // Both lookups happen here, when the patch is installed, and not at the top of the file.
    // lookupModule() returns a [module, id] pair, so the module itself is element 0.
    // (findByName("DisplayName") doesn't survive minification - looking at the property key does.)
    const DisplayNameModule = lookupModule(withProps("DisplayName"))?.[0] as any;
    const TagModule = lookupModule(withProps("getBotLabel"))?.[0] as any;

    if (!DisplayNameModule?.DisplayName) return () => {};

    return hookWithArgs(DisplayNameModule, "DisplayName", ([{ user }]: any[], ret: any) => {
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
            if (!Array.isArray(row?.props?.children) || !TagModule?.default) return;

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
