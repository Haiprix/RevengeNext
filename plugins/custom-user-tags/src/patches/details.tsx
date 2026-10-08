// gng help me im dying here :sob: :broken_heart:
import { React } from "@revenge-mod/react";
import { lookupModule } from "@revenge-mod/modules/finders";
import { withProps } from "@revenge-mod/modules/finders/filters";
import { after } from "@revenge-mod/patcher";
import resolveTag from "../lib/resolveTag";
import openTagEditor from "../ui/TagEditorAlert";
import { findInReactTree } from "../lib/findInReactTree";

const { lookupModule } = revenge.modules.finders
const { withProps } = revenge.modules.finders.filters

const TagModule = lookupModule(
	withProps("getBotLabel"),
)?.[0]

const rowPatch = ([{ user }]: any[], res: any) => {
	try {
		if (!user?.id || !res?.props) return

		// Long press
		const existingLongPress = res.props.onLongPress

		res.props.onLongPress = (...args: any[]) => {
			existingLongPress?.(...args)

			openTagEditor(
				user.id,
				user.globalName ||
					user.username ||
					user.id,
			)
		}

		const label = res.props.label
		if (!label) return

		const nameContainer = findInReactTree(
			label,
			(c: any) =>
				Array.isArray(c?.props?.children) &&
				c.props.children.some(
					(ch: any) =>
						typeof ch === "string" ||
						typeof ch?.props?.children === "string",
				),
		)

		if (!nameContainer) return

		if (
			findInReactTree(
				nameContainer,
				(c: any) => c?.props?.__revengeCustomTag,
			)
		) {
			return
		}

		const existingTag = findInReactTree(
			nameContainer,
			(c: any) => c?.type?.Types,
		)

		// Discord's own built-in tag
		if (
			existingTag &&
			existingTag.props?.type !== 0
		) {
			return
		}

		const tag = resolveTag(user.id)
		if (!tag) return

		// Replace existing tag
		if (existingTag) {
			Object.assign(existingTag.props, {
				type: 0,
				text: tag.text,
				textColor: tag.textColor,
				backgroundColor: tag.backgroundColor,
				icon: tag.icon,
				iconColor: tag.iconColor,
				verified: false,
				__revengeCustomTag: true,
			})

			return
		}

		// No existing tag
		const children = Array.isArray(
			nameContainer.props.children,
		)
			? [...nameContainer.props.children]
			: [nameContainer.props.children]

		if (TagModule?.default) {
			children.push(
				revenge.react.React.createElement(
					TagModule.default,
					{
						type: 0,
						text: tag.text,
						textColor: tag.textColor,
						backgroundColor: tag.backgroundColor,
						icon: tag.icon,
						iconColor: tag.iconColor,
						verified: false,
						__revengeCustomTag: true,
					},
				),
			)
		}

		nameContainer.props.children = children
	} catch (error) {
		console.error(
			"[CustomTags] failed to patch user row:",
			error,
		)
	}
}

export default () => {
	const patches: (() => void)[] = []

	const UserRow = lookupModule(
		withProps("onLongPress", "user"),
	)?.[0]

	if (!UserRow) {
		console.warn(
			"[CustomTags] UserRow module not found",
		)

		return () => {}
	}

	patches.push(
		after(
			UserRow,
			"type",
			rowPatch,
		),
	)

	return () => {
		for (const unpatch of patches) {
			unpatch()
		}
	}
}