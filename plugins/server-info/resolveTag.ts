import { isValidHex, normalizeHex } from "@shared/lib/color";
import { getUserTag, type TagStorage } from "./tags";
import { getIcon, type IconDef } from "./icons";

/** A stored tag turned into what the renderers (chat, name, profile, member list) need. */
export interface ResolvedTag {
    text: string;
    textColor: string;
    backgroundColor: string;
    icon?: IconDef;
    iconColor: string;
}

let tagStorage: TagStorage | undefined;

/** Connects the resolver to the plugin's jsonStorage. Called from index.ts and from Settings. */
export function setTagStorage(storage: TagStorage | undefined): void {
    tagStorage = storage;
}

export function getTagStorage(): TagStorage | undefined {
    return tagStorage;
}

function readableTextColor(hex: string): string {
    const full = normalizeHex(hex).slice(1);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);

    // Perceived brightness: light backgrounds get dark text, dark backgrounds get white text.
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#000000" : "#FFFFFF";
}

/** Gets the tag configured for a Discord user, ready to render. */
export default function resolveTag(userId: string | undefined): ResolvedTag | undefined {
    const tag = getUserTag(tagStorage, userId);
    if (!tag) return undefined;

    const backgroundColor = isValidHex(tag.color) ? normalizeHex(tag.color) : "#5865F2";
    const textColor = readableTextColor(backgroundColor);

    let icon: IconDef | undefined;
    if (tag.customSvg) {
        icon = {
            id: "custom",
            name: "Custom",
            fallback: tag.customSvgFallback ?? "",
            svg: tag.customSvg,
        };
    } else {
        icon = getIcon(tag.icon);
    }

    const text = tag.iconOnly && icon ? "" : tag.text;
    if (!text && !icon) return undefined;

    return { text, textColor, backgroundColor, icon, iconColor: textColor };
}
