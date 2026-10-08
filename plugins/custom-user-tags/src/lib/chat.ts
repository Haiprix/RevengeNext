import { ReactNative } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { hookWithArgs } from "../lib/hook";
import resolveTag from "../lib/resolveTag";

export default () => {
    const getTagProperties = lookupModule(withProps("getTagProperties"))?.[0] as any;

    if (!getTagProperties) return () => {};

    return hookWithArgs(
        getTagProperties,
        "getTagProperties",
        ([data]: any[], ret: any) => {
            if (ret?.tagType || ret?.__revengeCustomTag) return;

            const userId = data?.message?.author?.id;
            if (!userId) return;

            const tag = resolveTag(userId);
            if (!tag) return;

            // SVG icons can't render inside chat text, so chat uses the emoji/symbol fallback.
            const tagText = [tag.icon?.fallback, tag.text].filter(Boolean).join(" ");
            if (!tagText) return;

            const processColor = (ReactNative as any).processColor;

            return {
                ...ret,
                tagText,
                tagTextColor: processColor?.(tag.textColor),
                tagBackgroundColor: processColor?.(tag.backgroundColor),
                tagVerified: false,
                tagType: undefined,
                __revengeCustomTag: true,
            };
        },
    );
};
