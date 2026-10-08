export interface UserTag {
    text: string;
    color: string;
    icon?: string;
    customSvg?: string;
    customSvgFallback?: string;
    iconOnly?: boolean;
}

export interface CustomTagsStorage {
    tags: Record<string, UserTag>;
    savedTags?: Record<string, UserTag>;
}

/**
 * The `jsonStorage` object Revenge Next hands to a plugin is NOT the plain data. It is a wrapper:
 *  - `cache`   -> the loaded data (undefined until the file has been read)
 *  - `set()`   -> saves to disk (async); `set(value, true)` replaces everything
 *  - `use()`   -> React hook that re-renders when the data changes
 * Only the parts this plugin uses are described here.
 */
export interface TagStorage {
    cache?: CustomTagsStorage;
    set(value: CustomTagsStorage, replace: true): Promise<void>;
    use?(): CustomTagsStorage | undefined;
}

/** Current data, always with both maps present. `live` is the value from storage.use(), if any. */
export function readData(
    storage: TagStorage | undefined,
    live?: CustomTagsStorage,
): { tags: Record<string, UserTag>; savedTags: Record<string, UserTag> } {
    const data = live ?? storage?.cache;

    return {
        tags: data?.tags ?? {},
        savedTags: data?.savedTags ?? {},
    };
}

// Writes always build the complete new data and replace the stored one. A plain merge can't
// remove keys, so deleting a tag would silently do nothing.
async function write(
    storage: TagStorage,
    change: (data: { tags: Record<string, UserTag>; savedTags: Record<string, UserTag> }) => void,
): Promise<void> {
    const data = JSON.parse(JSON.stringify(readData(storage)));
    change(data);
    await storage.set(data, true);
}

export function getUserTag(
    storage: TagStorage | undefined,
    userId: string | undefined,
): UserTag | undefined {
    if (!userId) return undefined;

    return readData(storage).tags[userId];
}

export function setUserTag(storage: TagStorage, userId: string, tag: UserTag): Promise<void> {
    return write(storage, (data) => {
        data.tags[userId] = tag;
    });
}

export function removeUserTag(storage: TagStorage, userId: string): Promise<void> {
    return write(storage, (data) => {
        delete data.tags[userId];
    });
}

export function getSavedTag(
    storage: TagStorage | undefined,
    templateName: string,
): UserTag | undefined {
    return readData(storage).savedTags[templateName];
}

export function setSavedTag(storage: TagStorage, templateName: string, tag: UserTag): Promise<void> {
    return write(storage, (data) => {
        data.savedTags[templateName] = tag;
    });
}

export function removeSavedTag(storage: TagStorage, templateName: string): Promise<void> {
    return write(storage, (data) => {
        delete data.savedTags[templateName];
    });
}
