import { React } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { after } from "@revenge-mod/patcher";
import { finders } from "@shared/modules";
import resolveTag from "../lib/resolveTag";

const { lookupModule } = revenge.modules.finders
const { withProps } = revenge.modules.finders.filters

export default () => {
	const getTagProperties = lookupModule<any>(
		withProps("getTagProperties"),
	)?.[0]

	if (!getTagProperties) return () => {}

	return after(
		getTagProperties,
		"getTagProperties",
		([data]: any[], ret: any) => {
			if (ret?.tagType || ret?.__revengeCustomTag) return

			const userId = data?.message?.author?.id
			if (!userId) return

			const tag = resolveTag(userId)
			if (!tag) return

			const tagText = tag.icon
				? tag.text
					? `${tag.icon.fallback} ${tag.text}`
					: tag.icon.fallback
				: tag.text

			return {
				...ret,
				tagText,
				tagTextColor: tag.textColor
					? revenge.react.native?.processColor?.(tag.textColor)
					: undefined,
				tagBackgroundColor: revenge.react.native?.processColor?.(
					tag.backgroundColor,
				),
				tagVerified: false,
				tagType: undefined,
				__revengeCustomTag: true,
			}
		},
	)
}