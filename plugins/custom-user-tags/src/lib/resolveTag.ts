import {
    getUserTag,
    type CustomTagsStorage,
    type UserTag,
} from "./tags";

let tagStorage: CustomTagsStorage | undefined;

/**
 * Connects the resolver to the plugin's jsonStorage.
 * Call this once from index.ts when the plugin starts.
 */
export function setTagStorage(storage: CustomTagsStorage): void {
    tagStorage = storage;
}

/**
 * Gets the currently configured tag for a Discord user.
 */
export default function resolveTag(
    userId: string | undefined,
): UserTag | undefined {
    if (!userId || !tagStorage) return undefined;

    return getUserTag(tagStorage, userId);
}



