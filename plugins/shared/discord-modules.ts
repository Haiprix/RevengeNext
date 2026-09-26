// Shared Discord module ID store for plugins. Module IDs shift between Discord
// builds; they're refreshed here by scripts/update-discord-module-ids.mjs from
// lvwmwm/decord's data branch (https://github.com/lvwmwm/decord/tree/data) on the
// latest build. Module paths are stable across builds; you can add/remove entries
// here and the script only updates the IDs.

export const discordBuild = 348205

export const discordModules = {
	'modules/main_tabs_v2/native/tabs/you/utils/showYouAccountActionSheet.tsx': 16010,
	'modules/main_tabs_v2/native/tabs/you/YouAccountActionSheet.tsx': 16012,
	'modules/user_profile/native/showUserProfileActionSheet.tsx': 7624,
	'modules/create_guild/native/CreateGuildModalActionCreators.tsx': 12205,
	'asyncRequireImpl': 1981,
} as const
