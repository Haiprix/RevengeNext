import { applyPatches } from "@shared/lib/patcher";
import patchChat from "./patches/chat";
import patchName from "./patches/name";
import patchDetails from "./patches/details";
import patchProfile from "./patches/profile";
import patchTag from "./patches/tag";
import Settings from "./ui/Settings";
import { setTagStorage } from "./lib/resolveTag";

import type { CustomTagsStorage } from "./lib/tags";

export const DEFAULTS: CustomTagsStorage = {
    tags: {},
    savedTags: {},
}

let unpatchAll: () => void = () => {}

export default plugin<{
    jsonStorage: CustomTagsStorage
}>({
    jsonStorage: {
        load: true,
        default: DEFAULTS,
    },
    start({ cleanup, jsonStorage, plugin }) {
        const id = plugin.manifest.id
        setTagStorage(jsonStorage)

        const { logger } = revenge.discord.common

        unpatchAll = applyPatches("Custom User Tags", logger, {
            tag: () => patchTag(jsonStorage),
            chat: () => patchChat(jsonStorage),
            name: () => patchName(jsonStorage),
            details: () => patchDetails(jsonStorage),
            profile: () => patchProfile(jsonStorage),
        })

        cleanup(() => unpatchAll())
    },

    stop() {
        unpatchAll()
        unpatchAll = () => {}
    },
    SettingsComponent: Settings,
})
