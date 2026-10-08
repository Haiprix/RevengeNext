export interface UserTag {
    text: string;
    color: string;
    icon?: string;
    customSvg?: string;
    customSvgFallback?: string;
    iconOnly?: boolean;

    // Optional properties used by the tag renderer.
    textColor?: string;
    backgroundColor?: string;
    gradientColor?: string;
    iconColor?: string;
    verified?: boolean;
}

export interface CustomTagsStorage {
    tags: Record<string, UserTag>;
}

export function allTags(
    jsonStorage: CustomTagsStorage,
): Record<string, UserTag> {
    jsonStorage.tags ??= {};
    return jsonStorage.tags;
}

export function getUserTag(
    jsonStorage: CustomTagsStorage,
    userId: string | undefined,
): UserTag | undefined {
    if (!userId) return undefined;

    return allTags(jsonStorage)[userId];
}

export function setUserTag(
    jsonStorage: CustomTagsStorage,
    userId: string,
    tag: UserTag,
): void {
    allTags(jsonStorage)[userId] = tag;
}

export function removeUserTag(
    jsonStorage: CustomTagsStorage,
    userId: string,
): void {
    delete allTags(jsonStorage)[userId];
}
