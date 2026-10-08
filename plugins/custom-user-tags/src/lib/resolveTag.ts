import type { CustomTagsStorage, UserTag } from './tags'
import { getIcon } from './icons'

export interface ResolvedTag {
	text: string
	textColor: string
	backgroundColor: string
	icon?: {
		path?: string
		svg?: string
		fallback?: string
		viewBox?: string
	}
	iconColor?: string
}

let storage: CustomTagsStorage | undefined

export function setTagStorage(handle: CustomTagsStorage): void {
	storage = handle
}

export function getTagStorage(): CustomTagsStorage | undefined {
	return storage
}

export function allTags(): Record<string, UserTag> {
	if (!storage) {
		storage = { tags: {} }
	}
	storage.tags ??= {}
	return storage.tags
}

export function getUserTag(userId: string | undefined): UserTag | undefined {
	if (!userId) return undefined
	return allTags()[userId]
}

export function setUserTag(userId: string, tag: UserTag): void {
	allTags()[userId] = tag
}

export function removeUserTag(userId: string): void {
	delete allTags()[userId]
}

export default function resolveTag(
	userId: string | undefined,
): ResolvedTag | undefined {
	const tag = getUserTag(userId)
	if (!tag) return undefined

	const iconDef = tag.icon ? getIcon(tag.icon) : undefined
	const icon = iconDef
		? {
			path: iconDef.path,
			fallback: iconDef.fallback,
			viewBox: iconDef.viewBox,
		}
		: tag.customSvg
			? { svg: tag.customSvg, fallback: tag.customSvgFallback }
			: undefined

	return {
		text: tag.text,
		textColor: tag.color ?? '#ffffff',
		backgroundColor: '#5865F2',
		icon,
		iconColor: '#ffffff',
	}
}
